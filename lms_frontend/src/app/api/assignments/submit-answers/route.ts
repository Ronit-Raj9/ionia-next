import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, StudentQuestionVariant, StudentLearningProfile } from '@/lib/db';
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
    const profileCollection = await getCollection(COLLECTIONS.STUDENT_LEARNING_PROFILES);

    // Get student profile
    const profile = await profileCollection.findOne({ studentId }) as StudentLearningProfile | null;
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
          assignmentId: assignmentId, // assignmentId is string
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
        // This is a placeholder - you'd integrate with grading system
        const isCorrect = await checkAnswer(answer.studentAnswer, variant);
        const score = isCorrect ? variant.personalizedQuestion.questionType === 'mcq' ? 10 : 8 : 0;

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
                maxScore: 10
              },
              updatedAt: new Date()
            }
          }
        );

        // Create question attempt record for metric calculation
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
          maxScore: 10
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
    const metricUpdates = updateDynamicMetrics(profile, questionAttempts);
    await profileCollection.updateOne(
      { studentId },
      { $set: metricUpdates }
    );

    // Calculate overall statistics
    const totalQuestions = results.filter(r => r.success).length;
    const correctAnswers = results.filter(r => r.success && r.isCorrect).length;
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const maxPossibleScore = totalQuestions * 10;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

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
        percentage: maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0
      },
      metricsUpdated: {
        conceptMasteryRate: metricUpdates.dynamicMetrics?.concept_mastery_rate,
        learningPace: metricUpdates.dynamicMetrics?.actual_learning_pace,
        zpdLevel: metricUpdates.zpdMetrics?.optimal_challenge_level
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
 * Simple answer checking (placeholder)
 * In production, this would be more sophisticated
 */
async function checkAnswer(studentAnswer: string | string[], variant: StudentQuestionVariant): Promise<boolean> {
  // This is a simplified check
  // In production, you'd compare with correct answer from master question
  // and use AI for grading open-ended responses
  
  if (variant.personalizedQuestion.questionType === 'mcq') {
    // For MCQ, simple string comparison
    return typeof studentAnswer === 'string' && studentAnswer.length > 0;
  }
  
  // For other types, assume partially correct if answered
  return typeof studentAnswer === 'string' && studentAnswer.trim().length > 10;
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
      assignmentId: assignmentId, // assignmentId is string
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

