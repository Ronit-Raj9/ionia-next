import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, OneToOneChat, OneToOneChatMessage } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { uploadFile, validateFile } from '@/lib/cloudinary';
import { checkRateLimit } from '@/lib/rateLimiter';

/**
 * POST /api/chats/[chatId]/message - Send a message in a chat
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
        { success: false, error: 'Only teachers and students can send messages' },
        { status: 403 }
      );
    }

    // Check rate limit (15 messages per minute)
    const rateLimit = checkRateLimit(session.userId, 15, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Rate limit exceeded. Please wait ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds before sending another message.` 
        },
        { status: 429 }
      );
    }

    const { chatId } = params;
    if (!chatId || !ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { success: false, error: 'Valid chat ID is required' },
        { status: 400 }
      );
    }

    // Handle both FormData (with files) and JSON (text only)
    let content = '';
    let files: File[] = [];
    
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = (formData.get('content') as string) || '';
      const filesArray = formData.getAll('files') as File[];
      files = filesArray.filter(file => file && file.size > 0);
    } else {
      const body = await request.json();
      content = body.content || '';
    }

    // Validate: must have content OR files
    if ((!content || content.trim().length === 0) && files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message content or file attachment is required' },
        { status: 400 }
      );
    }

    if (content && content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Message cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    // Validate files
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }

      const validation = validateFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error || 'Invalid file type' },
          { status: 400 }
        );
      }
    }

    const chatsCollection = await getCollection(COLLECTIONS.ONE_TO_ONE_CHATS);
    const usersCollection = await getCollection(COLLECTIONS.USERS);

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
        { success: false, error: 'You do not have permission to send messages in this chat' },
        { status: 403 }
      );
    }

    // Check if chat is blocked
    if (chat.isBlocked && chat.blockedBy !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'This chat is blocked' },
        { status: 403 }
      );
    }

    // Get sender name
    const sender = await usersCollection.findOne({ userId: session.userId });
    const senderName = sender?.name || sender?.displayName || session.name || 'User';

    // Upload files if any
    const attachments: Array<{
      type: 'image' | 'document';
      url: string;
      fileName: string;
      fileSize: number;
    }> = [];

    if (files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await uploadFile(buffer, file.name, 'chat');
        
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }

        // Determine file type
        const isImage = file.type.startsWith('image/');
        
        return {
          type: (isImage ? 'image' : 'document') as 'image' | 'document',
          url: uploadResult.url,
          fileName: file.name,
          fileSize: file.size
        };
      });

      try {
        const uploadedAttachments = await Promise.all(uploadPromises);
        attachments.push(...uploadedAttachments);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    // Determine message type
    const messageType = attachments.length > 0
      ? (attachments.some(a => a.type === 'image') ? 'image' : 'document')
      : 'text';

    // Create new message
    const newMessage: OneToOneChatMessage = {
      _id: new ObjectId(),
      senderId: session.userId,
      senderRole: session.role === 'teacher' ? 'teacher' : 'student',
      senderName: senderName,
      messageType: messageType as 'text' | 'image' | 'document',
      content: content.trim() || (attachments.length > 0 ? `${attachments.length} file${attachments.length > 1 ? 's' : ''} shared` : ''),
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: new Date()
    };

    // Add message to chat
    const messages = chat.messages || [];
    messages.push(newMessage);

    // Update chat with new message and last activity
    await chatsCollection.updateOne(
      { _id: chat._id },
      {
        $set: {
          messages: messages,
          lastMessage: newMessage,
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        message: {
          _id: newMessage._id?.toString() || new ObjectId().toString(),
          senderId: newMessage.senderId,
          senderRole: newMessage.senderRole,
          senderName: newMessage.senderName,
          messageType: newMessage.messageType,
          content: newMessage.content,
          attachments: newMessage.attachments || [],
          timestamp: newMessage.timestamp
        }
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

