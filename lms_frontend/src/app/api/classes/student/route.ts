import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    
    const classes = await classesCollection
      .find({ studentIds: { $in: [studentId] } })
      .sort({ createdAt: -1 })
      .toArray();

    // Transform to include additional info for student view with real assignment counts
    const formattedClasses = await Promise.all(classes.map(async classData => {
      // Get teacher information
      let teacherName = classData.teacherName || 'Teacher';
      if (!teacherName || teacherName === 'Teacher') {
        // Fetch teacher info if not stored in class
        const teacher = await usersCollection.findOne({ userId: classData.teacherId });
        teacherName = teacher?.name || teacher?.displayName || 'Teacher';
      }
      
      // Get actual assignment count for this class
      const assignmentQuery = {
        $or: [
          { classId: classData._id?.toString() }, // Assignments for this specific class
          { assignedTo: classData._id?.toString() }, // Assignments assigned to this class
          { assignedTo: studentId } // Assignments assigned directly to this student
        ],
        isPublished: true
      };
      
      console.log(`🔍 Checking assignments for class ${classData.className} (${classData._id}):`, JSON.stringify(assignmentQuery, null, 2));
      
      const assignmentCount = await assignmentsCollection.countDocuments(assignmentQuery);
      
      console.log(`📊 Found ${assignmentCount} assignments for class ${classData.className}`);

      return {
        _id: classData._id,
        className: classData.className,
        teacherId: classData.teacherId,
        teacherName: teacherName, // Include actual teacher name
        studentCount: classData.studentIds.length,
        createdAt: classData.createdAt,
        // Real data instead of mock data
        lastActivity: new Date(),
        hasUnreadMessages: false, // TODO: Implement real message tracking
        recentAssignments: assignmentCount // Real assignment count from database
      };
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
