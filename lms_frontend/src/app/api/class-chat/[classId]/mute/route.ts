import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, ClassChat } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

// PATCH - Mute or unmute a student (teacher only)
export async function PATCH(
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

    // Only teachers can mute students
    if (session.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only teachers can mute students' },
        { status: 403 }
      );
    }

    const { classId } = params;
    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, error: 'Valid class ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { studentId, mute } = body;

    if (!studentId || typeof mute !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Student ID and mute status are required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);

    // Verify class exists and teacher owns it
    const classData = await classesCollection.findOne({
      _id: new ObjectId(classId)
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    if (classData.teacherId !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to manage this class' },
        { status: 403 }
      );
    }

    // Verify student is in the class
    if (!classData.studentIds.includes(studentId)) {
      return NextResponse.json(
        { success: false, error: 'Student is not a member of this class' },
        { status: 404 }
      );
    }

    // Find class chat
    let classChat = await classChatsCollection.findOne({
      classId: classId
    });

    if (!classChat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Update participant status
    const participants = (classChat as ClassChat).participants || [];
    const participantIndex = participants.findIndex((p) => p.userId === studentId && p.role === 'student');

    if (participantIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Student participant not found' },
        { status: 404 }
      );
    }

    participants[participantIndex].isActive = !mute;

    await classChatsCollection.updateOne(
      { _id: classChat._id },
      {
        $set: {
          participants: participants,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: mute ? 'Student muted successfully' : 'Student unmuted successfully',
      data: {
        studentId,
        isMuted: mute
      }
    });
  } catch (error) {
    console.error('Error muting/unmuting student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update student mute status' },
      { status: 500 }
    );
  }
}

