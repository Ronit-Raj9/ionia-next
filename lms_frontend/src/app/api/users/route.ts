import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, User, StudentProfile } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * GET - Fetch all users or filter by role
 * Used by admin dashboard and teacher class management
 * SECURE: Requires valid session authentication
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Validate session from HTTP-only cookie
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // Filter by role
    const schoolId = searchParams.get('schoolId'); // Filter by school
    const userId = searchParams.get('userId'); // Get specific user by userId

    // Allow students to get specific user info (for chat features)
    // Only superadmin, admin, and teachers can access full user lists
    const allowSingleUserQuery = userId && ['student', 'teacher', 'admin', 'superadmin'].includes(session.role);
    const allowListQuery = ['superadmin', 'admin', 'teacher'].includes(session.role);
    
    if (!allowSingleUserQuery && !allowListQuery) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);

    // If userId is provided, return that specific user
    if (userId) {
      const usersCollection = await getCollection(COLLECTIONS.USERS);
      const user = await usersCollection.findOne({ userId });
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Check permissions (must be from same school unless superadmin)
      if (session.role !== 'superadmin' && session.schoolId) {
        if (user.schoolId?.toString() !== session.schoolId) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }
      
      return NextResponse.json({
        success: true,
        user: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
    
    // Build query with school scoping for non-superadmins
    const query: any = {};
    
    // Superadmin can see all users
    // Admin and Teacher can only see users from their school
    if (session.role !== 'superadmin' && session.schoolId) {
      query.schoolId = new ObjectId(session.schoolId);
    }
    
    if (role) {
      query.role = role;
    }
    if (schoolId && session.role === 'superadmin') {
      // Only superadmin can filter by any school
      query.schoolId = new ObjectId(schoolId);
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
 * SECURE: Requires valid session authentication
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate session from HTTP-only cookie
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only superadmin and admin can create users
    if (!['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Only admins can create users' },
        { status: 403 }
      );
    }

    const { 
      userId, 
      role, 
      name, 
      email, 
      classId, 
      schoolId, 
      ...additionalData 
    } = await request.json();

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
 * SECURE: Requires valid session authentication
 */
export async function PUT(request: NextRequest) {
  try {
    // SECURITY: Validate session from HTTP-only cookie
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only superadmin and admin can update user information
    if (!['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Only admins can update user information' },
        { status: 403 }
      );
    }

    const { userId, updates } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Check if user exists and get current data
    const existingUser = await usersCollection.findOne({ userId });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Admin can only edit users from their own school
    if (session.role === 'admin') {
      if (!session.schoolId) {
        return NextResponse.json(
          { success: false, error: 'Admin must be assigned to a school' },
          { status: 403 }
        );
      }
      
      if (!existingUser.schoolId || existingUser.schoolId.toString() !== session.schoolId) {
        return NextResponse.json(
          { success: false, error: 'You can only edit users from your own school' },
          { status: 403 }
        );
      }

      // Admin cannot edit other admins
      if (existingUser.role === 'admin' && existingUser.userId !== session.userId) {
        return NextResponse.json(
          { success: false, error: 'You cannot edit other admin accounts' },
          { status: 403 }
        );
      }
    }

    // Validate updates object
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Valid updates object is required' },
        { status: 400 }
      );
    }

    // Define allowed fields based on role
    // Superadmin can edit more fields including email and role
    const adminAllowedFields = ['name', 'displayName', 'phoneNumber', 'profileImage', 'dashboardPreferences', 'status'];
    const superadminAllowedFields = ['name', 'displayName', 'phoneNumber', 'profileImage', 'dashboardPreferences', 'status', 'email', 'role'];
    
    const allowedFields = session.role === 'superadmin' ? superadminAllowedFields : adminAllowedFields;
    const filteredUpdates: any = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Additional validation for email
    if (filteredUpdates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(filteredUpdates.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
      
      // Check if email already exists for another user
      const emailExists = await usersCollection.findOne({ 
        email: filteredUpdates.email,
        userId: { $ne: userId }
      });
      
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already exists for another user' },
          { status: 409 }
        );
      }
    }

    // Additional validation for role (superadmin only)
    if (filteredUpdates.role && session.role === 'superadmin') {
      const validRoles = ['superadmin', 'admin', 'teacher', 'student'];
      if (!validRoles.includes(filteredUpdates.role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role specified' },
          { status: 400 }
        );
      }
      
      // Prevent changing superadmin role (safety check)
      if (existingUser.role === 'superadmin' && filteredUpdates.role !== 'superadmin') {
        return NextResponse.json(
          { success: false, error: 'Cannot change superadmin role' },
          { status: 403 }
        );
      }
    }

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

    // Fetch updated user (exclude password)
    const updatedUser = await usersCollection.findOne(
      { userId: userId },
      { projection: { password: 0 } }
    );

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
 * SECURE: Requires valid session authentication
 */
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Validate session from HTTP-only cookie
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only superadmin and admin can delete users
    if (!['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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

    // Prevent deletion of admin users by non-superadmins (safety check)
    // Only superadmin can delete admins
    if (user.role === 'admin' && session.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Only superadmin can delete admin users' },
        { status: 403 }
      );
    }

    // Admin can only delete users from their own school
    if (session.role === 'admin') {
      if (!session.schoolId) {
        return NextResponse.json(
          { success: false, error: 'Admin must be assigned to a school' },
          { status: 403 }
        );
      }
      
      if (!user.schoolId || user.schoolId.toString() !== session.schoolId) {
        return NextResponse.json(
          { success: false, error: 'You can only delete users from your own school' },
          { status: 403 }
        );
      }

      // Admin cannot delete other admins
      if (user.role === 'admin') {
        return NextResponse.json(
          { success: false, error: 'You cannot delete admin accounts' },
          { status: 403 }
        );
      }
    }

    // Prevent deletion of superadmin accounts (safety check)
    if (user.role === 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete superadmin accounts' },
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
