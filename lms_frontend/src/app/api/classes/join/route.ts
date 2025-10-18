import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, Class } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// POST - Join a classroom using join code
export async function POST(request: NextRequest) {
  try {
    const { joinCode, studentId, studentName, studentEmail } = await request.json();

    // Validate required parameters
    if (!joinCode || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Join code and student ID are required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Find the classroom with the given join code
    const classroom = await classesCollection.findOne({
      joinCode: joinCode,
      isActive: true
    }) as unknown as Class | null;

    if (!classroom) {
      return NextResponse.json(
        { success: false, error: 'Invalid join code or classroom not found' },
        { status: 404 }
      );
    }

    // Check if student is already in the class
    if (classroom.studentIds.includes(studentId)) {
      return NextResponse.json(
        { success: false, error: 'You are already enrolled in this class' },
        { status: 400 }
      );
    }

    // Add student to the classroom
    const updateResult = await classesCollection.updateOne(
      { _id: classroom._id },
      { 
        $addToSet: { studentIds: studentId },
        $set: { updatedAt: new Date() }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to join classroom' },
        { status: 500 }
      );
    }

    // Update student's classId in users collection (for primary class)
    if (studentName && studentEmail) {
      await usersCollection.updateOne(
        { userId: studentId },
        { 
          $set: { 
            classId: classroom._id?.toString(),
            updatedAt: new Date()
          }
        }
      );
    }

    console.log(`Student ${studentId} joined classroom ${classroom.className} (${classroom._id})`);

    return NextResponse.json({
      success: true,
      data: {
        classroomId: classroom._id,
        className: classroom.className,
        subject: classroom.subject,
        grade: classroom.grade,
        teacherId: classroom.teacherId
      },
      message: `Successfully joined ${classroom.className}!`
    });

  } catch (error) {
    console.error('Error joining classroom:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join classroom' },
      { status: 500 }
    );
  }
}