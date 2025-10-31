import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, ClassChat, ClassChatMessage } from '@/lib/db';
import { uploadFile } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';

// GET - Retrieve class chat or list class chats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const classId = searchParams.get('classId');
    const chatId = searchParams.get('chatId');

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    let classChatsCollection;
    try {
      classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }

    // Get users collection to fetch teacher names
    const usersCollection = await getCollection(COLLECTIONS.USERS);

    if (chatId) {
      // Get specific class chat
      const classChat = await classChatsCollection.findOne({
        _id: new ObjectId(chatId),
        'participants.userId': userId,
        'participants.isActive': true
      }) as unknown as ClassChat;

      if (!classChat) {
        return NextResponse.json(
          { success: false, error: 'Class chat not found or access denied' },
          { status: 404 }
        );
      }

      // Ensure teacherName is populated
      if (!classChat.teacherName || classChat.teacherName === 'Teacher') {
        const teacher = await usersCollection.findOne({ userId: classChat.teacherId });
        const teacherName = teacher?.name || teacher?.displayName || 'Teacher';
        
        // Update the chat document if teacherName was missing
        if (!classChat.teacherName || classChat.teacherName === 'Teacher') {
          await classChatsCollection.updateOne(
            { _id: new ObjectId(chatId) },
            { $set: { teacherName: teacherName } }
          );
          classChat.teacherName = teacherName;
        }
      }

      return NextResponse.json({
        success: true,
        data: classChat
      });
    } else {
      // Get all class chats for user
      const query: any = {
        'participants.userId': userId,
        'participants.isActive': true,
        isActive: true
      };

      if (classId) {
        query.classId = classId;
      }

      const classChats = await classChatsCollection
        .find(query)
        .sort({ lastActivity: -1 })
        .toArray() as unknown as ClassChat[];

      // Ensure teacherName is populated for all chats
      const enrichedChats = await Promise.all(
        classChats.map(async (chat) => {
          // If teacherName is missing or is the default "Teacher", fetch from users collection
          if (!chat.teacherName || chat.teacherName === 'Teacher') {
            const teacher = await usersCollection.findOne({ userId: chat.teacherId });
            const teacherName = teacher?.name || teacher?.displayName || 'Teacher';
            
            // Update the chat document if teacherName was missing
            if (!chat.teacherName || chat.teacherName === 'Teacher') {
              await classChatsCollection.updateOne(
                { _id: chat._id },
                { $set: { teacherName: teacherName } }
              );
              chat.teacherName = teacherName;
            }
          }
          return chat;
        })
      );

      return NextResponse.json({
        success: true,
        data: enrichedChats
      });
    }
  } catch (error) {
    console.error('Error fetching class chats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch class chats' },
      { status: 500 }
    );
  }
}

// POST - Create class chat or send message
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    const role = formData.get('role') as string;
    const userId = formData.get('userId') as string;
    const userName = formData.get('userName') as string;

    if (!role || !userId || !userName) {
      return NextResponse.json(
        { success: false, error: 'Role, userId, and userName are required' },
        { status: 400 }
      );
    }

    let classChatsCollection;
    try {
      classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }

    if (action === 'create_chat') {
      // Create new class chat (teachers only)
      if (role !== 'teacher') {
        return NextResponse.json(
          { success: false, error: 'Only teachers can create class chats' },
          { status: 403 }
        );
      }

      const classId = formData.get('classId') as string;
      const className = formData.get('className') as string;
      const description = formData.get('description') as string;
      const selectedStudents = JSON.parse(formData.get('selectedStudents') as string || '[]');

      if (!classId || !className) {
        return NextResponse.json(
          { success: false, error: 'ClassId and className are required' },
          { status: 400 }
        );
      }

      // Check if class chat already exists
      const existingChat = await classChatsCollection.findOne({
        classId,
        teacherId: userId
      });

      if (existingChat) {
        return NextResponse.json(
          { success: false, error: 'Class chat already exists for this class' },
          { status: 400 }
        );
      }

      // Fetch actual teacher name from users collection
      const usersCollection = await getCollection(COLLECTIONS.USERS);
      const teacher = await usersCollection.findOne({ userId: userId });
      const teacherName = teacher?.name || teacher?.displayName || userName;

      const now = new Date();
      const participants = [
        {
          userId,
          role: 'teacher' as const,
          name: teacherName,
          joinedAt: now,
          isActive: true
        },
        ...selectedStudents.map((student: any) => ({
          userId: student.id,
          role: 'student' as const,
          name: student.name,
          joinedAt: now,
          isActive: true
        }))
      ];

      const newClassChat: ClassChat = {
        classId,
        teacherId: userId,
        teacherName: teacherName, // Store actual teacher name for traceability
        className,
        description,
        participants,
        messages: [],
        lastActivity: now,
        settings: {
          allowStudentMessages: true,
          allowFileSharing: true,
          moderationEnabled: false,
          allowReactions: true
        },
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      const result = await classChatsCollection.insertOne(newClassChat);

      return NextResponse.json({
        success: true,
        data: { chatId: result.insertedId }
      });

    } else if (action === 'send_message') {
      // Send message to class chat
      const chatId = formData.get('chatId') as string;
      const content = formData.get('content') as string;
      const messageType = formData.get('messageType') as string || 'text';
      const files = formData.getAll('files') as File[];

      if (!chatId) {
        return NextResponse.json(
          { success: false, error: 'ChatId is required' },
          { status: 400 }
        );
      }

      if (!content && files.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Message content or files are required' },
          { status: 400 }
        );
      }

      // Verify user is participant
      const classChat = await classChatsCollection.findOne({
        _id: new ObjectId(chatId),
        'participants.userId': userId,
        'participants.isActive': true
      }) as unknown as ClassChat;

      if (!classChat) {
        return NextResponse.json(
          { success: false, error: 'Class chat not found or access denied' },
          { status: 404 }
        );
      }

      // Check permissions
      if (role === 'student' && !classChat.settings.allowStudentMessages) {
        return NextResponse.json(
          { success: false, error: 'Students are not allowed to send messages in this chat' },
          { status: 403 }
        );
      }

      // Handle file attachments
      let attachments: any[] = [];
      if (files.length > 0) {
        if (role === 'student' && !classChat.settings.allowFileSharing) {
          return NextResponse.json(
            { success: false, error: 'File sharing is not allowed for students' },
            { status: 403 }
          );
        }

        const uploadPromises = files.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploadResult = await uploadFile(buffer, file.name, 'class-chat');
          
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

      const now = new Date();

      const newMessage: ClassChatMessage = {
        _id: new ObjectId(),
        senderId: userId,
        senderRole: role as 'teacher' | 'student',
        senderName: userName,
        messageType: messageType as 'text' | 'image' | 'document' | 'announcement',
        content: content || '',
        attachments: attachments.length > 0 ? attachments : undefined,
        timestamp: now,
        reactions: []
      };

      const result = await classChatsCollection.updateOne(
        { _id: new ObjectId(chatId) },
        {
          $push: { messages: newMessage } as any,
          $set: { 
            lastActivity: now,
            updatedAt: now
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to send message' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { messageId: newMessage._id }
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error handling class chat request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// PUT - Update class chat settings or add/remove participants
export async function PUT(request: NextRequest) {
  try {
    const { action, chatId, userId, role, ...data } = await request.json();

    if (!chatId || !userId || !role) {
      return NextResponse.json(
        { success: false, error: 'ChatId, userId, and role are required' },
        { status: 400 }
      );
    }

    let classChatsCollection;
    try {
      classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }

    if (action === 'add_participants') {
      // Add participants (teachers only)
      if (role !== 'teacher') {
        return NextResponse.json(
          { success: false, error: 'Only teachers can add participants' },
          { status: 403 }
        );
      }

      const newParticipants = data.participants || [];
      const now = new Date();

      const participantsToAdd = newParticipants.map((p: any) => ({
        userId: p.userId,
        role: p.role,
        name: p.name,
        joinedAt: now,
        isActive: true
      }));

      const result = await classChatsCollection.updateOne(
        { 
          _id: new ObjectId(chatId),
          teacherId: userId
        },
        {
          $addToSet: { participants: { $each: participantsToAdd } },
          $set: { updatedAt: now }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Class chat not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });

    } else if (action === 'remove_participant') {
      // Remove participant (teachers only)
      if (role !== 'teacher') {
        return NextResponse.json(
          { success: false, error: 'Only teachers can remove participants' },
          { status: 403 }
        );
      }

      const participantId = data.participantId;
      
      const result = await classChatsCollection.updateOne(
        { 
          _id: new ObjectId(chatId),
          teacherId: userId
        },
        {
          $set: { 
            'participants.$[elem].isActive': false,
            updatedAt: new Date()
          }
        },
        {
          arrayFilters: [{ 'elem.userId': participantId }]
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Class chat not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });

    } else if (action === 'update_settings') {
      // Update chat settings (teachers only)
      if (role !== 'teacher') {
        return NextResponse.json(
          { success: false, error: 'Only teachers can update settings' },
          { status: 403 }
        );
      }

      const result = await classChatsCollection.updateOne(
        { 
          _id: new ObjectId(chatId),
          teacherId: userId
        },
        {
          $set: { 
            settings: data.settings,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Class chat not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating class chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update class chat' },
      { status: 500 }
    );
  }
}
