import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, ClassChatMessage } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

// GET - Search messages in class chat
export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
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

    const { classId } = params;
    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, error: 'Valid class ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);

    // Verify class exists and user has access
    const classData = await classesCollection.findOne({
      _id: new ObjectId(classId)
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.role === 'teacher' && classData.teacherId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to access this class chat' },
        { status: 403 }
      );
    }

    if (session.role === 'student' && !classData.studentIds.includes(session.userId)) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this class' },
        { status: 403 }
      );
    }

    // Find class chat
    const classChat = await classChatsCollection.findOne({
      classId: classId
    });

    if (!classChat || !classChat.messages || classChat.messages.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          query: query.trim(),
          count: 0
        }
      });
    }

    // Search messages (case-insensitive)
    const searchTerm = query.trim().toLowerCase();
    const messages = classChat.messages || [];
    const results = messages.filter((msg: ClassChatMessage) => 
      msg.content && msg.content.toLowerCase().includes(searchTerm)
    ).map((msg: ClassChatMessage) => ({
      _id: msg._id?.toString(),
      senderId: msg.senderId,
      senderRole: msg.senderRole,
      senderName: msg.senderName,
      messageType: msg.messageType,
      content: msg.content,
      timestamp: msg.timestamp,
      // Highlight matching text (simple approach - can be enhanced)
      highlightedContent: msg.content
    }));

    return NextResponse.json({
      success: true,
      data: {
        results: results,
        query: query.trim(),
        count: results.length
      }
    });
  } catch (error) {
    console.error('Error searching chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search messages' },
      { status: 500 }
    );
  }
}

