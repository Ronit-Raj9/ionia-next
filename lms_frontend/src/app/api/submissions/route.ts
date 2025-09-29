import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Submission, Assignment } from '@/lib/db';
import { gradeSubmission } from '@/lib/groq';
import { gradeSubmissionFallback } from '@/lib/openai';
import { uploadFile } from '@/lib/cloudinary';
import { extractTextFromImage } from '@/lib/googleVision';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const role = formData.get('role') as string;
    const studentMockId = formData.get('studentMockId') as string;
    const assignmentId = formData.get('assignmentId') as string;
    const textAnswer = formData.get('textAnswer') as string || '';
    const files = formData.getAll('files') as File[];

    // Validate role
    if (role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can submit assignments' },
        { status: 403 }
      );
    }

    if (!assignmentId || !studentMockId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID and student ID are required' },
        { status: 400 }
      );
    }

    if (!textAnswer && files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Either text answer or image files must be provided' },
        { status: 400 }
      );
    }

    // Get assignment details
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const assignment = await assignmentsCollection.findOne({
      _id: new ObjectId(assignmentId)
    }) as unknown as Assignment;

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    let imageUrls: string[] = [];
    let extractedText = '';

    // Handle file uploads and OCR
    if (files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await uploadFile(buffer, file.name, 'submissions');
        
        if (!uploadResult.success) {
          throw new Error(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }
        
        return uploadResult.url!;
      });

      try {
        imageUrls = await Promise.all(uploadPromises);
        
        // Extract text from images using Google Vision
        const ocrPromises = imageUrls.map(url => extractTextFromImage(url));
        const ocrResults = await Promise.all(ocrPromises);
        
        // Combine extracted text
        const successfulExtractions = ocrResults
          .filter(result => result.success)
          .map(result => result.text);
        
        extractedText = successfulExtractions.join('\n\n');
        
        // Check if OCR confidence is too low
        const lowConfidenceResults = ocrResults.filter(result => !result.success);
        if (lowConfidenceResults.length > 0) {
          console.warn('Some images had low OCR confidence:', lowConfidenceResults);
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, error: `Failed to process images: ${error}` },
          { status: 500 }
        );
      }
    }

    // Combine text answer and extracted text
    const fullSubmissionText = [textAnswer, extractedText]
      .filter(text => text.trim().length > 0)
      .join('\n\n');

    if (!fullSubmissionText.trim()) {
      return NextResponse.json(
        { success: false, error: 'No readable content found in submission' },
        { status: 400 }
      );
    }

    // Create submission document
    const submission: Submission = {
      assignmentId,
      studentMockId,
      submittedContent: {
        text: fullSubmissionText,
        imageUrls,
      },
      submissionTime: new Date(),
      grade: {
        score: 0,
        feedback: '',
        errors: [],
      },
      processed: false,
    };

    // Save submission to database
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const result = await submissionsCollection.insertOne(submission);
    const submissionId = result.insertedId;

    // Grade the submission
    try {
      let gradingResult;
      
      // Try Groq first, fallback to OpenAI
      try {
        gradingResult = await gradeSubmission({
          submittedText: fullSubmissionText,
          originalQuestions: assignment.originalContent.questions,
        });
      } catch (groqError) {
        console.warn('Groq grading failed, trying OpenAI fallback:', groqError);
        gradingResult = await gradeSubmissionFallback({
          submittedText: fullSubmissionText,
          originalQuestions: assignment.originalContent.questions,
        });
      }

      // Update submission with grade
      await submissionsCollection.updateOne(
        { _id: submissionId },
        {
          $set: {
            grade: gradingResult,
            processed: true,
          },
        }
      );

      // Update student progress (trigger progress update)
      await updateStudentProgress(studentMockId, assignment.classId, gradingResult.score);

      return NextResponse.json({
        success: true,
        data: {
          submissionId,
          grade: gradingResult,
          ocrExtracted: extractedText.length > 0,
          imagesProcessed: imageUrls.length,
        },
      });
    } catch (gradingError) {
      console.error('Grading failed:', gradingError);
      
      // Mark as processed but with error
      await submissionsCollection.updateOne(
        { _id: submissionId },
        {
          $set: {
            grade: {
              score: 0,
              feedback: 'Grading failed. Please contact your teacher.',
              errors: ['Automatic grading system error'],
            },
            processed: true,
          },
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          submissionId,
          grade: {
            score: 0,
            feedback: 'Grading failed. Please contact your teacher.',
            errors: ['Automatic grading system error'],
          },
          ocrExtracted: extractedText.length > 0,
          imagesProcessed: imageUrls.length,
        },
      });
    }
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const mockUserId = searchParams.get('mockUserId');
    const assignmentId = searchParams.get('assignmentId');
    const studentMockId = searchParams.get('studentMockId');

    if (!role || !mockUserId) {
      return NextResponse.json(
        { success: false, error: 'Role and mockUserId are required' },
        { status: 400 }
      );
    }

    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    let query: any = {};

    if (role === 'student') {
      // Students can only see their own submissions
      query.studentMockId = mockUserId;
      if (assignmentId) {
        query.assignmentId = assignmentId;
      }
    } else if (role === 'teacher' || role === 'admin') {
      // Teachers and admins can see all submissions
      if (assignmentId) {
        query.assignmentId = assignmentId;
      }
      if (studentMockId) {
        query.studentMockId = studentMockId;
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 403 }
      );
    }

    const submissions = await submissionsCollection
      .find(query)
      .sort({ submissionTime: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// Helper function to update student progress
async function updateStudentProgress(studentMockId: string, classId: string, score: number) {
  try {
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    
    // Update student profile based on score
    if (score >= 70) {
      // Good score - potentially remove weaknesses
      await profilesCollection.updateOne(
        { studentMockId },
        {
          $set: { updatedAt: new Date() },
          $inc: { 'previousPerformance.masteryScores.overall': 5 },
        }
      );
    }
    
    // Update progress metrics
    await progressCollection.updateOne(
      { studentMockId, classId },
      {
        $set: {
          'metrics.timeSaved': 10, // 10 minutes saved per submission
        },
        $push: {
          updates: {
            timestamp: new Date(),
            change: `Scored ${score}% on recent assignment`,
          },
        },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Failed to update student progress:', error);
  }
}
