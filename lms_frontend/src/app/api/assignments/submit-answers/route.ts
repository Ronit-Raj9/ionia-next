import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, StudentQuestionVariant, StudentProfile, QuestionAttempt } from '@/lib/db';
import { updateDynamicMetrics } from '@/lib/metricCalculator';

/**
 * POST /api/assignments/submit-answers
 * Submit answers for chosen questions and update metrics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      studentId,
      assignmentId,
      answers // Array of { masterQuestionId, studentAnswer, timeSpent, hintsUsed, hintsViewed, confidence }
    } = body;

    if (!studentId || !assignmentId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const variantCollection = await getCollection(COLLECTIONS.STUDENT_QUESTION_VARIANTS);
    const profileCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const questionAttemptsCollection = await getCollection(COLLECTIONS.QUESTION_ATTEMPTS);

    // Get student profile
    const profile = await profileCollection.findOne({ studentId }) as StudentProfile | null;
    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Student profile not found' },
        { status: 404 }
      );
    }

    const results = [];
    const questionAttempts = [];

    for (const answer of answers) {
      try {
        // Get the variant
        const variant = await variantCollection.findOne({
          studentId,
          assignmentId: new ObjectId(assignmentId),
          masterQuestionId: answer.masterQuestionId
        }) as StudentQuestionVariant | null;

        if (!variant) {
          results.push({
            masterQuestionId: answer.masterQuestionId,
            success: false,
            error: 'Variant not found'
          });
          continue;
        }

        // Simple correctness check (in production, use proper grading)
        // Submit answer to grading system
        const isCorrect = await checkAnswer(answer.studentAnswer, variant);
        const maxScore = variant.personalizedQuestion.questionType === 'mcq' ? 10 : 8;
        const score = isCorrect ? maxScore : 0;

        // Update variant with attempt
        await variantCollection.updateOne(
          { _id: variant._id },
          {
            $set: {
              attempt: {
                studentAnswer: answer.studentAnswer,
                isCorrect,
                timeSpent: answer.timeSpent || 0,
                hintsUsed: answer.hintsUsed || 0,
                hintsViewed: answer.hintsViewed || [],
                confidence: answer.confidence || 'medium',
                submittedAt: new Date(),
                score,
                maxScore
              },
              updatedAt: new Date()
            }
          }
        );

        // Create question attempt record for metric calculation
        const questionAttempt: QuestionAttempt = {
          studentId,
          questionId: new ObjectId(), // This should be the actual question ID from the question bank
          classId: '', // Should be extracted from assignment
          subject: 'general', // Should be extracted from assignment
          topicId: 'general', // Would come from question analysis
          studentAnswer: answer.studentAnswer,
          isCorrect,
          timeSpent: answer.timeSpent || 0,
          hintsUsed: answer.hintsUsed || 0,
          attemptNumber: 1, // This should be calculated based on previous attempts
          confidence: answer.confidence || 'medium',
          wasSkipped: false,
          sessionId: '', // Should be provided in the request
          metricsUpdated: {
            learning_pace_updated: false,
            concept_mastery_updated: false,
            zpd_adjusted: false
          },
          attemptedAt: new Date()
        };

        // Save question attempt to database
        await questionAttemptsCollection.insertOne(questionAttempt);
        
        // Add to array for metric calculation
        questionAttempts.push({
          questionId: variant.masterQuestionId,
          topicId: 'general', // Would come from question analysis
          subject: 'general',
          difficulty: variant.personalizationDetails.difficultyAdjustment === 'easier' ? 'easy' as const :
                     variant.personalizationDetails.difficultyAdjustment === 'harder' ? 'hard' as const : 'medium' as const,
          bloomsLevel: 3, // Would come from question analysis
          isCorrect,
          timeSpent: answer.timeSpent || 0,
          hintsUsed: answer.hintsUsed || 0,
          confidence: answer.confidence || 'medium' as const,
          attemptedAt: new Date()
        });

        results.push({
          masterQuestionId: answer.masterQuestionId,
          success: true,
          isCorrect,
          score,
          maxScore
        });

      } catch (error) {
        console.error(`Error processing answer for ${answer.masterQuestionId}:`, error);
        results.push({
          masterQuestionId: answer.masterQuestionId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Update student metrics based on attempts
    // Note: The new system uses StudentProfile instead of StudentLearningProfile
    // For now, we'll update basic performance metrics in the new structure
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const maxPossibleScore = results.reduce((sum, r) => sum + (r.maxScore || 0), 0);
    const accuracy = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    // Update assignment history in student profile
    const assignmentHistoryEntry = {
      assignmentId,
      submissionId: new ObjectId().toString(),
      subject: 'general', // Should be extracted from assignment
      topic: 'general', // Should be extracted from assignment
      score: Math.round(accuracy),
      submittedAt: new Date(),
      performance: accuracy >= 80 ? 'excellent' as const : 
                  accuracy >= 60 ? 'good' as const :
                  accuracy >= 40 ? 'average' as const : 'poor' as const
    };

    await profileCollection.updateOne(
      { studentId },
      { 
        $push: { assignmentHistory: assignmentHistoryEntry } as any,
        $set: { updatedAt: new Date() }
      }
    );

    // Calculate overall statistics
    const totalQuestions = results.filter(r => r.success).length;
    const correctAnswers = results.filter(r => r.success && r.isCorrect).length;

    return NextResponse.json({
      success: true,
      message: 'Answers submitted and metrics updated',
      results,
      summary: {
        totalQuestions,
        correctAnswers,
        accuracy: Math.round(accuracy),
        totalScore,
        maxPossibleScore,
        percentage: Math.round(accuracy)
      },
      metricsUpdated: {
        assignmentHistoryUpdated: true,
        performanceRecorded: assignmentHistoryEntry.performance
      }
    });

  } catch (error) {
    console.error('Error submitting answers:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit answers',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Enhanced answer checking for the new system
 * In production, this would integrate with AI grading and proper answer comparison
 */
async function checkAnswer(studentAnswer: string | string[], variant: StudentQuestionVariant): Promise<boolean> {
  // This is a simplified check for the new system
  // In production, you'd compare with correct answer from master question
  // and use AI for grading open-ended responses
  
  if (!studentAnswer) {
    return false;
  }
  
  if (variant.personalizedQuestion.questionType === 'mcq') {
    // For MCQ, check if answer is provided and not empty
    if (Array.isArray(studentAnswer)) {
      return studentAnswer.length > 0 && studentAnswer.every(ans => ans.trim().length > 0);
    }
    return typeof studentAnswer === 'string' && studentAnswer.trim().length > 0;
  }
  
  if (variant.personalizedQuestion.questionType === 'true_false') {
    // For true/false, check for valid boolean-like answers
    const answer = typeof studentAnswer === 'string' ? studentAnswer.toLowerCase().trim() : '';
    return ['true', 'false', 't', 'f', 'yes', 'no', 'y', 'n'].includes(answer);
  }
  
  if (variant.personalizedQuestion.questionType === 'numerical') {
    // For numerical, check if it's a valid number
    const answer = typeof studentAnswer === 'string' ? studentAnswer.trim() : '';
    return !isNaN(Number(answer)) && answer.length > 0;
  }
  
  // For short_answer, long_answer, essay - check for meaningful content
  if (typeof studentAnswer === 'string') {
    const trimmed = studentAnswer.trim();
    return trimmed.length >= 5; // Minimum 5 characters for meaningful answer
  }
  
  return false;
}

/**
 * GET /api/assignments/submit-answers?studentId=...&assignmentId=...
 * Get submission status and results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const assignmentId = searchParams.get('assignmentId');

    if (!studentId || !assignmentId) {
      return NextResponse.json(
        { success: false, message: 'studentId and assignmentId are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTIONS.STUDENT_QUESTION_VARIANTS);
    const variants = await collection.find({
      studentId,
      assignmentId: new ObjectId(assignmentId),
      'attempt': { $exists: true }
    }).toArray();

    if (variants.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No submissions found' },
        { status: 404 }
      );
    }

    const summary = variants.reduce((acc, v: any) => {
      if (v.attempt) {
        acc.totalQuestions++;
        if (v.attempt.isCorrect) acc.correctAnswers++;
        acc.totalScore += v.attempt.score || 0;
        acc.totalTimeSpent += v.attempt.timeSpent || 0;
      }
      return acc;
    }, { totalQuestions: 0, correctAnswers: 0, totalScore: 0, totalTimeSpent: 0 });

    return NextResponse.json({
      success: true,
      submissions: variants,
      summary: {
        ...summary,
        accuracy: summary.totalQuestions > 0 
          ? Math.round((summary.correctAnswers / summary.totalQuestions) * 100) 
          : 0,
        averageTimePerQuestion: summary.totalQuestions > 0
          ? Math.round(summary.totalTimeSpent / summary.totalQuestions)
          : 0
      }
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch submissions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

