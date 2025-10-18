import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, StudentQuestionVariant, StudentLearningProfile, TeacherQuestionSet } from '@/lib/db';
import { personalizeQuestionsBatch } from '@/lib/questionPersonalizer';
import { QuestionAnalysis } from '@/lib/questionAnalyzer';

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

    // Validate required fields
    if (!questionSetId || !studentIds) {
      return NextResponse.json(
        { success: false, message: 'questionSetId and studentIds are required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(questionSetId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid questionSetId format' },
        { status: 400 }
      );
    }

    // Validate assignmentId if provided
    if (assignmentId && !ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid assignmentId format' },
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

    if (!questionSet.personalizationEnabled) {
      return NextResponse.json(
        { success: false, message: 'Personalization is not enabled for this question set' },
        { status: 400 }
      );
    }

    if (!questionSet.masterQuestions || questionSet.masterQuestions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Question set has no questions' },
        { status: 400 }
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

        // Personalize questions using the new system
        const personalizedQuestions = await personalizeQuestionsBatch(
          questionSet.masterQuestions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            points: q.points,
            analysis: q.aiAnalysis as unknown as QuestionAnalysis
          })),
          profile,
          questionSet.subject
        );

        if (!personalizedQuestions || Object.keys(personalizedQuestions).length === 0) {
          results[studentId] = { success: false, error: 'Failed to personalize questions - no results returned' };
          continue;
        }

        // Validate that all questions were personalized
        const missingQuestions = questionSet.masterQuestions.filter(q => !personalizedQuestions[q.id]);
        if (missingQuestions.length > 0) {
          console.warn(`Missing personalization for questions: ${missingQuestions.map(q => q.id).join(', ')}`);
        }

        // Create student question variants
        const variants: StudentQuestionVariant[] = questionSet.masterQuestions.map(masterQ => {
          const personalizedResult = personalizedQuestions[masterQ.id];
          
          if (!personalizedResult) {
            throw new Error(`No personalization result found for question ${masterQ.id}`);
          }
          
          return {
            questionSetId: new ObjectId(questionSetId),
            assignmentId: new ObjectId(assignmentId || questionSet.assignmentId.toString()), // Convert to ObjectId
            studentId,
            masterQuestionId: masterQ.id,
            personalizedQuestion: {
              questionText: personalizedResult.questionText,
              questionType: personalizedResult.questionType as 'mcq' | 'short_answer' | 'long_answer' | 'numerical' | 'essay' | 'true_false',
              options: personalizedResult.options,
              hints: personalizedResult.hints,
              scaffolding: personalizedResult.scaffolding,
              simplifiedLanguage: personalizedResult.simplifiedLanguage,
              additionalContext: personalizedResult.additionalContext,
              encouragementNote: personalizedResult.encouragementNote
            },
            personalizationDetails: {
              ...personalizedResult.personalizationDetails,
              expectedAccuracy: personalizedResult.personalizationDetails.expectedAccuracy || 75
            },
            wasPresented: false,
            wasChosen: false,
            timeSpentViewing: 0,
            viewCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });

        // Insert variants with error handling
        if (variants.length > 0) {
          try {
            await variantCollection.insertMany(variants as any[]);
          } catch (insertError) {
            console.error(`Error inserting variants for student ${studentId}:`, insertError);
            results[studentId] = { 
              success: false, 
              error: 'Failed to save personalized questions to database' 
            };
            continue;
          }
        }

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

    // Validate studentId format (should be a non-empty string)
    if (!studentId || studentId.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid studentId format' },
        { status: 400 }
      );
    }

    // Validate ObjectId formats
    if (questionSetId && !ObjectId.isValid(questionSetId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid questionSetId format' },
        { status: 400 }
      );
    }

    if (assignmentId && !ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid assignmentId format' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTIONS.STUDENT_QUESTION_VARIANTS);
    
    const query: any = { studentId };
    if (questionSetId) query.questionSetId = new ObjectId(questionSetId);
    if (assignmentId) query.assignmentId = new ObjectId(assignmentId); // Convert to ObjectId

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

