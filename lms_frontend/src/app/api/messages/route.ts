import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export interface StudentTeacherMessage {
  _id?: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    fileName: string;
  }[];
}

// GET - Fetch messages for teacher (teacher's inbox) or conversation between student and teacher
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    const messagesCollection = await getCollection('studentTeacherMessages');

    if (role === 'teacher') {
      // Get all messages sent to this teacher, grouped by student
      const messages = await messagesCollection
        .find({ teacherId: userId })
        .sort({ timestamp: -1 })
        .toArray();

      // Group messages by student
      const groupedMessages: Record<string, any[]> = {};
      messages.forEach((msg: any) => {
        if (!groupedMessages[msg.studentId]) {
          groupedMessages[msg.studentId] = [];
        }
        groupedMessages[msg.studentId].push(msg);
      });

      // Convert to array format with latest message info
      const conversations = Object.entries(groupedMessages).map(([studentId, msgs]) => {
        const latestMessage = msgs[0];
        const unreadCount = msgs.filter(m => !m.isRead).length;
        
        return {
          studentId,
          studentName: latestMessage.studentName,
          latestMessage: latestMessage.message,
          timestamp: latestMessage.timestamp,
          unreadCount,
          totalMessages: msgs.length,
          messages: msgs
        };
      });

      return NextResponse.json({
        success: true,
        data: conversations
      });
    } else if (role === 'student') {
      // Get conversation between specific student and teacher
      if (!teacherId) {
        return NextResponse.json(
          { success: false, error: 'teacherId is required for students' },
          { status: 400 }
        );
      }

      const messages = await messagesCollection
        .find({ 
          studentId: userId, 
          teacherId 
        })
        .sort({ timestamp: 1 })
        .toArray();

      return NextResponse.json({
        success: true,
        data: messages
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a message from student to teacher
export async function POST(request: NextRequest) {
  try {
    const { studentId, studentName, teacherId, teacherName, message, role } = await request.json();

    if (!studentId || !teacherId || !message || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can send messages to teachers' },
        { status: 403 }
      );
    }

    const messagesCollection = await getCollection('studentTeacherMessages');

    const newMessage: Omit<StudentTeacherMessage, '_id'> = {
      studentId,
      studentName: studentName || `Student ${studentId.replace('student', '')}`,
      teacherId,
      teacherName: teacherName || 'Teacher',
      message,
      timestamp: new Date(),
      isRead: false
    };

    const result = await messagesCollection.insertOne(newMessage);

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...newMessage
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

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const { messageIds, role, userId } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || !role || !userId) {
      return NextResponse.json(
        { success: false, error: 'messageIds array, role, and userId are required' },
        { status: 400 }
      );
    }

    if (role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only teachers can mark messages as read' },
        { status: 403 }
      );
    }

    const messagesCollection = await getCollection('studentTeacherMessages');
    const { ObjectId } = require('mongodb');

    const result = await messagesCollection.updateMany(
      { 
        _id: { $in: messageIds.map((id: string) => new ObjectId(id)) },
        teacherId: userId 
      },
      { $set: { isRead: true } }
    );

    return NextResponse.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read`
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
