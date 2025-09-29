import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Submission, Assignment, Progress, StudentProfile } from '@/lib/db';
import { gradeSubmission } from '@/lib/groq';
import { gradeSubmissionFallback } from '@/lib/openai';
import { uploadFile } from '@/lib/cloudinary';
import { extractTextFromImage } from '@/lib/googleVision';
import { checkAndAwardBadges, generateAchievementNotification, updateEngagementMetrics } from '@/lib/gamification';
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

      // Update student progress (trigger progress update with gamification)
      const gamificationResult = await updateStudentProgress(studentMockId, assignment.classId, gradingResult.score);

      return NextResponse.json({
        success: true,
        data: {
          submissionId,
          grade: gradingResult,
          ocrExtracted: extractedText.length > 0,
          imagesProcessed: imageUrls.length,
          gamification: gamificationResult,
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

// Helper function to update student progress with gamification
async function updateStudentProgress(studentMockId: string, classId: string, score: number) {
  try {
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    
    // Get current student data
    const studentProgress = await progressCollection.findOne({ studentMockId, classId }) as unknown as Progress | null;
    const studentProfile = await profilesCollection.findOne({ studentMockId }) as unknown as StudentProfile | null;
    const allSubmissions = await submissionsCollection.find({ studentMockId }).toArray() as unknown as Submission[];
    
    // Create current submission object for gamification
    const currentSubmission = {
      _id: new ObjectId(),
      assignmentId: 'current',
      studentMockId,
      submittedContent: { text: '', imageUrls: [] },
      submissionTime: new Date(),
      grade: { score, feedback: '', errors: [] },
      processed: true,
      timeSpent: 30 // Default time spent
    } as Submission;
    
    // Check for new badges
    const newBadges = studentProgress && studentProfile 
      ? checkAndAwardBadges(currentSubmission, studentProgress, [...allSubmissions, currentSubmission])
      : [];
    
    // Update student profile based on score
    if (score >= 70) {
      await profilesCollection.updateOne(
        { studentMockId },
        {
          $set: { updatedAt: new Date() },
          $inc: { 
            'previousPerformance.masteryScores.overall': 5,
            'engagementMetrics.badgeCount': newBadges.length
          },
        }
      );
    }
    
    // Calculate new metrics
    const currentAverage = studentProgress?.metrics.averageScore || 0;
    const totalSubmissions = (studentProgress?.metrics.totalSubmissions || 0) + 1;
    const newAverage = Math.round(((currentAverage * (totalSubmissions - 1)) + score) / totalSubmissions);
    
    // Prepare activity entries for new badges
    const badgeActivities = newBadges.map(badgeType => ({
      type: 'badge_earned' as const,
      description: generateAchievementNotification(badgeType),
      timestamp: new Date()
    }));
    
    // Prepare general activity
    const generalActivity = {
      type: 'submission' as const,
      description: `Completed assignment with ${score}% score`,
      timestamp: new Date()
    };
    
    // Update progress metrics with gamification
    const updateData: any = {
      $set: {
        'metrics.timeSaved': (studentProgress?.metrics.timeSaved || 0) + 10,
        'metrics.averageScore': newAverage,
        'metrics.totalSubmissions': totalSubmissions,
        'metrics.completionRate': Math.min(100, (totalSubmissions / 5) * 100), // Assume 5 total assignments
      },
      $push: {
        updates: {
          timestamp: new Date(),
          change: `Scored ${score}% on recent assignment`,
        },
        recentActivity: {
          $each: [generalActivity, ...badgeActivities],
          $slice: -10 // Keep only last 10 activities
        }
      }
    };
    
    // Add new badges to gamification data
    if (newBadges.length > 0) {
      updateData.$addToSet = {
        'gamificationData.badges': { $each: newBadges }
      };
      
      // Add achievements
      const achievements = newBadges.map(badgeType => ({
        name: badgeType,
        earnedAt: new Date(),
        description: generateAchievementNotification(badgeType)
      }));
      
      updateData.$push['gamificationData.achievements'] = {
        $each: achievements,
        $slice: -20 // Keep last 20 achievements
      };
    }
    
    // Calculate score uplift
    if (studentProgress && studentProgress.metrics.averageScore) {
      const uplift = ((newAverage - studentProgress.metrics.averageScore) / studentProgress.metrics.averageScore) * 100;
      updateData.$set['advancedMetrics.scoreUplift'] = Math.round(uplift);
    }
    
    await progressCollection.updateOne(
      { studentMockId, classId },
      updateData,
      { upsert: true }
    );
    
    // Return badge notifications for frontend
    return {
      newBadges,
      notifications: newBadges.map(generateAchievementNotification)
    };
    
  } catch (error) {
    console.error('Failed to update student progress:', error);
    return { newBadges: [], notifications: [] };
  }
}
