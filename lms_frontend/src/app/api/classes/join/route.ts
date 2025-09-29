import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// POST - Student joins a class using join code
export async function POST(request: NextRequest) {
  try {
    const { joinCode, studentId, schoolId, role } = await request.json();

    if (role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can join classes' },
        { status: 403 }
      );
    }

    if (!joinCode || !studentId || !schoolId) {
      return NextResponse.json(
        { success: false, error: 'Join code, student ID, and school ID are required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    
    // Find class by join code and school ID
    const classData = await classesCollection.findOne({
      joinCode,
      schoolId,
      isActive: true
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Invalid join code or class not found' },
        { status: 404 }
      );
    }

    // Check if student is already in the class
    if (classData.studentMockIds.includes(studentId)) {
      return NextResponse.json(
        { success: false, error: 'You are already a member of this class' },
        { status: 400 }
      );
    }

    // Add student to class
    const result = await classesCollection.updateOne(
      { _id: classData._id },
      { 
        $addToSet: { studentMockIds: studentId },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to join class' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${classData.className}`,
      data: {
        classId: classData._id,
        className: classData.className,
        teacherMockId: classData.teacherMockId
      }
    });
  } catch (error) {
    console.error('Error joining class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join class' },
      { status: 500 }
    );
  }
}
