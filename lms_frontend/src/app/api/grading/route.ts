import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Submission } from '@/lib/db';
import { ObjectId } from 'mongodb';

// GET - Get submissions for grading (teacher view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const teacherId = searchParams.get('teacherId');
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can access grading' },
        { status: 403 }
      );
    }

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    try {
      const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
      const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);

      let query: any = {};

      if (assignmentId) {
        // Verify teacher owns this assignment
        const assignment = await assignmentsCollection.findOne({
          _id: new ObjectId(assignmentId),
          createdBy: teacherId
        });

        if (!assignment) {
          return NextResponse.json(
            { success: false, error: 'Assignment not found or access denied' },
            { status: 404 }
          );
        }

        query.assignmentId = assignmentId;
      } else {
        // Get all assignments by this teacher first
        const teacherAssignments = await assignmentsCollection
          .find({ createdBy: teacherId })
          .toArray();

        const assignmentIds = teacherAssignments.map(a => a._id?.toString()).filter(Boolean);
        query.assignmentId = { $in: assignmentIds };
      }

      if (studentId) {
        query.studentMockId = studentId;
      }

      const submissions = await submissionsCollection
        .find(query)
        .sort({ submissionTime: -1 })
        .toArray();

      // Enrich submissions with assignment details
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission) => {
          const assignment = await assignmentsCollection.findOne({
            _id: new ObjectId(submission.assignmentId)
          });

          return {
            ...submission,
            assignmentTitle: assignment?.title || 'Unknown Assignment',
            assignmentSubject: assignment?.subject || 'General',
            assignmentTotalMarks: assignment?.totalMarks || 100,
            assignmentDifficulty: assignment?.difficulty || 'medium',
            canShowGrade: assignment?.gradeSettings?.showMarksToStudents || false,
            canShowFeedback: assignment?.gradeSettings?.showFeedbackToStudents || false,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: enrichedSubmissions
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error fetching submissions for grading:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// POST - Grade a submission
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const role = formData.get('role') as string;
    const teacherId = formData.get('teacherId') as string;
    const submissionId = formData.get('submissionId') as string;
    const score = parseInt(formData.get('score') as string);
    const maxScore = parseInt(formData.get('maxScore') as string);
    const feedback = formData.get('feedback') as string;
    const isPublished = formData.get('isPublished') === 'true';
    const privateComments = formData.get('privateComments') as string;

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can grade submissions' },
        { status: 403 }
      );
    }

    if (!teacherId || !submissionId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and submission ID are required' },
        { status: 400 }
      );
    }

    if (isNaN(score) || isNaN(maxScore)) {
      return NextResponse.json(
        { success: false, error: 'Valid score and max score are required' },
        { status: 400 }
      );
    }

    try {
      const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
      const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);

      // Get submission and verify teacher owns the assignment
      const submission = await submissionsCollection.findOne({
        _id: new ObjectId(submissionId)
      });

      if (!submission) {
        return NextResponse.json(
          { success: false, error: 'Submission not found' },
          { status: 404 }
        );
      }

      const assignment = await assignmentsCollection.findOne({
        _id: new ObjectId(submission.assignmentId),
        createdBy: teacherId
      });

      if (!assignment) {
        return NextResponse.json(
          { success: false, error: 'Assignment not found or access denied' },
          { status: 403 }
        );
      }

      // Update submission with grade
      const updateData: any = {
        grade: {
          score,
          maxScore,
          feedback,
          errors: [], // TODO: Implement AI-powered error detection
          gradedBy: teacherId,
          gradedAt: new Date(),
          isPublished
        },
        status: isPublished ? 'returned' : 'graded'
      };

      // Add teacher comments if provided
      if (privateComments) {
        updateData.$push = {
          teacherComments: {
            content: privateComments,
            isPrivate: true,
            timestamp: new Date()
          }
        };
      }

      const result = await submissionsCollection.updateOne(
        { _id: new ObjectId(submissionId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to update submission' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: isPublished ? 'Grade published to student' : 'Grade saved as draft',
        data: {
          submissionId,
          score,
          maxScore,
          feedback,
          isPublished
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error grading submission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grade submission' },
      { status: 500 }
    );
  }
}

// PUT - Update grade visibility settings
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const role = formData.get('role') as string;
    const teacherId = formData.get('teacherId') as string;
    const assignmentId = formData.get('assignmentId') as string;
    const showMarksToStudents = formData.get('showMarksToStudents') === 'true';
    const showFeedbackToStudents = formData.get('showFeedbackToStudents') === 'true';

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can update grade settings' },
        { status: 403 }
      );
    }

    if (!teacherId || !assignmentId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and assignment ID are required' },
        { status: 400 }
      );
    }

    try {
      const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);

      // Verify teacher owns this assignment
      const assignment = await assignmentsCollection.findOne({
        _id: new ObjectId(assignmentId),
        createdBy: teacherId
      });

      if (!assignment) {
        return NextResponse.json(
          { success: false, error: 'Assignment not found or access denied' },
          { status: 404 }
        );
      }

      // Update grade settings
      const result = await assignmentsCollection.updateOne(
        { _id: new ObjectId(assignmentId) },
        {
          $set: {
            'gradeSettings.showMarksToStudents': showMarksToStudents,
            'gradeSettings.showFeedbackToStudents': showFeedbackToStudents
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to update assignment' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Grade visibility settings updated',
        data: {
          assignmentId,
          showMarksToStudents,
          showFeedbackToStudents
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error updating grade settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update grade settings' },
      { status: 500 }
    );
  }
}
