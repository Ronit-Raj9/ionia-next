import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db';

// GET - Fetch details for a specific class
export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const mockUserId = searchParams.get('mockUserId');

    if (!role || !mockUserId) {
      return NextResponse.json(
        { success: false, error: 'Role and mockUserId are required' },
        { status: 400 }
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
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    
    // Find the class
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
    if (role === 'teacher' && classData.teacherMockId !== mockUserId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this class' },
        { status: 403 }
      );
    }

    if (role === 'student' && !classData.studentMockIds.includes(mockUserId)) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this class' },
        { status: 403 }
      );
    }

    // Get assignments for this class
    const assignments = await assignmentsCollection
      .find({ classId: classId })
      .sort({ createdAt: -1 })
      .toArray();

    // Get recent submissions
    const submissions = await submissionsCollection
      .find({ 
        assignmentId: { $in: assignments.map(a => a._id?.toString()) }
      })
      .sort({ submissionTime: -1 })
      .limit(10)
      .toArray();

    // Calculate class statistics
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(s => s.grade).length;
    const averageScore = submissions.length > 0
      ? submissions.reduce((acc, s) => acc + (s.grade?.score || 0), 0) / submissions.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        class: {
          _id: classData._id,
          className: classData.className,
          description: classData.description,
          subject: classData.subject,
          grade: classData.grade,
          teacherMockId: classData.teacherMockId,
          studentMockIds: classData.studentMockIds,
          joinCode: classData.joinCode,
          isActive: classData.isActive,
          createdAt: classData.createdAt,
          updatedAt: classData.updatedAt
        },
        statistics: {
          totalStudents: classData.studentMockIds.length,
          totalAssignments,
          totalSubmissions,
          gradedSubmissions,
          averageScore: Math.round(averageScore * 10) / 10,
          completionRate: totalAssignments > 0 
            ? Math.round((gradedSubmissions / (classData.studentMockIds.length * totalAssignments)) * 100)
            : 0
        },
        recentAssignments: assignments.slice(0, 5).map(a => ({
          _id: a._id,
          title: a.title,
          subject: a.subject,
          dueDate: a.dueDate,
          createdAt: a.createdAt
        })),
        recentSubmissions: submissions.slice(0, 5).map(s => ({
          _id: s._id,
          studentName: s.studentName,
          submissionTime: s.submissionTime,
          status: s.status,
          score: s.grade?.score
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching class details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch class details' },
      { status: 500 }
    );
  }
}
