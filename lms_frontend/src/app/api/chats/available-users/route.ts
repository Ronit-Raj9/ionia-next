import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * GET /api/chats/available-users - Get list of users available to chat with
 * For teachers: returns all students in the school
 * For students: returns all teachers in the school
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.role !== 'teacher' && session.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and students can access this' },
        { status: 403 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const chatsCollection = await getCollection(COLLECTIONS.ONE_TO_ONE_CHATS);

    // Get current user to get schoolId
    const currentUser = await usersCollection.findOne({ userId: session.userId });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Find target role users in same school
    const targetRole = session.role === 'teacher' ? 'student' : 'teacher';
    
    const query: any = {
      role: targetRole,
      $or: [
        { status: 'active' },
        { status: { $exists: false } }
      ]
    };

    // Filter by school (teachers and students can only chat within their school)
    if (currentUser.schoolId) {
      query.schoolId = currentUser.schoolId instanceof Object ? currentUser.schoolId : new ObjectId(currentUser.schoolId);
    }

    const availableUsers = await usersCollection.find(query).toArray();

    // Get existing chats to mark who user has already chatted with
    const existingChats = await chatsCollection.find({
      isActive: true,
      $or: [
        session.role === 'teacher' 
          ? { teacherId: session.userId }
          : { studentId: session.userId }
      ]
    }).toArray();

    const chattedWithUserIds = new Set(
      existingChats.map((chat: any) => 
        session.role === 'teacher' ? chat.studentId : chat.teacherId
      )
    );

    // Format users with class information
    const formattedUsers = await Promise.all(
      availableUsers.map(async (user: any) => {
        // Get classes for student (if student)
        let classes: any[] = [];
        if (targetRole === 'student') {
          classes = await classesCollection.find({
            studentIds: user.userId
          }).toArray();
        } else if (targetRole === 'teacher') {
          classes = await classesCollection.find({
            teacherId: user.userId
          }).toArray();
        }

        return {
          userId: user.userId,
          name: user.name || user.displayName || (targetRole === 'teacher' ? 'Teacher' : 'Student'),
          email: user.email,
          role: user.role,
          classes: classes.map((c: any) => ({
            _id: c._id?.toString(),
            className: c.className,
            subject: c.subject
          })),
          hasChatted: chattedWithUserIds.has(user.userId)
        };
      })
    );

    // Sort: users with existing chats first, then alphabetically
    formattedUsers.sort((a, b) => {
      if (a.hasChatted !== b.hasChatted) {
        return a.hasChatted ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      data: { users: formattedUsers }
    });
  } catch (error) {
    console.error('Error fetching available users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available users' },
      { status: 500 }
    );
  }
}

