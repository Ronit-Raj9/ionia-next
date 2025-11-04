import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Submission, Assignment, Progress, StudentProfile } from '@/lib/db';
import { gradeSubmission, gradeSubmissionDetailed } from '@/lib/groq';
import { gradeSubmissionFallback } from '@/lib/openai';
import { uploadFile } from '@/lib/cloudinary';
import { extractTextFromImage } from '@/lib/googleVision';
import { checkAndAwardBadges, generateAchievementNotification, updateEngagementMetrics } from '@/lib/gamification';
import { updateStudentMastery } from '@/lib/progress-tracker';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const role = formData.get('role') as string;
    const studentId = formData.get('studentId') as string;
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

    if (!assignmentId || !studentId) {
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

    // Create submission document with enhanced fields
    const submission: Partial<Submission> = {
      assignmentId,
      classId: assignment.classId,
      studentId,
      studentName: `Student ${studentId.replace('student', '')}`,
      subject: assignment.subject,
      topic: assignment.topic,
      submittedContent: {
        text: fullSubmissionText,
        imageUrls,
      },
      extractedText: extractedText || undefined,
      ocrStatus: extractedText ? 'completed' : undefined,
      imageQualityCheck: imageUrls.length > 0 ? [{
        isBlurry: false,
        isLegible: true,
        confidenceScore: 85,
        suggestions: []
      }] : undefined,
      submissionTime: new Date(),
      grade: {
        score: 0,
        maxScore: assignment.maxScore || assignment.totalMarks || 100,
        feedback: '',
        errors: [],
        gradedBy: '',
        gradedAt: new Date(),
        isPublished: false,
      },
      status: 'submitted' as const,
      processingStatus: 'pending' as const,
      processed: false,
    };

    // Save submission to database
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const result = await submissionsCollection.insertOne(submission);
    const submissionId = result.insertedId;

    // Grade the submission with AI multi-agent system (FastAPI)
    try {
      console.log(`Starting multi-agent AI grading for submission ${submissionId}...`);
      
      // Update status to processing
      await submissionsCollection.updateOne(
        { _id: submissionId },
        { $set: { processingStatus: 'grading' } }
      );
      
      let detailedGrading;
      
      // Call FastAPI GRADE agent
      try {
        console.log('Calling GRADE multi-agent system...');
        
        const gradeResponse = await fetch('http://localhost:8000/api/grade/evaluate-submission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            submission: fullSubmissionText,
            questions: assignment.originalContent?.questions || [],
            rubric: assignment.gradingRubric || null,
            student_id: studentId,
            assignment_id: assignmentId
          })
        });

        if (!gradeResponse.ok) {
          throw new Error(`FastAPI grading failed: ${gradeResponse.statusText}`);
        }

        const aiResult = await gradeResponse.json();
        
        console.log('✓ Multi-agent grading response received');
        console.log(`Agents used: ${aiResult.agents_used?.join(', ') || 'N/A'}`);

        // Map FastAPI response to existing structure
        const grading = aiResult.grading || {};
        const feedback = aiResult.feedback || {};
        const analysis = aiResult.analysis || {};

        const totalScore = grading.total_score || 0;
        const maxScore = grading.max_score || assignment.maxScore || assignment.totalMarks || 100;
        const percentage = grading.percentage || (totalScore / maxScore * 100);

        detailedGrading = {
          score: totalScore,
          percentage: percentage,
          detailedFeedback: feedback.overall_feedback || 'Graded by AI multi-agent system',
          questionWiseAnalysis: (grading.question_scores || []).map((qs: any) => ({
            questionId: qs.question_id,
            score: qs.score || 0,
            maxScore: qs.max_score || 0,
            feedback: qs.notes || '',
            isCorrect: qs.score >= (qs.max_score * 0.7)
          })),
          errorAnalysis: (analysis.conceptual_gaps || []).map((gap: string) => ({
            errorType: 'Conceptual Gap',
            description: gap,
            severity: 'moderate' as const
          })),
          strengthsIdentified: feedback.strengths || ['Good effort'],
          areasForImprovement: feedback.improvements || analysis.weak_topics || [],
          aiConfidence: 85 // Multi-agent system is more reliable
        };

        // Store detailed grading data
        const autoGrade = {
          score: totalScore,
          maxScore: maxScore,
          percentage: percentage,
          detailedFeedback: detailedGrading.detailedFeedback,
          questionWiseAnalysis: detailedGrading.questionWiseAnalysis,
          errorAnalysis: detailedGrading.errorAnalysis,
          strengthsIdentified: detailedGrading.strengthsIdentified,
          areasForImprovement: detailedGrading.areasForImprovement.map((area: string) => ({
            concept: area,
            suggestion: 'Review and practice',
            studyMaterialReference: ''
          })),
          aiConfidence: detailedGrading.aiConfidence,
          requiresReview: detailedGrading.aiConfidence < 70,
          gradedBy: aiResult.graded_by || 'AI-MultiAgent',
          gradedAt: new Date(),
          agentsUsed: aiResult.agents_used || ['GRADE Agent']
        };

        // Update submission with detailed grading
        await submissionsCollection.updateOne(
          { _id: submissionId },
          {
            $set: {
              autoGrade,
              grade: {
                score: totalScore,
                maxScore: maxScore,
                feedback: detailedGrading.detailedFeedback,
                errors: detailedGrading.errorAnalysis.map((e: any) => `${e.errorType}: ${e.description}`),
                gradedBy: autoGrade.gradedBy,
                gradedAt: new Date(),
                isPublished: true,
              },
              processed: true,
              processingStatus: 'completed' as const,
              status: 'graded' as const
            },
          }
        );

        console.log(`✓ Multi-agent grading complete: ${totalScore}/${maxScore} (${percentage.toFixed(1)}%)`);

      } catch (aiError) {
        console.warn('FastAPI AI grading failed, falling back to local Groq:', aiError);
        
        // Fallback to original local grading
      const hasDetailedInfo = assignment.gradingRubric || assignment.baseSolution;
      
      if (hasDetailedInfo) {
          detailedGrading = await gradeSubmissionDetailed({
            studentAnswer: fullSubmissionText,
            modelSolution: assignment.baseSolution?.solutionText || 'Refer to textbook and class notes',
            questions: assignment.originalContent?.questions || [],
            rubric: assignment.gradingRubric || {
              criteria: [
                { name: 'Understanding', points: 30, description: 'Shows understanding of concepts' },
                { name: 'Application', points: 30, description: 'Correctly applies formulas/methods' },
                { name: 'Calculation', points: 30, description: 'Accurate calculations' },
                { name: 'Presentation', points: 10, description: 'Clear and organized' }
              ]
            },
            maxScore: assignment.maxScore || assignment.totalMarks || 100,
            subject: assignment.subject || 'Science',
            topic: assignment.topic || 'General'
          });
      } else {
        const basicGrading = await gradeSubmission({
          submittedText: fullSubmissionText,
          originalQuestions: assignment.originalContent?.questions || [],
        });
        
        detailedGrading = {
          score: basicGrading.score,
          percentage: (basicGrading.score / (assignment.maxScore || 100)) * 100,
          detailedFeedback: basicGrading.feedback,
          questionWiseAnalysis: [],
          errorAnalysis: basicGrading.errors.map((e: string) => ({
            errorType: 'Error',
            description: e,
            severity: 'minor' as const
          })),
          strengthsIdentified: ['Good effort'],
          areasForImprovement: ['Continue practicing'],
          aiConfidence: 75
        };
        }
        
        // Update with fallback grading
        await submissionsCollection.updateOne(
          { _id: submissionId },
          {
            $set: {
              grade: {
                score: detailedGrading.score,
                maxScore: assignment.maxScore || assignment.totalMarks || 100,
                feedback: detailedGrading.detailedFeedback,
                errors: detailedGrading.errorAnalysis.map((e: any) => `${e.errorType}: ${e.description}`),
                gradedBy: 'AI-Groq-Fallback',
                gradedAt: new Date(),
                isPublished: true,
              },
              processed: true,
              processingStatus: 'completed' as const,
              status: 'graded' as const
            },
          }
        );

        console.log('✓ Fallback grading complete');
      }

      // Update student mastery with detailed feedback
      const progressUpdate = await updateStudentMastery(
        studentId,
        assignment,
        submission as Submission,
        detailedGrading
      );
      
      console.log(`✓ Progress updated: Mastery ${progressUpdate.previousMastery}% → ${progressUpdate.newMastery}%`);

      // Also update progress tracking
      const gamificationResult = await updateStudentProgress(
        studentId, 
        assignment.classId, 
        detailedGrading.score
      ).catch(err => {
        console.warn('Legacy progress update failed:', err);
        return { badges: [], achievements: [] };
      });

      return NextResponse.json({
        success: true,
        data: {
          submissionId,
          grade: detailedGrading,
          autoGrade: submission.autoGrade,
          ocrExtracted: extractedText.length > 0,
          imagesProcessed: imageUrls.length,
          progressUpdate,
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
    const userId = searchParams.get('userId');
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    let query: any = {};

    if (role === 'student') {
      // Students can only see their own submissions
      query.studentId = userId;
      if (assignmentId) {
        query.assignmentId = assignmentId;
      }
    } else if (role === 'teacher' || role === 'admin') {
      // Teachers and admins can see all submissions
      if (assignmentId) {
        query.assignmentId = assignmentId;
      }
      if (studentId) {
        query.studentId = studentId;
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

// Helper function to update student progress with gamification and mastery tracking
async function updateStudentProgress(
  studentId: string, 
  classId: string, 
  score: number,
  assignment?: Assignment,
  detailedGrading?: any
) {
  try {
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    
    // Get current student data
    const studentProgress = await progressCollection.findOne({ studentId, classId }) as unknown as Progress | null;
    const studentProfile = await profilesCollection.findOne({ studentId }) as unknown as StudentProfile | null;
    const allSubmissions = await submissionsCollection.find({ studentId }).toArray() as unknown as Submission[];
    
    // Create current submission object for gamification
    const currentSubmission = {
      _id: new ObjectId(),
      assignmentId: 'current',
      classId: assignment?.classId || classId,
      studentId,
      studentName: `Student ${studentId.replace('student', '')}`,
      subject: assignment?.subject || 'General',
      topic: assignment?.topic || 'General',
      submittedContent: { text: '', imageUrls: [] },
      submissionTime: new Date(),
      grade: { 
        score, 
        maxScore: 100,
        feedback: '', 
        errors: [],
        gradedBy: 'system',
        gradedAt: new Date(),
        isPublished: true
      },
      status: 'graded' as const,
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
        { studentId },
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
      { studentId, classId },
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
