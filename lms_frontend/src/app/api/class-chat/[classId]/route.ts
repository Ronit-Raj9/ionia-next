import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, ClassChat, ClassChatMessage } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { uploadFile, validateFile } from '@/lib/cloudinary';

// GET - Fetch chat messages for a class
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

    // Find or create class chat
    let classChat = await classChatsCollection.findOne({
      classId: classId
    });

    if (!classChat) {
      // Create new chat if it doesn't exist
      const usersCollection = await getCollection(COLLECTIONS.USERS);
      const teacher = await usersCollection.findOne({ userId: classData.teacherId });
      const teacherName = teacher?.name || teacher?.displayName || 'Teacher';

      const newChat: Omit<ClassChat, '_id'> = {
        classId: classId,
        teacherId: classData.teacherId,
        teacherName: teacherName,
        className: classData.className,
        description: classData.description,
        participants: [
          {
            userId: classData.teacherId,
            role: 'teacher',
            name: teacherName,
            joinedAt: new Date(),
            isActive: true
          },
          ...classData.studentIds.map((studentId: string) => ({
            userId: studentId,
            role: 'student' as const,
            name: `Student ${studentId}`,
            joinedAt: new Date(),
            isActive: true
          }))
        ],
        messages: [],
        lastActivity: new Date(),
        settings: {
          allowStudentMessages: true,
          allowFileSharing: false,
          moderationEnabled: false,
          allowReactions: false
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await classChatsCollection.insertOne(newChat);
      classChat = { _id: result.insertedId, ...newChat };
    }

    // Check if student is muted
    const participant = classChat.participants.find((p: { userId: string; role: string; name: string; joinedAt: Date | string; isActive: boolean }) => p.userId === session.userId);
    const isMuted = participant ? !participant.isActive : false;

    // Return messages (sorted by timestamp, newest last)
    const messages = classChat.messages || [];
    messages.sort((a: ClassChatMessage, b: ClassChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map((msg: ClassChatMessage) => ({
          _id: msg._id?.toString(),
          senderId: msg.senderId,
          senderRole: msg.senderRole,
          senderName: msg.senderName,
          messageType: msg.messageType,
          content: msg.content,
          attachments: msg.attachments || [],
          timestamp: msg.timestamp,
          reactions: msg.reactions || []
        })),
        settings: classChat.settings,
        isMuted: session.role === 'student' ? isMuted : false,
        participants: classChat.participants
      }
    });
  } catch (error) {
    console.error('Error fetching class chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

// POST - Send a message to class chat
export async function POST(
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

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);
    const usersCollection = await getCollection(COLLECTIONS.USERS);

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
        { success: false, error: 'You do not have permission to send messages to this class chat' },
        { status: 403 }
      );
    }

    if (session.role === 'student' && !classData.studentIds.includes(session.userId)) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this class' },
        { status: 403 }
      );
    }

    // Find or create class chat
    let classChat = await classChatsCollection.findOne({
      classId: classId
    });

    if (!classChat) {
      // Create new chat if it doesn't exist
      const teacher = await usersCollection.findOne({ userId: classData.teacherId });
      const teacherName = teacher?.name || teacher?.displayName || 'Teacher';

      const newChat: Omit<ClassChat, '_id'> = {
        classId: classId,
        teacherId: classData.teacherId,
        teacherName: teacherName,
        className: classData.className,
        description: classData.description,
        participants: [
          {
            userId: classData.teacherId,
            role: 'teacher',
            name: teacherName,
            joinedAt: new Date(),
            isActive: true
          },
          ...classData.studentIds.map((studentId: string) => ({
            userId: studentId,
            role: 'student' as const,
            name: `Student ${studentId}`,
            joinedAt: new Date(),
            isActive: true
          }))
        ],
        messages: [],
        lastActivity: new Date(),
        settings: {
          allowStudentMessages: true,
          allowFileSharing: false,
          moderationEnabled: false,
          allowReactions: false
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await classChatsCollection.insertOne(newChat);
      classChat = { _id: result.insertedId, ...newChat };
    }

    // Check if student is muted
    if (session.role === 'student') {
      const participant = classChat.participants.find((p: { userId: string; role: string; name: string; joinedAt: Date | string; isActive: boolean }) => p.userId === session.userId);
      if (participant && !participant.isActive) {
        return NextResponse.json(
          { success: false, error: 'You are muted and cannot send messages' },
          { status: 403 }
        );
      }
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
        const uploadResult = await uploadFile(buffer, file.name, 'class-chat');
        
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

    // Create new message with unique ID
    const newMessage: ClassChatMessage = {
      _id: new ObjectId(),
      senderId: session.userId,
      senderRole: session.role === 'teacher' ? 'teacher' : 'student',
      senderName: senderName,
      messageType: messageType as 'text' | 'image' | 'document',
      content: content.trim() || (attachments.length > 0 ? `${attachments.length} file${attachments.length > 1 ? 's' : ''} shared` : ''),
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: new Date(),
      reactions: []
    };

    // Add message to chat
    const messages = classChat.messages || [];
    messages.push(newMessage);

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
      data: {
        message: {
          _id: newMessage._id?.toString() || new ObjectId().toString(),
          senderId: newMessage.senderId,
          senderRole: newMessage.senderRole,
          senderName: newMessage.senderName,
          messageType: newMessage.messageType,
          content: newMessage.content,
          attachments: newMessage.attachments || [],
          timestamp: newMessage.timestamp,
          reactions: newMessage.reactions
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

