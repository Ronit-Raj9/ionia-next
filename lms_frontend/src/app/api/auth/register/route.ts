import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, User } from '@/lib/db';

/**
 * Register a new user (Teacher, Student, or Admin)
 * This saves the user to the database
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, role, schoolId, classId, phoneNumber } = await request.json();

    // Validate required fields
    if (!name || !email || !role || !schoolId) {
      return NextResponse.json(
        { success: false, error: 'Name, email, role, and schoolId are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['teacher', 'student', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be teacher, student, or admin' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);

    // Check if user with this email already exists
    const existingUser = await usersCollection.findOne({ email: email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Generate unique user ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    let userId: string;
    
    if (role === 'teacher') {
      userId = `TCH_${timestamp}_${randomSuffix}`;
    } else if (role === 'admin') {
      userId = `ADM_${timestamp}_${randomSuffix}`;
    } else {
      userId = `STU_${timestamp}_${randomSuffix}`;
    }

    // Create user document
    const newUser: Omit<User, '_id'> = {
      role: role as 'teacher' | 'student' | 'admin',
      userId: userId,
      name: name,
      email: email,
      displayName: name,
      classId: classId || 'unassigned', // Must join/create class later
      schoolId: schoolId,
      phoneNumber: phoneNumber,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);

    // If student, also create a student profile
    if (role === 'student') {
      await studentProfilesCollection.insertOne({
        studentId: userId,
        studentName: name,
        name: name,
        email: email,
        schoolId: schoolId,
        oceanTraits: {
          openness: 50,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50
        },
        learningPreferences: {
          visualLearner: false,
          kinestheticLearner: false,
          auditoryLearner: false,
          readingWritingLearner: false,
          preferredDifficulty: 'medium',
          needsStepByStepGuidance: true,
          respondsToEncouragement: true
        },
        intellectualTraits: {
          analyticalThinking: 50,
          creativeThinking: 50,
          criticalThinking: 50,
          problemSolvingSkill: 50
        },
        subjectMastery: [],
        assignmentHistory: [],
        personalityTestCompleted: false,
        previousPerformance: {
          subject: '',
          weaknesses: [],
          masteryScores: {}
        },
        personalityProfile: {
          type: '',
          quizResponses: []
        },
        intellectualProfile: {
          strengths: [],
          responsePatterns: []
        },
        updatedAt: new Date()
      });
    }

    // Return user data for localStorage
    const userData = {
      _id: result.insertedId,
      ...newUser
    };

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: userData
    });

  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to register user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Check if user exists by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ email: email });

    if (user) {
      return NextResponse.json({
        success: true,
        exists: true,
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          userId: user.userId,
          schoolId: user.schoolId,
          classId: user.classId
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        exists: false
      });
    }

  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check user' },
      { status: 500 }
    );
  }
}
