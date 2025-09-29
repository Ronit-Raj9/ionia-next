import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// GET - Fetch all classes for a specific school
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const role = searchParams.get('role');
    const mockUserId = searchParams.get('mockUserId');

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'SchoolId is required' },
        { status: 400 }
      );
    }

    if (!role || !mockUserId) {
      return NextResponse.json(
        { success: false, error: 'Role and mockUserId are required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    
    let query: any = { schoolId, isActive: true };
    
    // Filter based on role
    if (role === 'teacher') {
      query.teacherMockId = mockUserId;
    } else if (role === 'student') {
      query.studentMockIds = { $in: [mockUserId] };
    }
    // Admin can see all classes

    const classes = await classesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Add additional info for each class
    const enrichedClasses = classes.map(classData => ({
      ...classData,
      studentCount: classData.studentMockIds?.length || 0,
      lastActivity: classData.updatedAt || classData.createdAt,
      hasUnreadMessages: Math.random() > 0.5, // Mock for now
      recentAssignments: Math.floor(Math.random() * 5) + 1 // Mock for now
    }));

    return NextResponse.json({
      success: true,
      data: enrichedClasses
    });
  } catch (error) {
    console.error('Error fetching school classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch school classes' },
      { status: 500 }
    );
  }
}
