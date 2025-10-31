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
    const userId = searchParams.get('userId');

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
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
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    
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
    if (role === 'teacher' && classData.teacherId !== userId) {
      console.log('Permission denied:', {
        classTeacherId: classData.teacherId,
        requestingUserId: userId,
        match: classData.teacherId === userId
      });
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this class', debug: { classTeacherId: classData.teacherId, requestingUserId: userId } },
        { status: 403 }
      );
    }

    if (role === 'student' && !classData.studentIds.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this class' },
        { status: 403 }
      );
    }

    // Get assignments for this class
    // Handle both ObjectId format and string format classId
    const assignmentQuery: any = {
      $or: [
        { classId: classId }, // Direct match by classId field
        { assignedTo: classId }, // Assignments assigned to this class (entire class)
        { assignedTo: { $in: classData.studentIds } }, // Assignments assigned to students in this class
        { classId: { $exists: false } }, // Handle assignments without classId
        { classId: null }
      ],
      isPublished: true
    };
    
    console.log('🔍 Fetching assignments for class:', {
      classId,
      query: JSON.stringify(assignmentQuery, null, 2)
    });
    
    const assignments = await assignmentsCollection
      .find(assignmentQuery)
      .sort({ createdAt: -1 })
      .toArray();
      
    console.log(`📊 Found ${assignments.length} assignments for class ${classId}`);

    // Get recent submissions
    const submissions = await submissionsCollection
      .find({ 
        assignmentId: { $in: assignments.map(a => a._id?.toString()) }
      })
      .sort({ submissionTime: -1 })
      .limit(10)
      .toArray();

    // Fetch student details for all students in the class
    const students = await studentProfilesCollection
      .find({ 
        studentId: { $in: classData.studentIds }
      })
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
          teacherId: classData.teacherId,
          teacherName: classData.teacherName || 'Teacher', // Include teacher name
          studentIds: classData.studentIds,
          joinCode: classData.joinCode,
          isActive: classData.isActive,
          createdAt: classData.createdAt,
          updatedAt: classData.updatedAt
        },
        students: students.map(s => ({
          studentId: s.studentId,
          name: s.studentName || s.name || s.studentId,
          email: s.email || `${s.studentId}@student.com`,
          personalityTestCompleted: s.personalityTestCompleted,
          oceanTraits: s.oceanTraits,
          learningPreferences: s.learningPreferences
        })),
        statistics: {
          totalStudents: classData.studentIds.length,
          totalAssignments,
          totalSubmissions,
          gradedSubmissions,
          averageScore: Math.round(averageScore * 10) / 10,
          completionRate: totalAssignments > 0 
            ? Math.round((gradedSubmissions / (classData.studentIds.length * totalAssignments)) * 100)
            : 0
        },
        recentAssignments: assignments.map(a => ({
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
