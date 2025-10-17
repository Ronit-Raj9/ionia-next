import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, StudentLearningProfile } from '@/lib/db';

/**
 * POST /api/learning-profile
 * Create a new student learning profile after onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      studentId,
      classId,
      grade,
      subjects,
      onboardingMetrics,
      dynamicMetrics,
      zpdMetrics,
      engagementMetrics,
      behavioralPatterns,
      subjectPerformance,
      questionHistory,
      aiRecommendations,
      status,
      onboardingCompleted
    } = body;

    // Validate required fields
    if (!studentId || !classId || !grade) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: studentId, classId, or grade' },
        { status: 400 }
      );
    }

    if (!onboardingMetrics) {
      return NextResponse.json(
        { success: false, message: 'Onboarding metrics are required' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const collection = await getCollection(COLLECTIONS.STUDENT_LEARNING_PROFILES);
    const existingProfile = await collection.findOne({ studentId, classId });

    if (existingProfile) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Learning profile already exists for this student',
          profileId: existingProfile._id 
        },
        { status: 409 }
      );
    }

    // Create new learning profile
    const learningProfile: StudentLearningProfile = {
      studentId,
      classId,
      grade,
      subjects: subjects || [],
      onboardingMetrics: {
        ...onboardingMetrics,
        assessed_at: new Date(onboardingMetrics.assessed_at || new Date())
      },
      dynamicMetrics: dynamicMetrics || {
        actual_learning_pace: 5,
        concept_mastery_rate: 0,
        error_recovery_rate: 50,
        question_attempt_ratio: 1.0,
        time_per_difficulty_level: { easy: 60, medium: 120, hard: 180 },
        skip_patterns: [],
        strength_topics: [],
        weakness_topics: []
      },
      zpdMetrics: zpdMetrics || {
        current_difficulty_level: 'in_zpd',
        optimal_challenge_level: 'medium',
        scaffolding_needed: false,
        last_zpd_adjustment: new Date()
      },
      engagementMetrics: engagementMetrics || {
        session_frequency: 0,
        avg_session_duration: 0,
        consecutive_days: 0,
        progress_velocity: 0,
        last_activity: new Date()
      },
      behavioralPatterns: behavioralPatterns || {
        preferred_question_types: [],
        hint_usage_frequency: 0,
        confidence_accuracy_correlation: 0,
        growth_trajectory: 'steady'
      },
      subjectPerformance: subjectPerformance || [],
      questionHistory: questionHistory || [],
      aiRecommendations: aiRecommendations || {
        nextQuestions: [],
        remedialTopics: [],
        enrichmentActivities: [],
        lastGenerated: new Date()
      },
      status: status || 'active',
      onboardingCompleted: onboardingCompleted || true,
      lastAssessment: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(learningProfile as any);

    return NextResponse.json({
      success: true,
      message: 'Learning profile created successfully',
      profileId: result.insertedId,
      profile: learningProfile
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating learning profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create learning profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning-profile?studentId=...&classId=...
 * Retrieve a student's learning profile
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const profileId = searchParams.get('profileId');

    if (!studentId && !profileId) {
      return NextResponse.json(
        { success: false, message: 'studentId or profileId is required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTIONS.STUDENT_LEARNING_PROFILES);
    
    let profile;
    if (profileId) {
      profile = await collection.findOne({ _id: new ObjectId(profileId) });
    } else if (classId) {
      profile = await collection.findOne({ studentId, classId });
    } else {
      profile = await collection.findOne({ studentId });
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Learning profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Error fetching learning profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch learning profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/learning-profile
 * Update a student's learning profile (dynamic metrics, ZPD, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, classId, updates } = body;

    if (!studentId || !classId) {
      return NextResponse.json(
        { success: false, message: 'studentId and classId are required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No updates provided' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTIONS.STUDENT_LEARNING_PROFILES);
    
    // Update the profile
    const result = await collection.updateOne(
      { studentId, classId },
      { 
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Learning profile not found' },
        { status: 404 }
      );
    }

    // Fetch updated profile
    const updatedProfile = await collection.findOne({ studentId, classId });

    return NextResponse.json({
      success: true,
      message: 'Learning profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Error updating learning profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update learning profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning-profile/question-attempt
 * Record a question attempt and update metrics
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      classId,
      questionAttempt
    } = body;

    if (!studentId || !classId || !questionAttempt) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const collection = await getCollection(COLLECTIONS.STUDENT_LEARNING_PROFILES);
    const profile = await collection.findOne({ studentId, classId }) as StudentLearningProfile | null;

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'Learning profile not found' },
        { status: 404 }
      );
    }

    // Add question attempt to history
    const updatedHistory = [
      ...profile.questionHistory,
      {
        ...questionAttempt,
        attemptedAt: new Date()
      }
    ];

    // Calculate updated metrics (simplified version)
    const recentAttempts = updatedHistory.slice(-20); // Last 20 attempts
    const correctCount = recentAttempts.filter(a => a.isCorrect).length;
    const accuracyRate = (correctCount / recentAttempts.length) * 100;

    const updates: any = {
      questionHistory: updatedHistory,
      'dynamicMetrics.concept_mastery_rate': accuracyRate,
      'engagementMetrics.last_activity': new Date(),
      updatedAt: new Date()
    };

    // Update ZPD if needed
    if (accuracyRate > 85) {
      updates['zpdMetrics.current_difficulty_level'] = 'below_zpd';
      updates['zpdMetrics.optimal_challenge_level'] = 'hard';
    } else if (accuracyRate < 50) {
      updates['zpdMetrics.current_difficulty_level'] = 'above_zpd';
      updates['zpdMetrics.optimal_challenge_level'] = 'easy';
    } else {
      updates['zpdMetrics.current_difficulty_level'] = 'in_zpd';
      updates['zpdMetrics.optimal_challenge_level'] = 'medium';
    }

    await collection.updateOne(
      { studentId, classId },
      { $set: updates }
    );

    const updatedProfile = await collection.findOne({ studentId, classId });

    return NextResponse.json({
      success: true,
      message: 'Question attempt recorded and metrics updated',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Error recording question attempt:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to record question attempt',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

