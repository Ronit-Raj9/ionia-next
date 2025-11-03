import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, OneToOneChat } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * DELETE /api/chats/[chatId]/message/[messageId] - Delete a message
 * Supports both sender deletion (soft delete) and both parties deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
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
        { success: false, error: 'Only teachers and students can delete messages' },
        { status: 403 }
      );
    }

    const { chatId, messageId } = params;
    if (!chatId || !ObjectId.isValid(chatId) || !messageId || !ObjectId.isValid(messageId)) {
      return NextResponse.json(
        { success: false, error: 'Valid chat ID and message ID are required' },
        { status: 400 }
      );
    }

    const { deleteForBoth } = await request.json().catch(() => ({ deleteForBoth: false }));

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
        { success: false, error: 'You do not have permission to delete messages in this chat' },
        { status: 403 }
      );
    }

    // Find message
    const messages = chat.messages || [];
    const messageIndex = messages.findIndex((msg: any) => msg._id?.toString() === messageId);

    if (messageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    const message = messages[messageIndex];

    // Check if user is sender
    if (message.senderId !== session.userId && !deleteForBoth) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own messages' },
        { status: 403 }
      );
    }

    // If deleteForBoth is true, user must be sender
    if (deleteForBoth && message.senderId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Only the message sender can delete for both parties' },
        { status: 403 }
      );
    }

    // Delete message
    if (deleteForBoth) {
      // Remove from array
      messages.splice(messageIndex, 1);
    } else {
      // Soft delete (mark as deleted)
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = session.userId;
      messages[messageIndex] = message;
    }

    // Update last message if needed
    let lastMessage = chat.lastMessage;
    if (lastMessage && lastMessage._id?.toString() === messageId) {
      // Find the newest non-deleted message
      const nonDeletedMessages = messages.filter((msg: any) => !msg.isDeleted);
      lastMessage = nonDeletedMessages.length > 0 
        ? nonDeletedMessages[nonDeletedMessages.length - 1]
        : undefined;
    }

    // Update chat
    await chatsCollection.updateOne(
      { _id: chat._id },
      {
        $set: {
          messages: messages,
          lastMessage: lastMessage,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

