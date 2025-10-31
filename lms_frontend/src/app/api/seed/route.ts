import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * SECURITY: Database seed/clear endpoint
 * DISABLED IN PRODUCTION for security
 * Only available in development mode
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Disable in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is disabled in production for security reasons.' },
        { status: 403 }
      );
    }

    // SECURITY: Require authentication
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // SECURITY: Only superadmin can clear database
    if (session.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only superadmin can perform this action.' },
        { status: 403 }
      );
    }

    const { action } = await request.json();

    if (action !== 'clear') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "clear" to clean database.' },
        { status: 400 }
      );
    }

    // Clear existing data only - no demo user creation
    await clearCollections();

    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully. No demo users created.',
    });
  } catch (error) {
    console.error('Database clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}

async function clearCollections() {
  const collections = [
    COLLECTIONS.USERS,
    COLLECTIONS.CLASSES,
    COLLECTIONS.STUDENT_PROFILES,
    COLLECTIONS.ASSIGNMENTS,
    COLLECTIONS.SUBMISSIONS,
    COLLECTIONS.PROGRESS,
    COLLECTIONS.ANALYTICS,
    COLLECTIONS.CHAT_CONVERSATIONS,
    COLLECTIONS.CLASS_CHATS,
    COLLECTIONS.SCHOOLS,
    COLLECTIONS.SCHOOL_INVITATIONS,
    COLLECTIONS.SCHOOL_CODES,
    COLLECTIONS.ACADEMIC_PLANS,
    COLLECTIONS.CURRICULUM_PROGRESS,
    COLLECTIONS.STUDY_MATERIALS,
    COLLECTIONS.QUESTION_BANK,
    COLLECTIONS.QUESTION_ATTEMPTS,
    COLLECTIONS.TEACHER_PERFORMANCE,
    COLLECTIONS.TEACHER_QUESTION_SETS,
    COLLECTIONS.STUDENT_QUESTION_VARIANTS,
    COLLECTIONS.STUDENT_QUESTION_CHOICES,
    COLLECTIONS.STUDENT_LEARNING_PROFILES,
  ];

  for (const collectionName of collections) {
    const collection = await getCollection(collectionName);
    await collection.deleteMany({});
  }
  
  console.log('✅ Database cleared successfully - no demo users created');
}

/**
 * SECURITY: Disable GET endpoint in production
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is disabled in production for security reasons.' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Database clear endpoint available (development only). POST with {"action": "clear"} to clean database.',
    warning: 'This endpoint requires superadmin authentication and is disabled in production.',
  });
}