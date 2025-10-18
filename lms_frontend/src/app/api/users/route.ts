import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, User, StudentProfile } from '@/lib/db';
import { ObjectId } from 'mongodb';

/**
 * GET - Fetch all users or filter by role
 * Used by admin dashboard and teacher class management
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // Filter by role
    const schoolId = searchParams.get('schoolId'); // Filter by school
    const requestingRole = searchParams.get('requestingRole'); // Who is making the request

    // Only teachers and admins can access user lists
    if (requestingRole !== 'teacher' && requestingRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);

    // Build query
    const query: any = {};
    if (role) {
      query.role = role;
    }
    if (schoolId) {
      query.schoolId = schoolId;
    }

    // Fetch users
    const users = await usersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // If fetching students, join with student profiles
    if (role === 'student' || !role) {
      const profiles = await studentProfilesCollection.find({}).toArray();
      const profileMap = new Map();
      profiles.forEach((profile: any) => {
        profileMap.set(profile.studentId, profile);
      });

      const enrichedUsers = users.map((user: any) => {
        if (user.role === 'student') {
          const profile = profileMap.get(user.userId);
          return {
            ...user,
            studentProfile: profile ? {
              personalityTestCompleted: profile.personalityTestCompleted,
              oceanTraits: profile.oceanTraits,
              learningPreferences: profile.learningPreferences,
              intellectualTraits: profile.intellectualTraits,
              subjectMastery: profile.subjectMastery
            } : null
          };
        }
        return user;
      });

      return NextResponse.json({
        success: true,
        count: enrichedUsers.length,
        data: enrichedUsers
      });
    }

    return NextResponse.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      role, 
      name, 
      email, 
      classId, 
      schoolId, 
      requestingRole,
      ...additionalData 
    } = await request.json();

    // Only admins can create users
    if (requestingRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can create users' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!userId || !role || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'userId, role, name, and email are required' },
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

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ 
      $or: [{ userId: userId }, { email: email }] 
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this userId or email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = {
      userId,
      role,
      name,
      email,
      classId: classId || '',
      schoolId: schoolId ? new ObjectId(schoolId) : undefined,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...additionalData
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: result.insertedId,
        ...newUser
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update user information
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, updates, requestingRole } = await request.json();

    // Only admins can update user information
    if (requestingRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can update user information' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Validate updates object
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Valid updates object is required' },
        { status: 400 }
      );
    }

    // Filter out sensitive fields that shouldn't be updated via this endpoint
    const allowedFields = ['name', 'displayName', 'phoneNumber', 'profileImage', 'dashboardPreferences', 'status'];
    const filteredUpdates: any = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update user
    const result = await usersCollection.updateOne(
      { userId: userId },
      { 
        $set: {
          ...filteredUpdates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch updated user
    const updatedUser = await usersCollection.findOne({ userId: userId });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const requestingRole = searchParams.get('requestingRole');

    // Only admins can delete users
    if (requestingRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete users' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);

    // Get user to check role and get details
    const user = await usersCollection.findOne({ userId: userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of admin users (safety check)
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin users' },
        { status: 403 }
      );
    }

    // Delete user
    const result = await usersCollection.deleteOne({ userId: userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // If student, also delete profile and related data
    if (user.role === 'student') {
      await studentProfilesCollection.deleteOne({ studentId: user.userId });
      
      // Note: In a production system, you might want to soft delete or archive
      // related data like submissions, progress, etc. instead of hard deletion
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        userId: user.userId,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
