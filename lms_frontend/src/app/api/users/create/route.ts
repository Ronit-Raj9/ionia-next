import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, COLLECTIONS, User } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { 
  generateUserId, 
  generatePassword, 
  hashPassword, 
  getDefaultPermissions,
  validatePermission 
} from '@/lib/authUtils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      creatorUserId,
      creatorRole,
      creatorSchoolId,
      targetRole,
      targetSchoolId,
      name,
      email,
      phoneNumber,
      displayName,
    } = body;

    // Validate required fields
    if (!name || !email || !targetRole || !creatorRole) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, email, role, and creatorRole are required'
      }, { status: 400 });
    }

    // Validate roles
    const validRoles = ['superadmin', 'admin', 'teacher', 'student'];
    if (!validRoles.includes(creatorRole) || !validRoles.includes(targetRole)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role specified'
      }, { status: 400 });
    }

    // Validate creator permissions
    // Only superadmin can create superadmins
    if (targetRole === 'superadmin' && creatorRole !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Only superadmins can create superadmin accounts'
      }, { status: 403 });
    }

    const permissionCheck = validatePermission(
      creatorRole as 'superadmin' | 'admin' | 'teacher' | 'student',
      targetRole === 'superadmin' ? 'createSchool' : // Superadmins can create superadmins (handled by superadmin check)
      targetRole === 'admin' ? 'createAdmin' :
      targetRole === 'teacher' ? 'createTeacher' :
      targetRole === 'student' ? 'createStudent' :
      'createSchool',
      targetSchoolId,
      creatorSchoolId
    );

    if (!permissionCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: permissionCheck.reason || 'Permission denied'
      }, { status: 403 });
    }

    // Validate target role is allowed
    if (!validRoles.includes(targetRole)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be superadmin, admin, teacher, or student'
      }, { status: 400 });
    }

    // For non-superadmin roles, schoolId is required
    if (targetRole !== 'superadmin' && !targetSchoolId) {
      return NextResponse.json({
        success: false,
        error: `School ID is required for ${targetRole} role`
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'A user with this email already exists'
      }, { status: 409 });
    }

    // Generate unique user ID and password
    const userId = generateUserId(targetRole);
    const plainPassword = generatePassword();
    const hashedPassword = hashPassword(plainPassword);

    // Get default permissions for role
    const permissions = getDefaultPermissions(
      targetRole,
      targetSchoolId ? new ObjectId(targetSchoolId) : undefined
    );

    // Create user object
    const newUser: User = {
      role: targetRole,
      userId,
      password: hashedPassword,
      name,
      email,
      displayName: displayName || name,
      phoneNumber,
      schoolId: targetSchoolId ? new ObjectId(targetSchoolId) : undefined,
      classId: targetRole === 'student' ? 'pending-class-assignment' : undefined,
      permissions,
      status: 'active',
      createdBy: creatorUserId, // Store custom userId as string
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);

    // Update school stats if applicable
    if (targetSchoolId) {
      const schoolsCollection = db.collection(COLLECTIONS.SCHOOLS);
      const updateField = 
        targetRole === 'teacher' ? 'stats.totalTeachers' :
        targetRole === 'student' ? 'stats.totalStudents' :
        null;

      if (updateField) {
        await schoolsCollection.updateOne(
          { _id: new ObjectId(targetSchoolId) },
          { 
            $inc: { [updateField]: 1 },
            $set: { 'stats.lastActivity': new Date() }
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} account created successfully`,
      data: {
        userId: result.insertedId.toString(),
        credentials: {
          userId,
          password: plainPassword, // Return plain password ONLY on creation
          email,
        },
        user: {
          _id: result.insertedId.toString(),
          role: targetRole,
          userId,
          name,
          email,
          displayName: displayName || name,
          schoolId: targetSchoolId,
          status: 'active',
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create user account'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve users (with proper filtering based on role)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestorRole = searchParams.get('role');
    const requestorSchoolId = searchParams.get('schoolId');
    const targetRole = searchParams.get('targetRole'); // Filter by specific role

    if (!requestorRole) {
      return NextResponse.json({
        success: false,
        error: 'Requestor role is required'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    // Build query based on requestor's permissions
    let query: any = {};

    if (requestorRole === 'superadmin') {
      // Superadmin can see all users
      if (targetRole) {
        query.role = targetRole;
      }
    } else if (requestorRole === 'admin' && requestorSchoolId) {
      // Admin can only see users in their school
      query.schoolId = new ObjectId(requestorSchoolId);
      if (targetRole) {
        query.role = targetRole;
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to view users'
      }, { status: 403 });
    }

    const users = await usersCollection
      .find(query)
      .project({ password: 0 }) // Never return passwords
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 });
  }
}

