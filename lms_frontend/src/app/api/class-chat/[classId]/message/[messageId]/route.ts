import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

// DELETE - Delete a message (teacher can delete any, user can delete own)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { classId: string; messageId: string } }
) {
  try {
    // Authenticate user
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { classId, messageId } = params;

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, error: 'Valid class ID is required' },
        { status: 400 }
      );
    }

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);

    // Verify class exists
    const classData = await classesCollection.findOne({
      _id: new ObjectId(classId)
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Find class chat
    const classChat = await classChatsCollection.findOne({
      classId: classId
    });

    if (!classChat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Find the message
    const messages = classChat.messages || [];
    const messageIndex = messages.findIndex(
      (msg: any) => {
        // Check if message has _id that matches
        if (msg._id) {
          const msgId = typeof msg._id === 'string' ? msg._id : msg._id.toString();
          return msgId === messageId;
        }
        // Fallback: check if it's the sender's message and we can use index
        // (less reliable but handles messages without _id)
        return false;
      }
    );

    if (messageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    const message = messages[messageIndex];

    // Check permissions
    // Teachers can delete any message, users can only delete their own
    if (session.role !== 'teacher' && message.senderId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this message' },
        { status: 403 }
      );
    }

    // Remove message
    messages.splice(messageIndex, 1);

    await classChatsCollection.updateOne(
      { _id: classChat._id },
      {
        $set: {
          messages: messages,
          lastActivity: new Date(),
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

