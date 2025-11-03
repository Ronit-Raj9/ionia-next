import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, OneToOneChat } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * POST /api/chats/[chatId]/block - Block or unblock a chat
 */
export async function POST(
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

    if (session.role !== 'teacher' && session.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and students can block chats' },
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

    const { block } = await request.json();

    if (typeof block !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Block parameter (boolean) is required' },
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

    // Check if user is participant
    const isParticipant = 
      (session.role === 'teacher' && chat.teacherId === session.userId) ||
      (session.role === 'student' && chat.studentId === session.userId);

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to block this chat' },
        { status: 403 }
      );
    }

    // Update blocking status
    await chatsCollection.updateOne(
      { _id: chat._id },
      {
        $set: {
          isBlocked: block,
          blockedBy: block ? session.userId : undefined,
          blockedAt: block ? new Date() : undefined,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: block ? 'Chat blocked successfully' : 'Chat unblocked successfully'
    });
  } catch (error) {
    console.error('Error blocking/unblocking chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to block/unblock chat' },
      { status: 500 }
    );
  }
}

