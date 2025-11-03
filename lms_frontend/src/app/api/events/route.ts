import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Event } from '@/lib/db';
import { ObjectId } from 'mongodb';

/**
 * GET /api/events
 * Fetch events for user/class/school
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const classId = searchParams.get('classId');
    const schoolId = searchParams.get('schoolId');
    const role = searchParams.get('role');
    const status = searchParams.get('status') || 'all';
    const from = searchParams.get('from'); // date filter
    const to = searchParams.get('to'); // date filter

    if (!userId && !classId && !schoolId) {
      return NextResponse.json(
        { success: false, error: 'At least one filter required: userId, classId, or schoolId' },
        { status: 400 }
      );
    }

    const eventsCollection = await getCollection(COLLECTIONS.EVENTS);
    
    // Build query
    const query: any = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Date range filter
    if (from || to) {
      query.scheduledAt = {};
      if (from) query.scheduledAt.$gte = new Date(from);
      if (to) query.scheduledAt.$lte = new Date(to);
    }
    
    // Audience filter
    if (userId) {
      query.$or = [
        { 'targetAudience.specificUsers': userId },
        { 'targetAudience.role': role },
        { createdBy: userId },
      ];
    }
    
    if (classId) {
      query['targetAudience.classIds'] = classId;
    }
    
    if (schoolId) {
      query.$or = query.$or || [];
      query.$or.push({ schoolId: new ObjectId(schoolId) });
    }

    const events = await eventsCollection
      .find(query)
      .sort({ scheduledAt: 1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event (with AI-powered scheduling suggestions)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      eventType,
      title,
      description,
      scheduledAt,
      endsAt,
      duration,
      classId,
      assignmentId,
      createdBy,
      targetAudience,
      priority,
      schoolId,
      useAI,
    } = body;

    // Validate required fields
    if (!title || !scheduledAt || !createdBy || !targetAudience) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, scheduledAt, createdBy, targetAudience' },
        { status: 400 }
      );
    }

    // If AI-powered scheduling is requested
    let aiInsights = undefined;
    if (useAI) {
      try {
        const aiResponse = await fetch('http://localhost:8000/api/events/optimize-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: eventType,
            scheduled_at: scheduledAt,
            duration: duration || 60,
            target_audience: targetAudience,
            assignment_id: assignmentId,
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsights = aiData.insights;
          
          console.log('✓ AI event scheduling insights:', aiInsights);
        }
      } catch (aiError) {
        console.warn('AI event scheduling failed, proceeding without AI:', aiError);
      }
    }

    const event: Omit<Event, '_id'> = {
      eventType: eventType || 'custom',
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      endsAt: endsAt ? new Date(endsAt) : undefined,
      duration,
      schoolId: schoolId ? new ObjectId(schoolId) : undefined,
      classId,
      assignmentId,
      createdBy,
      targetAudience,
      alerts: [], // Will be populated by notification system
      aiGenerated: useAI || false,
      aiInsights,
      priority: priority || 'medium',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const eventsCollection = await getCollection(COLLECTIONS.EVENTS);
    const result = await eventsCollection.insertOne(event);

    // Auto-create notifications for event
    await createEventNotifications(result.insertedId.toString(), event);

    return NextResponse.json({
      success: true,
      eventId: result.insertedId,
      event: { ...event, _id: result.insertedId },
      aiInsights
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/events
 * Update an existing event
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, updates } = body;

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { success: false, error: 'Valid eventId is required' },
        { status: 400 }
      );
    }

    const eventsCollection = await getCollection(COLLECTIONS.EVENTS);
    
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events
 * Cancel/delete an event
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const cancelReason = searchParams.get('cancelReason');
    const cancelledBy = searchParams.get('cancelledBy');

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { success: false, error: 'Valid eventId is required' },
        { status: 400 }
      );
    }

    const eventsCollection = await getCollection(COLLECTIONS.EVENTS);
    
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy,
          cancellationReason: cancelReason || 'No reason provided',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Send cancellation notifications
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    if (event) {
      await sendCancellationNotifications(event as Event);
    }

    return NextResponse.json({
      success: true,
      message: 'Event cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling event:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to create notifications for event
async function createEventNotifications(eventId: string, event: Omit<Event, '_id'>) {
  try {
    const notificationsCollection = await getCollection(COLLECTIONS.NOTIFICATIONS);
    const notifications = [];

    // Determine recipients
    const recipients = event.targetAudience.specificUsers || [];
    
    // Create notification for each recipient
    for (const userId of recipients) {
      const notification = {
        type: 'reminder' as const,
        userId,
        schoolId: event.schoolId,
        classId: event.classId,
        title: `Event: ${event.title}`,
        message: event.description || `You have an upcoming event: ${event.title}`,
        data: {
          eventId,
          assignmentId: event.assignmentId,
          link: `/events/${eventId}`,
          action: {
            label: 'View Event',
            url: `/events/${eventId}`
          }
        },
        channels: {
          inApp: true,
          email: true,
        },
        priority: event.priority === 'urgent' ? 'urgent' as const : 'normal' as const,
        status: 'pending' as const,
        scheduledFor: new Date(event.scheduledAt.getTime() - 24 * 60 * 60 * 1000), // 1 day before
        triggeredBy: {
          event: 'event_created',
          source: 'system' as const,
          sourceId: eventId
        },
        createdAt: new Date()
      };

      notifications.push(notification);
    }

    if (notifications.length > 0) {
      await notificationsCollection.insertMany(notifications);
      console.log(`✓ Created ${notifications.length} event notifications`);
    }
  } catch (error) {
    console.error('Error creating event notifications:', error);
  }
}

// Helper function to send cancellation notifications
async function sendCancellationNotifications(event: Event) {
  try {
    const notificationsCollection = await getCollection(COLLECTIONS.NOTIFICATIONS);
    const recipients = event.targetAudience.specificUsers || [];

    const notifications = recipients.map(userId => ({
      type: 'system' as const,
      userId,
      schoolId: event.schoolId,
      classId: event.classId,
      title: `Event Cancelled: ${event.title}`,
      message: `The event "${event.title}" scheduled for ${event.scheduledAt.toLocaleDateString()} has been cancelled. Reason: ${event.cancellationReason || 'Not specified'}`,
      data: {
        eventId: event._id?.toString(),
      },
      channels: {
        inApp: true,
        email: true,
      },
      priority: 'high' as const,
      status: 'pending' as const,
      triggeredBy: {
        event: 'event_cancelled',
        source: 'system' as const,
      },
      createdAt: new Date()
    }));

    if (notifications.length > 0) {
      await notificationsCollection.insertMany(notifications);
      console.log(`✓ Sent ${notifications.length} cancellation notifications`);
    }
  } catch (error) {
    console.error('Error sending cancellation notifications:', error);
  }
}

