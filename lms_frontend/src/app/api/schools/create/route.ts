import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, COLLECTIONS, School, User } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { 
  generateSchoolId, 
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
      schoolName,
      schoolType,
      address,
      contact,
      adminName,
      adminEmail,
      adminPhone,
      settings,
      subscription,
    } = body;

    // Validate creator role
    if (creatorRole !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Only superadmins can create schools'
      }, { status: 403 });
    }

    // Validate permissions
    const permissionCheck = validatePermission(
      creatorRole as 'superadmin',
      'createSchool'
    );
    if (!permissionCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: permissionCheck.reason || 'Only superadmins can create schools'
      }, { status: 403 });
    }

    // Validate required fields
    if (!schoolName || !schoolType || !address || !contact || !adminName || !adminEmail) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const schoolsCollection = db.collection<School>(COLLECTIONS.SCHOOLS);
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    // Check if admin email already exists
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });
    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        error: 'An admin with this email already exists'
      }, { status: 409 });
    }

    // Generate school ID
    const schoolId = generateSchoolId(address.city);

    // Generate admin credentials
    const adminUserId = generateUserId('admin');
    const adminPassword = generatePassword();
    const hashedPassword = hashPassword(adminPassword);

    // Create admin user first
    const adminUser: User = {
      role: 'admin',
      userId: adminUserId,
      password: hashedPassword,
      name: adminName,
      email: adminEmail,
      displayName: adminName,
      phoneNumber: adminPhone,
      schoolId: undefined, // Will be set after school creation
      permissions: getDefaultPermissions('admin'),
      status: 'active',
      createdBy: creatorUserId, // Store custom userId as string
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const adminResult = await usersCollection.insertOne(adminUser);
    const adminObjectId = adminResult.insertedId;

    // Create school
    const newSchool: School = {
      schoolId,
      schoolName,
      schoolType,
      address: {
        street: address.street || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || 'India',
      },
      contact: {
        email: contact.email,
        phone: contact.phone,
        website: contact.website,
      },
      admin: {
        name: adminName,
        email: adminEmail,
        phone: adminPhone || contact.phone,
        userId: adminObjectId,
      },
      settings: {
        timezone: settings?.timezone || 'Asia/Kolkata',
        academicYear: settings?.academicYear || new Date().getFullYear().toString(),
        defaultLanguage: settings?.defaultLanguage || 'English',
        allowStudentRegistration: settings?.allowStudentRegistration ?? true,
        maxTeachers: settings?.maxTeachers || 50,
        maxStudents: settings?.maxStudents || 1000,
      },
      teacherEmails: [],
      studentJoinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      verification: {
        status: 'verified', // Auto-verified for superadmin-created schools
        verifiedAt: new Date(),
        verifiedBy: creatorUserId,
      },
      subscription: {
        plan: subscription?.plan || 'basic',
        maxTeachers: subscription?.maxTeachers || 50,
        maxStudents: subscription?.maxStudents || 1000,
        features: subscription?.features || ['basic_features', 'ai_grading', 'analytics'],
      },
      stats: {
        totalTeachers: 0,
        totalStudents: 0,
        totalClasses: 0,
        lastActivity: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const schoolResult = await schoolsCollection.insertOne(newSchool);
    const schoolObjectId = schoolResult.insertedId;

    // Update admin user with schoolId
    await usersCollection.updateOne(
      { _id: adminObjectId },
      { 
        $set: { 
          schoolId: schoolObjectId,
          'permissions.scopedToSchool': schoolObjectId,
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'School created successfully with admin account',
      data: {
        school: {
          _id: schoolObjectId.toString(),
          schoolId,
          schoolName,
          adminEmail,
          studentJoinCode: newSchool.studentJoinCode,
        },
        adminCredentials: {
          userId: adminUserId,
          password: adminPassword, // Return plain password ONLY on creation
          email: adminEmail,
          name: adminName,
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create school'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve schools
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestorRole = searchParams.get('role');
    const requestorSchoolId = searchParams.get('schoolId');

    if (!requestorRole) {
      return NextResponse.json({
        success: false,
        error: 'Requestor role is required'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const schoolsCollection = db.collection<School>(COLLECTIONS.SCHOOLS);

    let query: any = {};

    if (requestorRole === 'superadmin') {
      // Superadmin can see all schools
      query = {};
    } else if (requestorRole === 'admin' && requestorSchoolId) {
      // Admin can only see their own school
      query._id = new ObjectId(requestorSchoolId);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to view schools'
      }, { status: 403 });
    }

    const schools = await schoolsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: schools,
      count: schools.length
    });

  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch schools'
    }, { status: 500 });
  }
}

