import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Assignment, StudentProfile } from '@/lib/db';
import { personalizeAssignmentWithOcean } from '@/lib/groq';
import { uploadFile } from '@/lib/cloudinary';
import { generateAssignmentSuggestions } from '@/lib/aiRecommendations';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const role = formData.get('role') as string;
    const userId = formData.get('userId') as string;
    const classId = formData.get('classId') as string;
    const questions = formData.get('questions') as string;
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string || 'New Assignment';
    const description = formData.get('description') as string || '';
    const subject = formData.get('subject') as string || 'Science';
    const grade = formData.get('grade') as string || '9';
    const topic = formData.get('topic') as string || '';
    const difficulty = formData.get('difficulty') as string || 'medium';
    const totalMarks = parseInt(formData.get('totalMarks') as string) || 100;
    const dueDate = formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined;
    const showMarksToStudents = formData.get('showMarksToStudents') === 'true';
    const showFeedbackToStudents = formData.get('showFeedbackToStudents') === 'true';
    const assignedStudents = formData.get('assignedStudents') as string;
    const enablePersonalization = formData.get('enablePersonalization') !== 'false'; // Default true
    const schoolId = formData.get('schoolId') as string;
    const questionDetails = formData.get('questionDetails') as string;

    // Validate role
    if (role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only teachers can create assignments' },
        { status: 403 }
      );
    }

    // Validate classId format
    if (classId && !ObjectId.isValid(classId)) {
      console.error('❌ Invalid classId format:', classId);
      return NextResponse.json(
        { success: false, error: 'Invalid class ID format' },
        { status: 400 }
      );
    }

    // Validate that the class exists and teacher has permission (if classId provided)
    let classData = null;
    if (classId) {
      const classesCollection = await getCollection(COLLECTIONS.CLASSES);
      classData = await classesCollection.findOne({
        _id: new ObjectId(classId),
        teacherId: userId
      });

      if (!classData) {
        console.error('❌ Class not found or teacher not authorized:', { classId, userId });
        return NextResponse.json(
          { success: false, error: 'Class not found or you do not have permission to create assignments for this class' },
          { status: 403 }
        );
      }
    }

    if (!questions && !file) {
      return NextResponse.json(
        { success: false, error: 'Either questions or file must be provided' },
        { status: 400 }
      );
    }

    let uploadedFileUrl: string | undefined;
    let questionsList: string[] = [];

    // Handle file upload if provided
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadResult = await uploadFile(buffer, file.name, 'assignments');
      
      if (!uploadResult.success) {
        return NextResponse.json(
          { success: false, error: uploadResult.error },
          { status: 500 }
        );
      }
      
      uploadedFileUrl = uploadResult.url;
    }

    // Parse questions and question details
    let detailedQuestions: Array<{id: string, text: string, marks: number}> = [];
    
    if (questionDetails) {
      try {
        detailedQuestions = JSON.parse(questionDetails);
        questionsList = detailedQuestions.map(q => q.text).filter(text => text.trim().length > 0);
      } catch (error) {
        console.error('Error parsing question details:', error);
        // Fallback to simple questions parsing
        if (questions) {
          questionsList = questions.split('\n').filter(q => q.trim().length > 0);
        }
      }
    } else if (questions) {
      questionsList = questions.split('\n').filter(q => q.trim().length > 0);
    } else {
      // If only file provided, create placeholder questions
      questionsList = ['Please solve the problems shown in the uploaded file.'];
    }

    // Parse assigned students
    let assignedStudentsList: string[] = [];
    let isEntireClass = false;
    
    if (assignedStudents && assignedStudents.trim() !== '') {
      try {
        assignedStudentsList = JSON.parse(assignedStudents);
      } catch {
        assignedStudentsList = assignedStudents.split(',').map(s => s.trim());
      }
    } else {
      // No specific students assigned = entire class
      isEntireClass = true;
    }

    // Get student profiles for personalization
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    let studentProfiles: StudentProfile[] = [];
    
    if (isEntireClass) {
      // Get all students in the class
      studentProfiles = await profilesCollection
        .find({ classId })
        .toArray() as unknown as StudentProfile[];
      assignedStudentsList = studentProfiles.map(p => p.studentId);
      console.log(`📚 Assignment assigned to ENTIRE CLASS: ${assignedStudentsList.length} students`);
    } else {
      // Get only selected students
      studentProfiles = await profilesCollection
        .find({ studentId: { $in: assignedStudentsList } })
        .toArray() as unknown as StudentProfile[];
      console.log(`👥 Assignment assigned to SELECTED STUDENTS: ${assignedStudentsList.length} students`);
    }

    if (studentProfiles.length === 0 && assignedStudentsList.length > 0) {
      // Create basic profiles for students without existing profiles
      assignedStudentsList.forEach(studentId => {
        studentProfiles.push({
          studentId: studentId,
          // OCEAN Personality Traits (default balanced values)
          oceanTraits: {
            openness: 50,
            conscientiousness: 50,
            extraversion: 50,
            agreeableness: 50,
            neuroticism: 50
          },
          // Learning Preferences (default balanced)
          learningPreferences: {
            visualLearner: true,
            kinestheticLearner: false,
            auditoryLearner: false,
            readingWritingLearner: false,
            preferredDifficulty: 'medium' as const,
            needsStepByStepGuidance: false,
            respondsToEncouragement: true
          },
          // Intellectual Traits (default balanced)
          intellectualTraits: {
            analyticalThinking: 50,
            creativeThinking: 50,
            criticalThinking: 50,
            problemSolvingSkill: 50
          },
          // Subject Mastery (empty for new students)
          subjectMastery: [],
          // Assignment History (empty for new students)
          assignmentHistory: [],
          // Personality Test Status
          personalityTestCompleted: false,
          // Additional metadata fields
          previousPerformance: {
            subject: subject,
            weaknesses: [],
            masteryScores: {}
          },
          personalityProfile: {
            type: 'balanced',
            quizResponses: []
          },
          intellectualProfile: {
            strengths: [],
            responsePatterns: []
          },
          updatedAt: new Date()
        });
      });
    }

    // Log assignment creation details
    console.log('Creating assignment with details:', {
      classId,
      schoolId,
      subject,
      title,
      assignedStudentsCount: assignedStudentsList.length
    });

    // Create assignment document (omit _id to let MongoDB generate it)
    const assignmentData: Omit<Assignment, '_id'> = {
      classId: classId || '', // Store as string
      schoolId: classData?.schoolId?.toString() || schoolId, // Use class's schoolId or fallback
      taskType: subject.toLowerCase(),
      title,
      description,
      subject,
      grade: grade,
      topic: topic,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      totalMarks,
      maxScore: totalMarks,
      assignmentType: enablePersonalization ? 'personalized' : 'standard',
      personalizationEnabled: enablePersonalization,
      originalContent: { 
        questions: questionsList,
        questionDetails: detailedQuestions.length > 0 ? detailedQuestions : undefined
      },
      uploadedFileUrl,
      createdBy: userId,
      assignedTo: isEntireClass ? [classId] : assignedStudentsList, // Store classId for entire class, student IDs for selected students
      gradeSettings: {
        showMarksToStudents,
        showFeedbackToStudents,
      },
      submissionStats: {
        totalStudents: assignedStudentsList.length,
        submitted: 0,
        graded: 0,
        pending: assignedStudentsList.length
      },
      dueDate,
      isPublished: true,
      createdAt: new Date(),
      personalizedVersions: [],
    };

    // Personalize for each student using OCEAN-based system
    let personalizedVersions: any[] = [];
    
    if (enablePersonalization && studentProfiles.length > 0) {
      console.log(`Personalizing assignment for ${studentProfiles.length} students using OCEAN system...`);
      
      const personalizationPromises = studentProfiles.map(async (profile) => {
        try {
          // Use OCEAN-based personalization for all students
          const subjectMastery = profile.subjectMastery?.find(s => s.subject === subject && s.grade === grade);
          const topicInfo = subjectMastery?.topics.find(t => t.name === topic);
          const topicMastery = topicInfo?.masteryScore || 50;
          const weaknesses = topicInfo?.weaknesses || [];
          
          console.log(`Using OCEAN personalization for ${profile.studentId} (mastery: ${topicMastery}%)`);
          
          const personalized = await personalizeAssignmentWithOcean({
            questions: questionsList,
            studentProfile: {
              oceanTraits: profile.oceanTraits,
              learningPreferences: profile.learningPreferences,
              topicMastery,
              weaknesses
            },
            subject,
            topic,
            grade
          });
          
          return {
            studentId: profile.studentId,
            adaptedContent: {
              questions: personalized.personalizedQuestions,
              variations: personalized.variations,
              difficultyAdjustment: personalized.difficultyAdjustment,
              visualAids: personalized.visualAids,
              hints: personalized.hints,
              remedialQuestions: personalized.remedialQuestions,
              challengeQuestions: personalized.challengeQuestions,
              encouragementNote: personalized.encouragementNote
            },
            personalizationReason: personalized.personalizationReason
          };
        } catch (error) {
          console.error(`Failed to personalize for ${profile.studentId}:`, error);
          // Return original questions as fallback
          return {
            studentId: profile.studentId,
            adaptedContent: {
              questions: questionsList,
              variations: 'Using original questions (personalization failed)',
            },
            personalizationReason: 'Personalization error - using standard assignment'
          };
        }
      });

      personalizedVersions = await Promise.all(personalizationPromises);
      console.log(`✓ Personalization complete for ${personalizedVersions.length} students`);
    } else {
      console.log('Personalization disabled or no students - creating standard assignment');
    }
    
    assignmentData.personalizedVersions = personalizedVersions;

    // Save assignment to database
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const result = await assignmentsCollection.insertOne(assignmentData);

    // Generate AI-powered assignment suggestions for future use
    try {
      const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
      const classProgress = await progressCollection.find({ classId }).toArray();
      
      if (classProgress.length > 0) {
        // Calculate class weaknesses and average mastery
        const allWeaknesses = classProgress.flatMap(p => p.metrics.weaknesses || []);
        const weaknessFrequency = allWeaknesses.reduce((acc, weakness) => {
          acc[weakness] = (acc[weakness] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const topWeaknesses = Object.entries(weaknessFrequency)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([weakness]) => weakness);
        
        const averageScore = classProgress.reduce((sum, p) => sum + (p.metrics.averageScore || 0), 0) / classProgress.length;
        
        // Generate suggestions
        const suggestions = await generateAssignmentSuggestions(topWeaknesses, averageScore, 'mathematics');
        
        // Update the assignment with suggestions
        await assignmentsCollection.updateOne(
          { _id: result.insertedId },
          { $set: { suggestions } }
        );
        
        assignmentData.suggestions = suggestions;
      }
    } catch (suggestionError) {
      console.error('Failed to generate assignment suggestions:', suggestionError);
      // Continue without suggestions - not critical for assignment creation
    }

    return NextResponse.json({
      success: true,
      data: {
        assignmentId: result.insertedId,
        personalizedCount: personalizedVersions.length,
        assignment: {
          ...assignmentData,
          _id: result.insertedId,
        },
      },
    });
  } catch (error) {
    console.error('Assignment creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);

    if (role === 'student') {
      // Get assignments assigned to this specific student
      if (!studentId) {
        return NextResponse.json(
          { success: false, error: 'studentId is required for students' },
          { status: 400 }
        );
      }

      console.log(`🔍 Student fetching assignments:`, {
        studentId,
        classId: classId || 'all classes'
      });

      // Build query - assignments can be assigned to:
      // 1. The specific student ID (for selected student assignments)
      // 2. The class ID (for "entire class" assignments)
      const query: any = {
        $or: [
          { assignedTo: studentId }, // Direct assignment to student
          { assignedTo: classId },   // Assignment to entire class
          { assignedTo: { $in: [studentId, classId] } } // Assignment to either
        ],
        isPublished: true
      };
      
      console.log(`🔍 Student assignment query:`, JSON.stringify(query, null, 2));

      // If classId is provided, also filter by classId field
      if (classId) {
        query.$and = [
          { $or: query.$or },
          { 
            $or: [
              { classId: classId },
              { classId: { $exists: false } }, // Handle assignments without classId
              { classId: null }
            ]
          }
        ];
        delete query.$or; // Remove the original $or since we're using $and
      }

      console.log(`Query:`, JSON.stringify(query, null, 2));

      // Debug: Check all assignments in database
      const allAssignments = await assignmentsCollection.find({}).toArray();
      console.log(`🔍 All assignments in database:`, allAssignments.map(a => ({
        id: a._id,
        title: a.title,
        classId: a.classId,
        assignedTo: a.assignedTo,
        isPublished: a.isPublished
      })));

      const assignments = await assignmentsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`📊 Found ${assignments.length} assignments for student ${studentId}`);

      const personalizedAssignments = assignments.map((assignment) => {
        const personalizedVersion = assignment.personalizedVersions?.find(
          (pv: any) => pv.studentId === studentId
        );

        const adaptedContent = personalizedVersion?.adaptedContent || {};
        
        return {
          _id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          subject: assignment.subject,
          grade: assignment.grade,
          topic: assignment.topic,
          difficulty: assignment.difficulty,
          totalMarks: assignment.totalMarks,
          taskType: assignment.taskType,
          dueDate: assignment.dueDate,
          createdAt: assignment.createdAt,
          uploadedFileUrl: assignment.uploadedFileUrl,
          
          // Personalized content
          questions: adaptedContent.questions || assignment.originalContent?.questions || [],
          variations: adaptedContent.variations || 'No personalization available',
          difficultyAdjustment: adaptedContent.difficultyAdjustment,
          visualAids: adaptedContent.visualAids,
          hints: adaptedContent.hints,
          remedialQuestions: adaptedContent.remedialQuestions,
          challengeQuestions: adaptedContent.challengeQuestions,
          encouragementNote: adaptedContent.encouragementNote,
          personalizationReason: personalizedVersion?.personalizationReason,
          
          // Original content for reference
          originalQuestions: assignment.originalContent?.questions || [],
          
          // Grade visibility
          canSeeGrades: assignment.gradeSettings?.showMarksToStudents || false,
          canSeeFeedback: assignment.gradeSettings?.showFeedbackToStudents || true,
          
          // Assignment type
          isPersonalized: !!personalizedVersion,
          assignmentType: assignment.assignmentType || 'standard'
        };
      });

      return NextResponse.json({
        success: true,
        data: personalizedAssignments,
      });
    } else if (role === 'teacher' || role === 'admin') {
      // Get assignments created by this teacher or all assignments for admin
      let query: any = {};
      
      if (role === 'teacher') {
        query.createdBy = userId;
      }
      
      if (classId) {
        // Handle both ObjectId format and string format classId
        query.$or = [
          { classId: classId },
          { classId: { $exists: false } }, // Handle assignments without classId
          { classId: null }
        ];
      }

      console.log(`🔍 Teacher fetching assignments:`, {
        userId,
        classId: classId || 'all classes',
        query: JSON.stringify(query, null, 2)
      });

      const assignments = await assignmentsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`📊 Found ${assignments.length} assignments for teacher ${userId}`);

      return NextResponse.json({
        success: true,
        data: assignments,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Assignment fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
