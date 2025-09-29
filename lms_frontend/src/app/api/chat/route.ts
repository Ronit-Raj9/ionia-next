import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, ChatConversation, ChatMessage } from '@/lib/db';
import { uploadFile } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';

// GET - Retrieve chat conversations for a teacher
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');
    const conversationId = searchParams.get('conversationId');

    // Validate role
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!teacherId || !classId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and Class ID are required' },
        { status: 400 }
      );
    }

    const chatCollection = await getCollection(COLLECTIONS.CHAT_CONVERSATIONS);

    if (conversationId) {
      // Get specific conversation
      const conversation = await chatCollection.findOne({
        _id: new ObjectId(conversationId),
        teacherId,
        classId
      }) as unknown as ChatConversation;

      if (!conversation) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: conversation
      });
    } else {
      // Get all conversations for teacher
      const conversations = await chatCollection
        .find({ teacherId, classId })
        .sort({ lastActivity: -1 })
        .toArray() as unknown as ChatConversation[];

      return NextResponse.json({
        success: true,
        data: conversations
      });
    }
  } catch (error) {
    console.error('Error fetching chat conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST - Create new conversation or send message
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const role = formData.get('role') as string;
    const teacherId = formData.get('teacherId') as string;
    const classId = formData.get('classId') as string;
    const conversationId = formData.get('conversationId') as string;
    const messageContent = formData.get('content') as string;
    const messageType = formData.get('messageType') as string || 'text';
    const files = formData.getAll('files') as File[];

    // Validate role
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!teacherId || !classId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and Class ID are required' },
        { status: 400 }
      );
    }

    const chatCollection = await getCollection(COLLECTIONS.CHAT_CONVERSATIONS);
    const now = new Date();

    // Handle file attachments
    let attachments: any[] = [];
    if (files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await uploadFile(buffer, file.name, 'chat');
        
        if (!uploadResult.success) {
          throw new Error(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }
        
        return {
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: uploadResult.url!,
          fileName: file.name,
          fileSize: file.size
        };
      });

      attachments = await Promise.all(uploadPromises);
    }

    // Create message object
    const newMessage: ChatMessage = {
      _id: new ObjectId(),
      senderId: teacherId,
      senderRole: role as 'teacher' | 'admin',
      messageType: messageType as 'text' | 'image' | 'document',
      content: messageContent || '',
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: now,
      isRead: false
    };

    if (conversationId) {
      // Add message to existing conversation
      const result = await chatCollection.updateOne(
        { _id: new ObjectId(conversationId), teacherId, classId },
        {
          $push: { messages: newMessage } as any,
          $set: { 
            lastMessage: newMessage,
            lastActivity: now,
            updatedAt: now
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { messageId: newMessage._id, conversationId }
      });
    } else {
      // Create new conversation
      const title = formData.get('title') as string || `Daily Input - ${now.toLocaleDateString()}`;
      const description = formData.get('description') as string;

      const newConversation: ChatConversation = {
        teacherId,
        classId,
        title,
        description,
        lastMessage: newMessage,
        lastActivity: now,
        messages: [newMessage],
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      const result = await chatCollection.insertOne(newConversation);

      return NextResponse.json({
        success: true,
        data: { 
          conversationId: result.insertedId,
          messageId: newMessage._id
        }
      });
    }
  } catch (error) {
    console.error('Error handling chat request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// PUT - Update conversation or mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const { conversationId, action, teacherId, classId } = await request.json();

    if (!conversationId || !teacherId || !classId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const chatCollection = await getCollection(COLLECTIONS.CHAT_CONVERSATIONS);

    if (action === 'mark_read') {
      // Mark all messages in conversation as read
      const result = await chatCollection.updateOne(
        { _id: new ObjectId(conversationId), teacherId, classId },
        {
          $set: { 
            'messages.$[].isRead': true,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}
