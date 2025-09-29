import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// GET - Fetch classes where student is a member
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const role = searchParams.get('role');

    if (role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const classes = await classesCollection
      .find({ studentMockIds: { $in: [studentId] } })
      .sort({ createdAt: -1 })
      .toArray();

    // Transform to include additional info for student view
    const formattedClasses = classes.map(classData => ({
      _id: classData._id,
      className: classData.className,
      teacherMockId: classData.teacherMockId,
      studentCount: classData.studentMockIds.length,
      createdAt: classData.createdAt,
      // Add some mock data for now
      lastActivity: new Date(),
      hasUnreadMessages: Math.random() > 0.5, // Mock unread status
      recentAssignments: Math.floor(Math.random() * 5) + 1 // Mock assignment count
    }));

    return NextResponse.json({
      success: true,
      data: formattedClasses,
    });
  } catch (error) {
    console.error('Error fetching student classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}
