import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Fetch available classes for students to join
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const studentId = searchParams.get('studentId');
    const role = searchParams.get('role');

    if (role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can view available classes' },
        { status: 403 }
      );
    }

    if (!schoolId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'School ID and student ID are required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    
    // Find classes in the same school that the student is not already a member of
    const availableClasses = await classesCollection
      .find({
        schoolId,
        isActive: true,
        studentMockIds: { $nin: [studentId] }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Return only basic info needed for joining
    const formattedClasses = availableClasses.map(classData => ({
      _id: classData._id,
      className: classData.className,
      description: classData.description,
      subject: classData.subject,
      grade: classData.grade,
      teacherMockId: classData.teacherMockId,
      studentCount: classData.studentMockIds?.length || 0,
      joinCode: classData.joinCode,
      createdAt: classData.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedClasses
    });
  } catch (error) {
    console.error('Error fetching available classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available classes' },
      { status: 500 }
    );
  }
}




