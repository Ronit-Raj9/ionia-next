import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, StudentProfile } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      studentId, 
      personalityProfile, // Legacy support
      oceanTraits,
      learningPreferences,
      intellectualTraits,
      personalityTestCompleted,
      testTakenDate,
      quizResponses
    } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);

    // Prepare update data - support both new OCEAN format and basic format
    const updateData: any = {
      studentId: studentId,
      updatedAt: new Date()
    };

    // If OCEAN traits provided (new format)
    if (oceanTraits) {
      updateData.oceanTraits = oceanTraits;
      updateData.personalityTestCompleted = personalityTestCompleted || true;
      updateData.testTakenDate = testTakenDate || new Date();
      
      if (quizResponses) {
        updateData.quizResponses = quizResponses;
      }
    }

    // If learning preferences provided
    if (learningPreferences) {
      updateData.learningPreferences = learningPreferences;
    }

    // If intellectual traits provided
    if (intellectualTraits) {
      updateData.intellectualTraits = intellectualTraits;
    }

    // Legacy support - if personalityProfile provided (old format)
    if (personalityProfile && !oceanTraits) {
      updateData.personalityProfile = {
        type: personalityProfile.type || personalityProfile.learningStyle || 'visual',
        quizResponses: personalityProfile.quizResponses || [],
        problemSolving: personalityProfile.problemSolving,
        collaboration: personalityProfile.collaboration,
        motivation: personalityProfile.motivation,
        feedback: personalityProfile.feedback,
        completedAt: new Date()
      };
      updateData.personalityTestCompleted = true;
      updateData.testTakenDate = new Date();
    }

    // Prepare $setOnInsert data (only for new documents)
    const setOnInsertData: any = {
      // Initialize subject mastery for Science
      subjectMastery: [
        {
          subject: 'Science',
          grade: '9',
          topics: [],
          overallMasteryScore: 0
        },
        {
          subject: 'Science',
          grade: '10',
          topics: [],
          overallMasteryScore: 0
        }
      ],
      assignmentHistory: [],
      
      // Legacy fields for compatibility
      previousPerformance: {
        subject: 'mathematics',
        weaknesses: [],
        masteryScores: {}
      },
      intellectualProfile: {
        strengths: [],
        responsePatterns: []
      },
      engagementMetrics: {
        completionRate: 0,
        badgeCount: 0,
        progressChains: [],
        streakDays: 0,
        totalTimeSpent: 0
      },
      createdAt: new Date()
    };

    // Only add personalityProfile to $setOnInsert if we're not updating it in $set
    if (!updateData.personalityProfile) {
      setOnInsertData.personalityProfile = {
        type: 'visual',
        quizResponses: []
      };
    }

    // Upsert the profile
    const result = await profilesCollection.updateOne(
      { studentId: studentId },
      { 
        $set: updateData,
        $setOnInsert: setOnInsertData
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Student profile updated successfully',
      data: {
        studentId,
        oceanTraits,
        learningPreferences,
        personalityTestCompleted: updateData.personalityTestCompleted,
        updated: result.modifiedCount > 0,
        created: result.upsertedCount > 0
      }
    });
  } catch (error) {
    console.error('Student profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update student profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const profile = await profilesCollection.findOne({ studentId: studentId });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Student profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Student profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}
