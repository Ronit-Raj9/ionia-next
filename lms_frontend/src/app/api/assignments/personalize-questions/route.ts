import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, StudentQuestionVariant, StudentLearningProfile, TeacherQuestionSet } from '@/lib/db';
import { personalizeQuestionsBatch } from '@/lib/questionPersonalizer';

/**
 * POST /api/assignments/personalize-questions
 * Generate personalized question variants for students
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      questionSetId,
      studentIds, // Array of student IDs or single student ID
      assignmentId
    } = body;

    if (!questionSetId || !studentIds) {
      return NextResponse.json(
        { success: false, message: 'questionSetId and studentIds are required' },
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

    const studentIdArray = Array.isArray(studentIds) ? studentIds : [studentIds];
    const results: Record<string, any> = {};

    // Get learning profiles collection
    const profileCollection = await getCollection(COLLECTIONS.STUDENT_LEARNING_PROFILES);
    const variantCollection = await getCollection(COLLECTIONS.STUDENT_QUESTION_VARIANTS);

    for (const studentId of studentIdArray) {
      try {
        // Get student learning profile
        const profile = await profileCollection.findOne({ 
          studentId, 
          classId: questionSet.classId 
        }) as StudentLearningProfile | null;

        if (!profile) {
          results[studentId] = { success: false, error: 'Learning profile not found' };
          continue;
        }

        // Personalize questions
        const personalizedQuestions = await personalizeQuestionsBatch(
          questionSet.masterQuestions.map(q => ({
            ...q,
            analysis: q.aiAnalysis
          })),
          profile,
          questionSet.subject
        );

        // Create student question variants
        const variants: StudentQuestionVariant[] = questionSet.masterQuestions.map(masterQ => {
          const personalizedResult = personalizedQuestions[masterQ.id];
          return {
            questionSetId: new ObjectId(questionSetId),
            assignmentId: assignmentId || questionSet.assignmentId, // Store as string
            studentId,
            masterQuestionId: masterQ.id,
            personalizedQuestion: {
              questionText: personalizedResult.questionText,
              questionType: personalizedResult.questionType as any,
              options: personalizedResult.options,
              hints: personalizedResult.hints,
              scaffolding: personalizedResult.scaffolding,
              simplifiedLanguage: personalizedResult.simplifiedLanguage,
              additionalContext: personalizedResult.additionalContext,
              encouragementNote: personalizedResult.encouragementNote
            },
            personalizationDetails: personalizedResult.personalizationDetails,
            wasPresented: false,
            wasChosen: false,
            timeSpentViewing: 0,
            viewCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });

        // Insert variants
        await variantCollection.insertMany(variants as any[]);

        results[studentId] = {
          success: true,
          variantsCreated: variants.length,
          personalizationLevel: questionSet.personalizationLevel
        };

      } catch (error) {
        console.error(`Error personalizing for student ${studentId}:`, error);
        results[studentId] = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Personalization completed',
      results
    });

  } catch (error) {
    console.error('Error personalizing questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to personalize questions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assignments/personalize-questions?studentId=...&questionSetId=...
 * Get personalized questions for a student
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const questionSetId = searchParams.get('questionSetId');
    const assignmentId = searchParams.get('assignmentId');

    if (!studentId || (!questionSetId && !assignmentId)) {
      return NextResponse.json(
        { success: false, message: 'studentId and (questionSetId or assignmentId) are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTIONS.STUDENT_QUESTION_VARIANTS);
    
    const query: any = { studentId };
    if (questionSetId) query.questionSetId = new ObjectId(questionSetId);
    if (assignmentId) query.assignmentId = assignmentId; // assignmentId is string

    const variants = await collection.find(query).toArray();

    if (variants.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No personalized questions found' },
        { status: 404 }
      );
    }

    // Mark as presented
    await collection.updateMany(
      query,
      { $set: { wasPresented: true, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      variants,
      totalQuestions: variants.length
    });

  } catch (error) {
    console.error('Error fetching personalized questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch personalized questions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

