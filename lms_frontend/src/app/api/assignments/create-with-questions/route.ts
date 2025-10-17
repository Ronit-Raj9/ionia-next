import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, TeacherQuestionSet, Assignment } from '@/lib/db';
import { analyzeQuestionsBatch } from '@/lib/questionAnalyzer';

/**
 * POST /api/assignments/create-with-questions
 * Create assignment with teacher questions and AI analysis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Received assignment creation request');
    console.log('Body keys:', Object.keys(body));
    
    const {
      assignmentId,
      teacherId,
      classId,
      subject,
      topic,
      title,
      description,
      schoolId,
      selectedStudents,
      questions, // Array of { id, questionText, questionType, options?, correctAnswer?, points }
      assignmentRules, // { totalQuestions, questionsToAttempt, allowStudentChoice, choiceDeadline?, submissionDeadline }
      personalizationEnabled = true,
      personalizationLevel = 'moderate',
      grade
    } = body;

    console.log('Assignment details:', {
      assignmentId,
      teacherId,
      classId,
      subject,
      questionCount: questions?.length,
      selectedStudentsCount: selectedStudents?.length
    });

    // Validate required fields
    if (!assignmentId || !teacherId || !classId || !subject || !questions || !assignmentRules) {
      console.error('❌ Missing required fields:', {
        hasAssignmentId: !!assignmentId,
        hasTeacherId: !!teacherId,
        hasClassId: !!classId,
        hasSubject: !!subject,
        hasQuestions: !!questions,
        hasAssignmentRules: !!assignmentRules
      });
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Questions array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate assignment rules
    if (assignmentRules.totalQuestions !== questions.length) {
      return NextResponse.json(
        { success: false, message: 'Total questions must match questions array length' },
        { status: 400 }
      );
    }

    if (assignmentRules.questionsToAttempt > assignmentRules.totalQuestions) {
      return NextResponse.json(
        { success: false, message: 'Questions to attempt cannot exceed total questions' },
        { status: 400 }
      );
    }

    // Analyze questions using AI
    console.log(`Analyzing ${questions.length} questions...`);
    const analyses = await analyzeQuestionsBatch(
      questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options
      })),
      subject,
      grade || '10'
    );

    // Create master questions with AI analysis
    const masterQuestions = questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: q.points || 10,
      attachments: q.attachments || [],
      aiAnalysis: analyses[q.id]
    }));

    // Create TeacherQuestionSet
    const questionSet: TeacherQuestionSet = {
      assignmentId: assignmentId, // Store as string, not ObjectId
      teacherId,
      classId,
      subject,
      topic: topic || subject,
      masterQuestions,
      assignmentRules: {
        totalQuestions: assignmentRules.totalQuestions,
        questionsToAttempt: assignmentRules.questionsToAttempt,
        allowStudentChoice: assignmentRules.allowStudentChoice !== false,
        choiceDeadline: assignmentRules.choiceDeadline ? new Date(assignmentRules.choiceDeadline) : undefined,
        submissionDeadline: new Date(assignmentRules.submissionDeadline)
      },
      personalizationEnabled,
      personalizationLevel,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collection = await getCollection(COLLECTIONS.TEACHER_QUESTION_SETS);
    const result = await collection.insertOne(questionSet as any);

    // IMPORTANT: Also create an Assignment document so students can see it!
    // Get student IDs (either selected students or all students in the class)
    let assignedStudentIds: string[] = [];
    
    if (selectedStudents && selectedStudents.length > 0) {
      // Use selected students
      assignedStudentIds = selectedStudents;
      console.log(`✅ Using ${assignedStudentIds.length} selected students`);
    } else {
      // Get all students from the class
      try {
        const classesCollection = await getCollection(COLLECTIONS.CLASSES);
        
        // Try to query by classId as both ObjectId and string
        let classData: any = null;
        
        // First try as ObjectId if it looks like one (24 hex chars)
        if (classId && classId.length === 24 && /^[0-9a-fA-F]{24}$/.test(classId)) {
          classData = await classesCollection.findOne({ _id: new ObjectId(classId) });
        }
        
        // If not found, try as string or by other identifiers
        if (!classData) {
          classData = await classesCollection.findOne({ 
            $or: [
              { _id: classId },
              { classId: classId },
              { className: classId }
            ]
          } as any);
        }
        
        if (classData && classData.studentMockIds) {
          assignedStudentIds = classData.studentMockIds;
          console.log(`✅ Found ${assignedStudentIds.length} students in class`);
        } else {
          console.warn(`⚠️ No students found in class ${classId}`);
        }
      } catch (error) {
        console.error('Error fetching class students:', error);
        // Continue without students - assignment will be created but not assigned
      }
    }

    // Calculate total marks (sum of all question points)
    const totalMarks = questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0);

    // Create the Assignment document
    const assignmentData: Omit<Assignment, '_id'> = {
      classId,
      schoolId: schoolId || '',
      taskType: subject.toLowerCase(),
      title: title || `${subject} - ${topic || 'Assignment'}`,
      description: description || `Adaptive assignment with ${questions.length} questions. Choose ${assignmentRules.questionsToAttempt} to attempt.`,
      subject,
      grade: grade || '10',
      topic: topic || subject,
      difficulty: 'medium',
      totalMarks,
      assignmentType: 'personalized',
      originalContent: {
        questions: questions.map((q: any) => q.questionText),
        questionDetails: questions.map((q: any) => ({
          id: q.id,
          text: q.questionText,
          marks: q.points || 0
        }))
      },
      createdBy: teacherId,
      assignedTo: assignedStudentIds,
      gradeSettings: {
        showMarksToStudents: true,
        showFeedbackToStudents: true
      },
      dueDate: assignmentRules.submissionDeadline ? new Date(assignmentRules.submissionDeadline) : undefined,
      maxScore: totalMarks,
      isPublished: true,
      createdAt: new Date(),
      personalizationEnabled,
      personalizedVersions: [],
      submissionStats: {
        totalStudents: assignedStudentIds.length,
        submitted: 0,
        graded: 0,
        pending: assignedStudentIds.length
      }
    };

    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const assignmentResult = await assignmentsCollection.insertOne(assignmentData as any);

    console.log(`✅ Created adaptive assignment for ${assignedStudentIds.length} students`);
    console.log(`Assignment ID: ${assignmentResult.insertedId}`);
    console.log(`Assigned to students:`, assignedStudentIds);
    console.log(`Assignment details:`, {
      title: assignmentData.title,
      classId: assignmentData.classId,
      assignedTo: assignmentData.assignedTo,
      isPublished: assignmentData.isPublished
    });

    // Generate summary statistics
    const difficultyCount = masterQuestions.reduce((acc, q) => {
      acc[q.aiAnalysis.difficulty]++;
      return acc;
    }, { easy: 0, medium: 0, hard: 0 });

    const avgBloomsLevel = masterQuestions.reduce((sum, q) => 
      sum + q.aiAnalysis.bloomsLevel, 0) / masterQuestions.length;

    return NextResponse.json({
      success: true,
      message: 'Question set created and analyzed successfully',
      questionSetId: result.insertedId,
      summary: {
        totalQuestions: masterQuestions.length,
        difficultyDistribution: difficultyCount,
        averageBloomsLevel: Math.round(avgBloomsLevel * 10) / 10,
        personalizationEnabled,
        questionsToAttempt: assignmentRules.questionsToAttempt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating question set:', error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create question set',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assignments/create-with-questions?assignmentId=...
 * Get question set for an assignment
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const questionSetId = searchParams.get('questionSetId');

    if (!assignmentId && !questionSetId) {
      return NextResponse.json(
        { success: false, message: 'assignmentId or questionSetId is required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTIONS.TEACHER_QUESTION_SETS);
    
    let questionSet;
    if (questionSetId) {
      questionSet = await collection.findOne({ _id: new ObjectId(questionSetId) });
    } else {
      questionSet = await collection.findOne({ assignmentId: assignmentId! }); // assignmentId is string
    }

    if (!questionSet) {
      return NextResponse.json(
        { success: false, message: 'Question set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      questionSet
    });

  } catch (error) {
    console.error('Error fetching question set:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch question set',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assignments/create-with-questions
 * Update question set (e.g., modify assignment rules)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionSetId, updates } = body;

    if (!questionSetId) {
      return NextResponse.json(
        { success: false, message: 'questionSetId is required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTIONS.TEACHER_QUESTION_SETS);
    
    const result = await collection.updateOne(
      { _id: new ObjectId(questionSetId) },
      { 
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Question set not found' },
        { status: 404 }
      );
    }

    const updatedSet = await collection.findOne({ _id: new ObjectId(questionSetId) });

    return NextResponse.json({
      success: true,
      message: 'Question set updated successfully',
      questionSet: updatedSet
    });

  } catch (error) {
    console.error('Error updating question set:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update question set',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

