import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, StudentQuestionChoice, StudentQuestionVariant, StudentLearningProfile, TeacherQuestionSet } from '@/lib/db';
import { analyzeQuestionChoices, updateProfileFromChoices } from '@/lib/choiceMetricCalculator';

/**
 * POST /api/assignments/record-choice
 * Record student's question choices and analyze patterns
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      studentId,
      questionSetId,
      assignmentId,
      chosenQuestionIds, // Array of master question IDs
      choiceTimeline // Array of { questionId, action, timestamp }
    } = body;

    if (!studentId || !questionSetId || !assignmentId || !chosenQuestionIds) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(chosenQuestionIds)) {
      return NextResponse.json(
        { success: false, message: 'chosenQuestionIds must be an array' },
        { status: 400 }
      );
    }

    // Get question set
    const questionSetCollection = await getCollection(COLLECTIONS.TEACHER_QUESTION_SETS);
    const questionSet = await questionSetCollection.findOne({ _id: new ObjectId(questionSetId) }) as TeacherQuestionSet | null;

    if (!questionSet) {
      return NextResponse.json(
        { success: false, message: 'Question set not found' },
        { status: 404 }
      );
    }

    // Validate choice count
    if (chosenQuestionIds.length !== questionSet.assignmentRules.questionsToAttempt) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Must choose exactly ${questionSet.assignmentRules.questionsToAttempt} questions` 
        },
        { status: 400 }
      );
    }

    // Get all variants for this student
    const variantCollection = await getCollection(COLLECTIONS.STUDENT_QUESTION_VARIANTS);
    const allVariants = await variantCollection.find({
      studentId,
      questionSetId: new ObjectId(questionSetId)
    }).toArray() as StudentQuestionVariant[];

    const chosenVariants = allVariants.filter(v => chosenQuestionIds.includes(v.masterQuestionId));

    // Get student profile
    const profileCollection = await getCollection(COLLECTIONS.STUDENT_LEARNING_PROFILES);
    const profile = await profileCollection.findOne({ 
      studentId, 
      classId: questionSet.classId 
    }) as StudentLearningProfile | null;

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Analyze choices
    const choiceAnalysis = analyzeQuestionChoices(
      allVariants,
      chosenVariants,
      questionSet.masterQuestions,
      profile
    );

    // Create choice record
    const choiceRecord: StudentQuestionChoice = {
      questionSetId: new ObjectId(questionSetId),
      assignmentId: new ObjectId(assignmentId), // Store as ObjectId
      studentId,
      presentedQuestions: allVariants.map(v => v.masterQuestionId),
      chosenQuestions: chosenQuestionIds,
      choiceTimeline: (choiceTimeline || []).map((item: any) => ({
        questionId: item.questionId,
        action: item.action,
        timestamp: new Date(item.timestamp)
      })),
      choiceAnalysis,
      metricUpdates: choiceAnalysis.metricScores,
      status: 'finalized',
      finalizedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const choiceCollection = await getCollection(COLLECTIONS.STUDENT_QUESTION_CHOICES);
    const choiceResult = await choiceCollection.insertOne(choiceRecord as any);

    // Update variants to mark chosen ones
    await variantCollection.updateMany(
      {
        studentId,
        questionSetId: new ObjectId(questionSetId),
        masterQuestionId: { $in: chosenQuestionIds }
      },
      {
        $set: {
          wasChosen: true,
          chosenAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Update student learning profile
    const profileUpdates = updateProfileFromChoices(profile, choiceAnalysis);
    await profileCollection.updateOne(
      { studentId, classId: questionSet.classId },
      { $set: profileUpdates }
    );

    return NextResponse.json({
      success: true,
      message: 'Choices recorded and analyzed successfully',
      data: {
        choiceId: choiceResult.insertedId,
        analysis: {
          difficultyDistribution: choiceAnalysis.difficultyDistribution,
          bloomsDistribution: choiceAnalysis.bloomsDistribution,
          avoidedQuestions: choiceAnalysis.avoidedQuestions,
          patterns: choiceAnalysis.patterns,
          timeToMakeChoice: choiceAnalysis.timeToMakeChoice,
          hesitationIndicators: choiceAnalysis.hesitationIndicators,
          decisionConfidence: choiceAnalysis.decisionConfidence,
          metricScores: choiceAnalysis.metricScores,
          qualityScore: Math.round(
            (choiceAnalysis.metricScores.confidenceScore * 0.3 +
             choiceAnalysis.metricScores.strategicThinking * 0.4 +
             choiceAnalysis.metricScores.selfAwareness * 0.3)
          )
        }
      }
    });

  } catch (error) {
    console.error('Error recording choices:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to record choices',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assignments/record-choice?studentId=...&assignmentId=...
 * Get student's choice record
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

    const collection = await getCollection(COLLECTIONS.STUDENT_QUESTION_CHOICES);
    const choiceRecord = await collection.findOne({
      studentId,
      assignmentId: new ObjectId(assignmentId) // assignmentId is ObjectId
    });

    if (!choiceRecord) {
      return NextResponse.json(
        { success: false, message: 'Choice record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        choiceRecord
      }
    });

  } catch (error) {
    console.error('Error fetching choice record:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch choice record',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

