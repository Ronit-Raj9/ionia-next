import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, User, School, SchoolCode } from '@/lib/db';
import { ObjectId } from 'mongodb';

/**
 * Register a new user (Teacher, Student, or Admin)
 * This saves the user to the database with school validation
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, role, schoolId, classId, phoneNumber, joinCode } = await request.json();

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['teacher', 'student'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Only teacher and student registration is allowed here. Admin registration is done through school registration.' },
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
    const schoolsCollection = await getCollection(COLLECTIONS.SCHOOLS);
    const schoolCodesCollection = await getCollection(COLLECTIONS.SCHOOL_CODES);
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);

    // Check if user with this email already exists
    const existingUser = await usersCollection.findOne({ email: email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Additional validation for student registration
    if (role === 'student' && !joinCode) {
      return NextResponse.json(
        { success: false, error: 'Join code is required for student registration' },
        { status: 400 }
      );
    }

    // Additional validation for teacher registration
    if (role === 'teacher' && !schoolId) {
      return NextResponse.json(
        { success: false, error: 'School ID is required for teacher registration' },
        { status: 400 }
      );
    }

    let schoolObjectId: ObjectId | null = null;
    let schoolData: School | null = null;
    let schoolCode: any = null;

    // Validate school access based on role
    if (role === 'teacher') {
      // For teachers, validate email is in school whitelist
      if (!schoolId) {
        return NextResponse.json(
          { success: false, error: 'School ID is required for teacher registration' },
          { status: 400 }
        );
      }

      const schoolDoc = await schoolsCollection.findOne({ _id: new ObjectId(schoolId) });
      if (!schoolDoc) {
        return NextResponse.json(
          { success: false, error: 'School not found' },
          { status: 404 }
        );
      }
      schoolData = schoolDoc as School;

      if (!schoolData.teacherEmails.includes(email)) {
        return NextResponse.json(
          { success: false, error: 'Your email is not whitelisted for this school' },
          { status: 403 }
        );
      }

      schoolObjectId = schoolData._id!;

    } else if (role === 'student') {
      // For students, validate join code
      if (!joinCode) {
        return NextResponse.json(
          { success: false, error: 'Join code is required for student registration' },
          { status: 400 }
        );
      }

      // Use atomic operation to prevent race conditions during student registration
      schoolCode = await schoolCodesCollection.findOneAndUpdate(
        {
          code: joinCode.toUpperCase(),
          isActive: true,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
          ]
        },
        {
          $set: { 
            lastUsedAt: new Date(),
            usageCount: { $inc: 1 }
          }
        },
        { 
          returnDocument: 'after',
          maxTimeMS: 5000 // 5 second timeout
        }
      );

      if (!schoolCode) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired join code' },
          { status: 400 }
        );
      }

      const schoolDoc = await schoolsCollection.findOne({ _id: schoolCode.schoolId });
      if (!schoolDoc) {
        return NextResponse.json(
          { success: false, error: 'School not found' },
          { status: 404 }
        );
      }
      schoolData = schoolDoc as School;

      if (!schoolData.settings.allowStudentRegistration) {
        return NextResponse.json(
          { success: false, error: 'School is not accepting new student registrations' },
          { status: 403 }
        );
      }

      // Check usage limits
      if (schoolCode.maxUses && schoolCode.usedBy && schoolCode.usedBy.length >= schoolCode.maxUses) {
        return NextResponse.json(
          { success: false, error: 'Join code has reached maximum usage limit' },
          { status: 400 }
        );
      }

      schoolObjectId = schoolData._id!;
    }

    // Generate unique user ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    let userId: string;
    
    if (role === 'teacher') {
      userId = `TCH_${timestamp}_${randomSuffix}`;
    } else {
      userId = `STU_${timestamp}_${randomSuffix}`;
    }

    // Create user document
    const newUser: Omit<User, '_id'> = {
      role: role as 'teacher' | 'student',
      userId: userId,
      name: name,
      email: email,
      displayName: name,
      classId: classId || 'default-class',
      schoolId: schoolObjectId!,
      phoneNumber: phoneNumber,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);
    const newUserId = result.insertedId;

    // If student, also create a student profile and update school code usage
    if (role === 'student') {
      await studentProfilesCollection.insertOne({
        studentId: userId,
        studentName: name,
        name: name,
        email: email,
        schoolId: schoolObjectId!,
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

      // Update school code usage
      await schoolCodesCollection.updateOne(
        { _id: schoolCode._id },
        { 
          $push: { usedBy: newUserId as any },
          $set: { updatedAt: new Date() }
        }
      );

      // Update school stats
      await schoolsCollection.updateOne(
        { _id: schoolObjectId! },
        { 
          $inc: { 'stats.totalStudents': 1 },
          $set: { 'stats.lastActivity': new Date(), updatedAt: new Date() }
        }
      );
    } else if (role === 'teacher') {
      // Update school stats for teacher
      await schoolsCollection.updateOne(
        { _id: schoolObjectId! },
        { 
          $inc: { 'stats.totalTeachers': 1 },
          $set: { 'stats.lastActivity': new Date(), updatedAt: new Date() }
        }
      );
    }

    // Return user data for localStorage
    const userData = {
      _id: result.insertedId,
      ...newUser,
      school: schoolData ? {
        _id: schoolData._id,
        schoolName: schoolData.schoolName,
        schoolType: schoolData.schoolType,
      } : null
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
