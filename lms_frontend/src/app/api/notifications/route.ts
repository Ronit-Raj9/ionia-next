import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Notification, NotificationPreferences } from '@/lib/db';
import { ObjectId } from 'mongodb';

/**
 * GET /api/notifications
 * Fetch notifications for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // 'unread', 'read', 'all'
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const notificationsCollection = await getCollection(COLLECTIONS.NOTIFICATIONS);
    
    // Build query
    const query: any = { userId };
    
    if (status === 'unread') {
      query.status = { $in: ['pending', 'sent', 'delivered'] };
    } else if (status === 'read') {
      query.status = 'read';
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Don't show expired notifications
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } }
    ];

    const notifications = await notificationsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const unreadCount = await notificationsCollection.countDocuments({
      userId,
      status: { $in: ['pending', 'sent', 'delivered'] },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } }
      ]
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      totalCount: notifications.length
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification (manual or system-triggered)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      type,
      userId,
      title,
      shortMessage,
      data,
      channels,
      priority,
      expiresAt,
      category,
      tags,
      createdBy,
      schoolId,
      classId,
      useAI
    } = body;

    // Extract message and scheduledFor as let variables so they can be reassigned
    let message = body.message;
    let scheduledFor = body.scheduledFor;

    // Validate required fields
    if (!userId || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      );
    }

    // Check user notification preferences
    const preferencesCollection = await getCollection(COLLECTIONS.NOTIFICATION_PREFERENCES);
    const preferences = await preferencesCollection.findOne({ userId }) as NotificationPreferences | null;
    
    // Respect user's notification preferences
    let effectiveChannels = channels || { inApp: true };
    if (preferences) {
      effectiveChannels = {
        inApp: preferences.channels.inApp && effectiveChannels.inApp,
        email: preferences.channels.email && effectiveChannels.email,
        push: preferences.channels.push && effectiveChannels.push,
        sms: preferences.channels.sms && effectiveChannels.sms,
      };
      
      // Check if this notification type is enabled
      const typeMap: Record<string, string> = {
        'assignment_created': 'assignments',
        'assignment_due_soon': 'deadlines',
        'assignment_graded': 'grading',
        'feedback_available': 'grading',
        'achievement_earned': 'achievements',
        'message_received': 'messages',
        'class_update': 'classUpdates',
        'system': 'systemUpdates',
        'reminder': 'reminders',
      };
      
      const prefKey = typeMap[type] || 'systemUpdates';
      if (!preferences.notificationTypes[prefKey as keyof typeof preferences.notificationTypes]) {
        return NextResponse.json({
          success: true,
          message: 'Notification blocked by user preferences',
          sent: false
        });
      }
    }

    // AI-enhanced notification (personalize message, optimize timing)
    let aiInsights = undefined;
    if (useAI && preferences?.aiPersonalization) {
      try {
        const aiResponse = await fetch('http://localhost:8000/api/notifications/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            title,
            message,
            type,
            data
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsights = aiData.insights;
          
          // Use AI-suggested message if available
          if (aiInsights.personalizedMessage) {
            message = aiInsights.personalizedMessage;
          }
          
          // Use AI-suggested delivery time if available
          if (aiInsights.optimalDeliveryTime && !scheduledFor) {
            scheduledFor = aiInsights.optimalDeliveryTime;
          }
          
          console.log('✓ AI-enhanced notification:', aiInsights);
        }
      } catch (aiError) {
        console.warn('AI notification enhancement failed:', aiError);
      }
    }

    const notification: Omit<Notification, '_id'> = {
      type: type || 'custom',
      userId,
      schoolId: schoolId ? new ObjectId(schoolId) : undefined,
      classId,
      title,
      message,
      shortMessage,
      data,
      channels: effectiveChannels,
      status: scheduledFor ? 'pending' : 'sent',
      priority: priority || 'normal',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      category,
      tags,
      aiEnhanced: useAI || false,
      aiInsights,
      createdBy,
      createdAt: new Date(),
      sentAt: scheduledFor ? undefined : new Date(),
    };

    const notificationsCollection = await getCollection(COLLECTIONS.NOTIFICATIONS);
    const result = await notificationsCollection.insertOne(notification);

    return NextResponse.json({
      success: true,
      notificationId: result.insertedId,
      notification: { ...notification, _id: result.insertedId },
      aiInsights
    });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications
 * Mark notifications as read/dismissed
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationIds, action, userId } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { success: false, error: 'notificationIds array is required' },
        { status: 400 }
      );
    }

    const notificationsCollection = await getCollection(COLLECTIONS.NOTIFICATIONS);
    const objectIds = notificationIds.map(id => new ObjectId(id));
    
    const update: any = { updatedAt: new Date() };
    
    if (action === 'read') {
      update.status = 'read';
      update.readAt = new Date();
    } else if (action === 'dismiss') {
      update.dismissed = true;
      update.dismissedAt = new Date();
    } else if (action === 'click') {
      update.clicked = true;
      update.clickedAt = new Date();
    }

    const result = await notificationsCollection.updateMany(
      { _id: { $in: objectIds }, userId },
      { $set: update }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} notification(s) updated`
    });
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete old/expired notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const olderThan = searchParams.get('olderThan'); // days

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const notificationsCollection = await getCollection(COLLECTIONS.NOTIFICATIONS);
    
    const query: any = { userId };
    
    if (olderThan) {
      const days = parseInt(olderThan);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      query.createdAt = { $lt: cutoffDate };
    }

    const result = await notificationsCollection.deleteMany(query);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} notification(s) deleted`
    });
  } catch (error: any) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

