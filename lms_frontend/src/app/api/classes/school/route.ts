import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, Class } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Fetch all classes for a specific school
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');

    // Validate required parameters
    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'SchoolId is required' },
        { status: 400 }
      );
    }

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['teacher', 'student', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);
    
    // Handle both string and ObjectId schoolId formats
    let schoolIdQuery: any;
    if (ObjectId.isValid(schoolId)) {
      // If it's a valid ObjectId string, convert it
      schoolIdQuery = new ObjectId(schoolId);
    } else {
      // If it's not a valid ObjectId, use it as string (for existing data)
      schoolIdQuery = schoolId;
    }
    
    // Build query based on role and school
    const query: any = { 
      schoolId: schoolIdQuery, 
      isActive: true 
    };
    
    // Filter based on role
    if (role === 'teacher') {
      query.teacherId = userId;
    } else if (role === 'student') {
      query.studentIds = { $in: [userId] };
    }
    // Admin can see all classes in the school

    console.log('Querying classes with query:', JSON.stringify(query, null, 2));
    
    const classes = await classesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray() as unknown as Class[];

    console.log('Found classes:', classes.length, classes);

    // Enrich classes with real data
    const enrichedClasses = await Promise.all(
      classes.map(async (classData) => {
        // Get real assignment count
        const assignmentCount = await assignmentsCollection.countDocuments({
          classId: classData._id?.toString()
        });

        // Get real unread message status from class chats
        const classChat = await classChatsCollection.findOne({
          classId: classData._id?.toString()
        });

        let hasUnreadMessages = false;
        if (classChat && classChat.messages) {
          // Check if there are unread messages for this user
          const unreadCount = classChat.messages.filter((message: any) => 
            !message.isRead && message.senderId !== userId
          ).length;
          hasUnreadMessages = unreadCount > 0;
        }

        return {
          ...classData,
          studentCount: classData.studentIds?.length || 0,
          lastActivity: classData.updatedAt || classData.createdAt,
          hasUnreadMessages,
          recentAssignments: assignmentCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedClasses
    });
  } catch (error) {
    console.error('Error fetching school classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch school classes' },
      { status: 500 }
    );
  }
}
