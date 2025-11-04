import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, Assignment, StudentProfile } from '@/lib/db';
import { personalizeAssignmentWithOcean } from '@/lib/groq';
import { personalizeAssignmentFallback } from '@/lib/openai';
import { personalizeAssignment } from '@/lib/gemini-service';
import { uploadFile } from '@/lib/cloudinary';

/**
 * POST /api/assignments/create-with-questions
 * Create assignment with teacher questions (simplified new system)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    console.log('📥 Received assignment creation request');
    
    const role = formData.get('role') as string;
    const teacherId = formData.get('teacherId') as string;
    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const topic = formData.get('topic') as string;
    const title = formData.get('title') as string || 'New Assignment';
    const description = formData.get('description') as string || '';
    const grade = formData.get('grade') as string || '9';
    const difficulty = formData.get('difficulty') as string || 'medium';
    const totalMarks = parseInt(formData.get('totalMarks') as string) || 100;
    const dueDate = formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined;
    const showMarksToStudents = formData.get('showMarksToStudents') === 'true';
    const showFeedbackToStudents = formData.get('showFeedbackToStudents') === 'true';
    const assignedStudents = formData.get('assignedStudents') as string;
    const enablePersonalization = formData.get('enablePersonalization') !== 'false';
    const schoolId = formData.get('schoolId') as string;
    const questions = formData.get('questions') as string;
    const file = formData.get('file') as File | null;
    const questionDetails = formData.get('questionDetails') as string;

    console.log('Assignment details:', {
      teacherId,
      classId,
      subject,
      title,
      grade
    });

    // Validate required fields
    if (!teacherId || !classId || !subject) {
      console.error('❌ Missing required fields:', {
        hasTeacherId: !!teacherId,
        hasClassId: !!classId,
        hasSubject: !!subject
      });
      return NextResponse.json(
        { success: false, message: 'Missing required fields: teacherId, classId, and subject are required' },
        { status: 400 }
      );
    }

    // Validate classId format
    if (!ObjectId.isValid(classId)) {
      console.error('❌ Invalid classId format:', classId);
      return NextResponse.json(
        { success: false, message: 'Invalid class ID format' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Only teachers can create assignments' },
        { status: 403 }
      );
    }

    // Validate that the class exists and teacher has permission
    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const classData = await classesCollection.findOne({
      _id: new ObjectId(classId),
      teacherId: teacherId
    });

    if (!classData) {
      console.error('❌ Class not found or teacher not authorized:', { classId, teacherId });
      return NextResponse.json(
        { success: false, message: 'Class not found or you do not have permission to create assignments for this class' },
        { status: 403 }
      );
    }

    console.log('✅ Class validation passed:', {
      className: classData.className,
      teacherId: classData.teacherId,
      studentCount: classData.studentIds?.length || 0
    });

    if (!questions && !file) {
      return NextResponse.json(
        { success: false, message: 'Either questions or file must be provided' },
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
          { success: false, message: uploadResult.error },
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
          // Legacy fields for backward compatibility
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
      classId: classId, // Store as string (ObjectId string representation)
      schoolId: classData.schoolId?.toString() || schoolId, // Use class's schoolId or fallback
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
      createdBy: teacherId,
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

    // Personalize for each student if enabled
    let personalizedVersions: any[] = [];
    
    if (enablePersonalization && studentProfiles.length > 0) {
      console.log(`Personalizing assignment for ${studentProfiles.length} students...`);
      
      const personalizationPromises = studentProfiles.map(async (profile) => {
        try {
          // Check if student has OCEAN profile
          const hasOceanProfile = profile.oceanTraits && 
                                  profile.learningPreferences && 
                                  profile.personalityTestCompleted;
          
          let personalized;
          
          // Try FastAPI ARC agent first
          try {
            console.log(`Using ARC agent personalization for ${profile.studentId}...`);
            
            const subjectMastery = profile.subjectMastery?.find(s => s.subject === subject && s.grade === grade);
            const topicInfo = subjectMastery?.topics.find(t => t.name === topic);
            const topicMastery = topicInfo?.masteryScore || 50;
            const weaknesses = topicInfo?.weaknesses || profile.previousPerformance?.weaknesses || [];
            
            // Build mastery map
            const currentMastery: Record<string, number> = {};
            if (topicInfo) {
              currentMastery[topic] = topicMastery;
            }
            
            const arcResponse = await fetch('http://localhost:8000/api/arc/personalize-assignment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                student_profile: {
                  ocean: profile.oceanTraits || {
                    openness: 50,
                    conscientiousness: 50,
                    extraversion: 50,
                    agreeableness: 50,
                    neuroticism: 50
                  },
                  learningPreferences: profile.learningPreferences || {
                    visual: 50,
                    auditory: 50,
                    kinesthetic: 50,
                    readingWriting: 50
                  },
                  currentMastery: currentMastery,
                  weaknesses: weaknesses
                },
                questions: questionsList.map((q, idx) => ({
                  _id: `q${idx + 1}`,
                  text: q,
                  marks: detailedQuestions[idx]?.marks || Math.floor(totalMarks / questionsList.length)
                })),
                subject: subject,
                difficulty_level: difficulty
              })
            });

            if (!arcResponse.ok) {
              throw new Error(`ARC agent failed: ${arcResponse.statusText}`);
            }

            const arcResult = await arcResponse.json();
            
            console.log(`✓ ARC agent personalization complete for ${profile.studentId}`);
            console.log(`Strategy: ${arcResult.strategy}`);

            // Map ARC response to existing structure
            const personalizedQuestions = arcResult.personalized_questions || [];
            
            return {
              studentId: profile.studentId,
              adaptedContent: {
                questions: personalizedQuestions.map((pq: any) => pq.personalized_text || pq.original_question_id),
                variations: personalizedQuestions.map((pq: any) => ({
                  original: pq.original_question_id,
                  personalized: pq.personalized_text,
                  strategy: pq.personalization_strategy
                })),
                difficultyAdjustment: personalizedQuestions.some((pq: any) => pq.difficulty_adjusted) ? 'adjusted' : 'maintained',
                visualAids: [],
                hints: [],
                remedialQuestions: [],
                challengeQuestions: [],
                encouragementNote: arcResult.strategy || 'Personalized for your learning style!'
              },
              personalizationReason: arcResult.strategy || 'Adaptive personalization using multi-agent AI system',
              arcMetadata: {
                estimatedTime: arcResult.estimated_time,
                personalizationFactors: arcResult.personalization_factors
              }
            };
            
          } catch (arcError) {
            console.warn('ARC agent personalization failed, falling back to local:', arcError);
            
            // Fallback to original personalization logic
            if (hasOceanProfile) {
              const subjectMastery = profile.subjectMastery?.find(s => s.subject === subject && s.grade === grade);
              const topicInfo = subjectMastery?.topics.find(t => t.name === topic);
              const topicMastery = topicInfo?.masteryScore || 50;
              const weaknesses = topicInfo?.weaknesses || profile.previousPerformance?.weaknesses || [];
              
              console.log(`Using OCEAN personalization fallback for ${profile.studentId} (mastery: ${topicMastery}%)`);
            
            personalized = await personalizeAssignmentWithOcean({
              questions: questionsList,
              studentProfile: {
                oceanTraits: profile.oceanTraits!,
                learningPreferences: profile.learningPreferences!,
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
          } else {
            // Fallback to basic personalization
            console.log(`Using basic personalization for ${profile.studentId} (no OCEAN profile)`);
            
            try {
              personalized = await personalizeAssignment(
                questionsList,
                profile,
                subject,
                topic,
                grade
              );
            } catch (groqError) {
              console.warn('Gemini failed, trying OpenAI fallback:', groqError);
              personalized = await personalizeAssignmentFallback({
                questions: questionsList,
                studentProfile: {
                  weaknesses: profile.previousPerformance?.weaknesses || [],
                  personalityType: profile.personalityProfile?.type || 'balanced',
                  intellectualStrengths: profile.intellectualProfile?.strengths || [],
                },
              });
            }

            return {
              studentId: profile.studentId,
              adaptedContent: {
                questions: 'personalizedQuestions' in personalized ? personalized.personalizedQuestions : personalized.questions,
                variations: personalized.variations,
                difficultyAdjustment: 'difficultyAdjustment' in personalized ? personalized.difficultyAdjustment : undefined,
                visualAids: 'visualAids' in personalized ? personalized.visualAids : undefined,
                hints: 'hints' in personalized ? personalized.hints : undefined,
                remedialQuestions: 'remedialQuestions' in personalized ? personalized.remedialQuestions : undefined,
                challengeQuestions: 'challengeQuestions' in personalized ? personalized.challengeQuestions : undefined,
                encouragementNote: 'encouragementNote' in personalized ? personalized.encouragementNote : undefined
              },
              personalizationReason: 'personalizationReason' in personalized ? personalized.personalizationReason : 'Legacy personalization (OCEAN profile incomplete)'
            };
          }
          }
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

    // Auto-create event and notifications for the assignment
    try {
      const assignmentId = result.insertedId.toString();
      
      // Create event for assignment due date
      if (dueDate) {
        const eventsCollection = await getCollection(COLLECTIONS.EVENTS);
        const event = {
          eventType: 'assignment_due' as const,
          title: `Assignment Due: ${title}`,
          description: description || `Complete the assignment: ${title}`,
          scheduledAt: new Date(dueDate),
          duration: 60,
          schoolId: classData.schoolId,
          classId: classId,
          assignmentId: assignmentId,
          createdBy: teacherId,
          targetAudience: {
            role: ['student' as const],
            specificUsers: assignedStudentsList,
            classIds: [classId],
          },
          alerts: [],
          priority: 'high' as const,
          status: 'scheduled' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await eventsCollection.insertOne(event);
        console.log(`✓ Created event for assignment ${assignmentId}`);
      }
      
      // Create notifications for all assigned students
      const notificationsCollection = await getCollection(COLLECTIONS.NOTIFICATIONS);
      const notifications = assignedStudentsList.map(studentId => ({
        type: 'assignment_created' as const,
        userId: studentId,
        schoolId: classData.schoolId,
        classId: classId,
        title: `New Assignment: ${title}`,
        message: `Your teacher has assigned: ${title}. ${description || ''}${dueDate ? ` Due: ${new Date(dueDate).toLocaleDateString()}` : ''}`,
        shortMessage: `New assignment: ${title}`,
        data: {
          assignmentId: assignmentId,
          classId: classId,
          link: `/assignments/${assignmentId}`,
          action: {
            label: 'View Assignment',
            url: `/assignments/${assignmentId}`
          }
        },
        channels: {
          inApp: true,
          email: true,
        },
        priority: dueDate ? 'high' as const : 'normal' as const,
        status: 'pending' as const,
        triggeredBy: {
          event: 'assignment_created',
          source: 'teacher' as const,
          sourceId: teacherId
        },
        createdBy: teacherId,
        createdAt: new Date(),
      }));
      
      if (notifications.length > 0) {
        await notificationsCollection.insertMany(notifications);
        console.log(`✓ Created ${notifications.length} notifications for assignment ${assignmentId}`);
      }
    } catch (eventError) {
      console.warn('Failed to create events/notifications, but assignment was created:', eventError);
      // Don't fail the request if event/notification creation fails
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
 * GET /api/assignments/create-with-questions
 * Get assignment by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const studentId = searchParams.get('studentId');

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, message: 'assignmentId is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid assignmentId format' },
        { status: 400 }
      );
    }

    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(assignmentId) });

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (role === 'student') {
      if (!studentId) {
        return NextResponse.json(
          { success: false, message: 'studentId is required for students' },
          { status: 400 }
        );
      }
      
      // Check if student is assigned to this assignment
      if (!assignment.assignedTo.includes(studentId)) {
        return NextResponse.json(
          { success: false, message: 'Access denied - not assigned to this assignment' },
          { status: 403 }
        );
      }
    } else if (role === 'teacher') {
      // Check if teacher created this assignment
      if (assignment.createdBy !== userId) {
        return NextResponse.json(
          { success: false, message: 'Access denied - not your assignment' },
          { status: 403 }
        );
      }
    }

    // Convert ObjectId to string for JSON serialization
    const serializedAssignment = {
      ...assignment,
      _id: assignment._id?.toString()
    };

    return NextResponse.json({
      success: true,
      data: serializedAssignment
    });

  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch assignment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assignments/create-with-questions
 * Update assignment
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, updates, role, userId } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, message: 'assignmentId is required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Valid updates object is required' },
        { status: 400 }
      );
    }

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, message: 'role and userId are required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid assignmentId format' },
        { status: 400 }
      );
    }

    // Check permissions
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only teachers and admins can update assignments' },
        { status: 403 }
      );
    }

    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    
    // Check if assignment exists and user has permission
    const existingAssignment = await assignmentsCollection.findOne({ _id: new ObjectId(assignmentId) });
    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, message: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check if user created this assignment (unless admin)
    if (role === 'teacher' && existingAssignment.createdBy !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied - not your assignment' },
        { status: 403 }
      );
    }

    const result = await assignmentsCollection.updateOne(
      { _id: new ObjectId(assignmentId) },
      { 
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No changes made to assignment' },
        { status: 400 }
      );
    }

    const updatedAssignment = await assignmentsCollection.findOne({ _id: new ObjectId(assignmentId) });

    if (!updatedAssignment) {
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve updated assignment' },
        { status: 500 }
      );
    }

    // Convert ObjectId to string for JSON serialization
    const serializedAssignment = {
      ...updatedAssignment,
      _id: updatedAssignment._id?.toString()
    };

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      data: serializedAssignment
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update assignment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

