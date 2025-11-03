import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, OneToOneChat } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * GET /api/chats - List all chats for the current user (teacher or student)
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
        { success: false, error: 'Only teachers and students can access chats' },
        { status: 403 }
      );
    }

    const chatsCollection = await getCollection(COLLECTIONS.ONE_TO_ONE_CHATS);

    // Find all chats where user is either teacher or student
    const query = session.role === 'teacher'
      ? { teacherId: session.userId, isActive: true }
      : { studentId: session.userId, isActive: true };

    const chats = await chatsCollection
      .find(query)
      .sort({ lastActivity: -1 })
      .toArray() as OneToOneChat[];

    // Format response with participant info
    const formattedChats = chats.map((chat: OneToOneChat) => {
      const otherUser = session.role === 'teacher'
        ? {
            userId: chat.studentId,
            name: chat.studentName,
            role: 'student' as const
          }
        : {
            userId: chat.teacherId,
            name: chat.teacherName,
            role: 'teacher' as const
          };

      return {
        _id: chat._id?.toString(),
        chatId: chat._id?.toString(),
        otherUser,
        lastMessage: chat.lastMessage ? {
          content: chat.lastMessage.content,
          timestamp: chat.lastMessage.timestamp,
          senderId: chat.lastMessage.senderId
        } : null,
        lastActivity: chat.lastActivity,
        isBlocked: chat.isBlocked,
        blockedBy: chat.blockedBy,
        createdAt: chat.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      data: { chats: formattedChats }
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chats - Create a new one-to-one chat
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only teachers and students can create chats (admins view only)
    if (session.role !== 'teacher' && session.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and students can create chats' },
        { status: 403 }
      );
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Target user ID is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const chatsCollection = await getCollection(COLLECTIONS.ONE_TO_ONE_CHATS);

    // Get current user and target user
    const currentUser = await usersCollection.findOne({ userId: session.userId });
    const targetUser = await usersCollection.findOne({ userId: targetUserId });

    if (!currentUser || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate: teacher can only chat with students, student can only chat with teachers
    if (session.role === 'teacher' && targetUser.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Teachers can only chat with students' },
        { status: 400 }
      );
    }

    if (session.role === 'student' && targetUser.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Students can only chat with teachers' },
        { status: 400 }
      );
    }

    // Ensure same school (teachers and students can only chat within their school)
    if (currentUser.schoolId?.toString() !== targetUser.schoolId?.toString()) {
      return NextResponse.json(
        { success: false, error: 'Cannot chat with users from different schools' },
        { status: 400 }
      );
    }

    // Check if chat already exists
    const teacherId = session.role === 'teacher' ? session.userId : targetUserId;
    const studentId = session.role === 'teacher' ? targetUserId : session.userId;

    const existingChat = await chatsCollection.findOne({
      teacherId,
      studentId,
      isActive: true
    });

    if (existingChat) {
      // Return existing chat
      const otherUser = session.role === 'teacher'
        ? {
            userId: existingChat.studentId,
            name: existingChat.studentName,
            role: 'student' as const
          }
        : {
            userId: existingChat.teacherId,
            name: existingChat.teacherName,
            role: 'teacher' as const
          };

      return NextResponse.json({
        success: true,
        data: {
          chat: {
            _id: existingChat._id?.toString(),
            chatId: existingChat._id?.toString(),
            otherUser,
            lastMessage: existingChat.lastMessage ? {
              content: existingChat.lastMessage.content,
              timestamp: existingChat.lastMessage.timestamp,
              senderId: existingChat.lastMessage.senderId
            } : null,
            lastActivity: existingChat.lastActivity,
            isBlocked: existingChat.isBlocked,
            blockedBy: existingChat.blockedBy,
            createdAt: existingChat.createdAt
          }
        }
      });
    }

    // Create new chat
    const teacher = teacherId === session.userId ? currentUser : targetUser;
    const student = studentId === session.userId ? currentUser : targetUser;

    const newChat: Omit<OneToOneChat, '_id'> = {
      teacherId: teacher.userId,
      teacherName: teacher.name || teacher.displayName || 'Teacher',
      studentId: student.userId,
      studentName: student.name || student.displayName || 'Student',
      schoolId: currentUser.schoolId as ObjectId,
      messages: [],
      lastActivity: new Date(),
      isBlocked: false,
      createdBy: session.userId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await chatsCollection.insertOne(newChat);

    const otherUser = session.role === 'teacher'
      ? {
          userId: newChat.studentId,
          name: newChat.studentName,
          role: 'student' as const
        }
      : {
          userId: newChat.teacherId,
          name: newChat.teacherName,
          role: 'teacher' as const
        };

    return NextResponse.json({
      success: true,
      data: {
        chat: {
          _id: result.insertedId.toString(),
          chatId: result.insertedId.toString(),
          otherUser,
          lastMessage: null,
          lastActivity: newChat.lastActivity,
          isBlocked: false,
          createdAt: newChat.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}

