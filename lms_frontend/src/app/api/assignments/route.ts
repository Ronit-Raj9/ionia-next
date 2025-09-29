import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Assignment, StudentProfile } from '@/lib/db';
import { personalizeAssignment } from '@/lib/groq';
import { personalizeAssignmentFallback } from '@/lib/openai';
import { uploadFile } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const role = formData.get('role') as string;
    const mockUserId = formData.get('mockUserId') as string;
    const classId = formData.get('classId') as string;
    const questions = formData.get('questions') as string;
    const file = formData.get('file') as File | null;

    // Validate role
    if (role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only teachers can create assignments' },
        { status: 403 }
      );
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

    // Parse questions
    if (questions) {
      questionsList = questions.split('\n').filter(q => q.trim().length > 0);
    } else {
      // If only file provided, create placeholder questions
      questionsList = ['Please solve the problems shown in the uploaded file.'];
    }

    // Get student profiles for personalization
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const studentProfiles = await profilesCollection
      .find({ classId })
      .toArray() as unknown as StudentProfile[];

    if (studentProfiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No student profiles found for this class' },
        { status: 404 }
      );
    }

    // Create assignment document
    const assignment: Assignment = {
      classId,
      taskType: 'math',
      originalContent: { questions: questionsList },
      uploadedFileUrl,
      createdBy: mockUserId,
      createdAt: new Date(),
      personalizedVersions: [],
    };

    // Personalize for each student
    const personalizationPromises = studentProfiles.map(async (profile) => {
      try {
        let personalized;
        
        // Try Groq first, fallback to OpenAI
        try {
          personalized = await personalizeAssignment({
            questions: questionsList,
            studentProfile: {
              weaknesses: profile.previousPerformance.weaknesses,
              personalityType: profile.personalityProfile.type,
              intellectualStrengths: profile.intellectualProfile.strengths,
            },
          });
        } catch (groqError) {
          console.warn('Groq failed, trying OpenAI fallback:', groqError);
          personalized = await personalizeAssignmentFallback({
            questions: questionsList,
            studentProfile: {
              weaknesses: profile.previousPerformance.weaknesses,
              personalityType: profile.personalityProfile.type,
              intellectualStrengths: profile.intellectualProfile.strengths,
            },
          });
        }

        return {
          studentMockId: profile.studentMockId,
          adaptedContent: {
            questions: personalized.questions,
            variations: personalized.variations,
          },
        };
      } catch (error) {
        console.error(`Failed to personalize for ${profile.studentMockId}:`, error);
        // Return original questions as fallback
        return {
          studentMockId: profile.studentMockId,
          adaptedContent: {
            questions: questionsList,
            variations: 'Using original questions (personalization failed)',
          },
        };
      }
    });

    const personalizedVersions = await Promise.all(personalizationPromises);
    assignment.personalizedVersions = personalizedVersions;

    // Save assignment to database
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const result = await assignmentsCollection.insertOne(assignment);

    return NextResponse.json({
      success: true,
      data: {
        assignmentId: result.insertedId,
        personalizedCount: personalizedVersions.length,
        assignment: {
          ...assignment,
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
    const mockUserId = searchParams.get('mockUserId');
    const classId = searchParams.get('classId');
    const studentMockId = searchParams.get('studentMockId');

    if (!role || !mockUserId) {
      return NextResponse.json(
        { success: false, error: 'Role and mockUserId are required' },
        { status: 400 }
      );
    }

    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);

    if (role === 'student') {
      // Get personalized assignments for student
      if (!studentMockId) {
        return NextResponse.json(
          { success: false, error: 'studentMockId is required for students' },
          { status: 400 }
        );
      }

      const assignments = await assignmentsCollection
        .find({ classId })
        .sort({ createdAt: -1 })
        .toArray();

      const personalizedAssignments = assignments.map((assignment) => {
        const personalizedVersion = assignment.personalizedVersions?.find(
          (pv: any) => pv.studentMockId === studentMockId
        );

        return {
          _id: assignment._id,
          taskType: assignment.taskType,
          createdAt: assignment.createdAt,
          uploadedFileUrl: assignment.uploadedFileUrl,
          questions: personalizedVersion?.adaptedContent.questions || assignment.originalContent.questions,
          variations: personalizedVersion?.adaptedContent.variations || 'No personalization available',
          originalQuestions: assignment.originalContent.questions,
        };
      });

      return NextResponse.json({
        success: true,
        data: personalizedAssignments,
      });
    } else if (role === 'teacher' || role === 'admin') {
      // Get all assignments for teacher/admin
      const assignments = await assignmentsCollection
        .find({ classId })
        .sort({ createdAt: -1 })
        .toArray();

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
