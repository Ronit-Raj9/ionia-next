import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, OneToOneChat, OneToOneChatMessage } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * GET /api/chats/[chatId] - Get messages for a specific chat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Allow admins and superadmins to view all chats, but only teachers and students can participate
    const isAdmin = session.role === 'admin' || session.role === 'superadmin';
    if (!isAdmin && session.role !== 'teacher' && session.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and students can access chats' },
        { status: 403 }
      );
    }

    const { chatId } = params;
    if (!chatId || !ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { success: false, error: 'Valid chat ID is required' },
        { status: 400 }
      );
    }

    const chatsCollection = await getCollection(COLLECTIONS.ONE_TO_ONE_CHATS);

    // Find chat and verify user has access
    const chat = await chatsCollection.findOne({
      _id: new ObjectId(chatId),
      isActive: true
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Check if user is participant or admin/superadmin
    const isParticipant = 
      (session.role === 'teacher' && chat.teacherId === session.userId) ||
      (session.role === 'student' && chat.studentId === session.userId);

    if (!isParticipant && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to access this chat' },
        { status: 403 }
      );
    }

    // Filter out deleted messages
    const messages = (chat.messages || [])
      .filter((msg: OneToOneChatMessage) => !msg.isDeleted)
      .sort((a: OneToOneChatMessage, b: OneToOneChatMessage) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    // Determine other user (for admins, show both users info)
    let otherUser;
    if (isAdmin) {
      // For admins viewing chats, default to showing teacher info
      otherUser = {
        userId: chat.teacherId,
        name: chat.teacherName,
        role: 'teacher' as const
      };
    } else {
      otherUser = session.role === 'teacher'
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
    }

    return NextResponse.json({
      success: true,
      data: {
        chat: {
          _id: chat._id?.toString(),
          otherUser,
          messages: messages.map((msg: OneToOneChatMessage) => ({
            _id: msg._id?.toString(),
            senderId: msg.senderId,
            senderRole: msg.senderRole,
            senderName: msg.senderName,
            messageType: msg.messageType,
            content: msg.content,
            attachments: msg.attachments || [],
            timestamp: msg.timestamp
          })),
          isBlocked: chat.isBlocked,
          blockedBy: chat.blockedBy
        }
      }
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chats/[chatId] - Delete a chat (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Allow admins and superadmins to delete chats, but only teachers and students can delete their own
    const isAdmin = session.role === 'admin' || session.role === 'superadmin';
    if (!isAdmin && session.role !== 'teacher' && session.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and students can delete chats' },
        { status: 403 }
      );
    }

    const { chatId } = params;
    if (!chatId || !ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { success: false, error: 'Valid chat ID is required' },
        { status: 400 }
      );
    }

    const chatsCollection = await getCollection(COLLECTIONS.ONE_TO_ONE_CHATS);

    // Find chat and verify user has access
    const chat = await chatsCollection.findOne({
      _id: new ObjectId(chatId),
      isActive: true
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Check if user is participant or admin/superadmin
    const isParticipant = 
      (session.role === 'teacher' && chat.teacherId === session.userId) ||
      (session.role === 'student' && chat.studentId === session.userId);

    if (!isParticipant && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this chat' },
        { status: 403 }
      );
    }

    // Soft delete
    await chatsCollection.updateOne(
      { _id: chat._id },
      {
        $set: {
          isActive: false,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}

