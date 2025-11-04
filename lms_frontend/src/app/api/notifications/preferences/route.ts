import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, NotificationPreferences } from '@/lib/db';

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const preferencesCollection = await getCollection(COLLECTIONS.NOTIFICATION_PREFERENCES);
    let preferences = await preferencesCollection.findOne({ userId });

    // Create default preferences if none exist
    if (!preferences) {
      const defaultPreferences: Omit<NotificationPreferences, '_id'> = {
        userId,
        channels: {
          inApp: true,
          email: true,
          push: false,
          sms: false,
        },
        notificationTypes: {
          assignments: true,
          grading: true,
          deadlines: true,
          achievements: true,
          messages: true,
          classUpdates: true,
          systemUpdates: true,
          reminders: true,
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'UTC',
        },
        digest: {
          enabled: false,
          frequency: 'daily',
          time: '08:00',
        },
        aiPersonalization: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await preferencesCollection.insertOne(defaultPreferences);
      preferences = { ...defaultPreferences, _id: result.insertedId };
    }

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/preferences
 * Update user's notification preferences
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const preferencesCollection = await getCollection(COLLECTIONS.NOTIFICATION_PREFERENCES);
    
    const result = await preferencesCollection.updateOne(
      { userId },
      {
        $set: {
          ...preferences,
          updatedAt: new Date()
        },
        $setOnInsert: {
          userId,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      upserted: result.upsertedId ? true : false
    });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

