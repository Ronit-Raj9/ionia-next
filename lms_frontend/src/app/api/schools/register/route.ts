import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, School, User, SchoolCode } from '@/lib/db';
import { ObjectId } from 'mongodb';

/**
 * POST /api/schools/register
 * Register a new school with admin details and teacher email whitelist
 */
export async function POST(request: NextRequest) {
  try {
    const {
      schoolName,
      schoolType,
      address,
      contact,
      admin,
      teacherEmails,
      settings
    } = await request.json();

    // Validate required fields
    if (!schoolName || !schoolType || !address || !contact || !admin || !teacherEmails) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate teacher emails array
    if (!Array.isArray(teacherEmails) || teacherEmails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one teacher email must be provided' },
        { status: 400 }
      );
    }

    // Validate email format for admin and teachers
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin email format' },
        { status: 400 }
      );
    }

    // Check for duplicate emails in teacher list
    const uniqueTeacherEmails = Array.from(new Set(teacherEmails));
    if (uniqueTeacherEmails.length !== teacherEmails.length) {
      return NextResponse.json(
        { success: false, error: 'Duplicate teacher emails found in the list' },
        { status: 400 }
      );
    }

    // Check if admin email is in teacher list
    if (teacherEmails.includes(admin.email)) {
      return NextResponse.json(
        { success: false, error: 'Admin email cannot be in teacher list' },
        { status: 400 }
      );
    }

    for (const email of teacherEmails) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: `Invalid teacher email format: ${email}` },
          { status: 400 }
        );
      }
    }

    const schoolsCollection = await getCollection(COLLECTIONS.SCHOOLS);
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const schoolCodesCollection = await getCollection(COLLECTIONS.SCHOOL_CODES);

    // Check if school name already exists
    const existingSchool = await schoolsCollection.findOne({ 
      schoolName: { $regex: new RegExp(`^${schoolName}$`, 'i') } // Case-insensitive match
    });
    if (existingSchool) {
      return NextResponse.json(
        { success: false, error: 'A school with this name already exists' },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingAdmin = await usersCollection.findOne({ email: admin.email });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin email already exists' },
        { status: 400 }
      );
    }

    // Check if any teacher email already exists
    const existingTeachers = await usersCollection.find({ 
      email: { $in: teacherEmails } 
    }).toArray();
    if (existingTeachers.length > 0) {
      return NextResponse.json(
        { success: false, error: `Teacher emails already exist: ${existingTeachers.map(t => t.email).join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique school ID
    const schoolId = await generateUniqueSchoolId();

    // Generate student join code
    const studentJoinCode = await generateUniqueStudentCode();

    // Create admin user
    const adminUser: Omit<User, '_id'> = {
      role: 'admin',
      userId: `ADM_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: admin.name,
      email: admin.email,
      displayName: admin.name,
      classId: 'default-class',
      phoneNumber: admin.phone,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const adminResult = await usersCollection.insertOne(adminUser);
    const adminUserId = adminResult.insertedId;

    // Create school document
    const newSchool: Omit<School, '_id'> = {
      schoolId,
      schoolName,
      schoolType,
      address,
      contact,
      admin: {
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        userId: adminUserId,
      },
      settings: {
        timezone: settings?.timezone || 'Asia/Kolkata',
        academicYear: settings?.academicYear || '2024-25',
        defaultLanguage: settings?.defaultLanguage || 'en',
        allowStudentRegistration: true,
        maxTeachers: settings?.maxTeachers || 50,
        maxStudents: settings?.maxStudents || 1000,
      },
      teacherEmails,
      studentJoinCode,
      verification: {
        status: 'pending',
      },
      subscription: {
        plan: 'free',
        maxTeachers: 10,
        maxStudents: 100,
        features: ['basic_analytics', 'class_management'],
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

    // Update admin user with school reference
    await usersCollection.updateOne(
      { _id: adminUserId },
      { $set: { schoolId: schoolObjectId, updatedAt: new Date() } }
    );

    // Create school code document
    const schoolCode: Omit<SchoolCode, '_id'> = {
      schoolId: schoolObjectId,
      code: studentJoinCode,
      isActive: true,
      generatedBy: adminUserId,
      usedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await schoolCodesCollection.insertOne(schoolCode);

    // Return school data
    const schoolData = {
      _id: schoolObjectId,
      ...newSchool,
      admin: {
        ...newSchool.admin,
        userId: adminUserId,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'School registered successfully',
      data: {
        school: schoolData,
        admin: {
          _id: adminUserId,
          ...adminUser,
          schoolId: schoolObjectId,
        },
        studentJoinCode,
        teacherEmails,
      },
    });

  } catch (error) {
    console.error('School registration error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Registration timeout - please try again',
            details: 'The operation took too long to complete'
          },
          { status: 408 }
        );
      }
      
      if (error.message.includes('duplicate')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Duplicate entry detected',
            details: error.message
          },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to register school',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate unique school ID
 */
async function generateUniqueSchoolId(): Promise<string> {
  const schoolsCollection = await getCollection(COLLECTIONS.SCHOOLS);
  let schoolId: string;
  let isUnique = false;
  
  while (!isUnique) {
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    schoolId = `SCHOOL-${randomPart}`;
    
    const existing = await schoolsCollection.findOne({ schoolId });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return schoolId!;
}

/**
 * Generate unique student join code
 */
async function generateUniqueStudentCode(): Promise<string> {
  const schoolCodesCollection = await getCollection(COLLECTIONS.SCHOOL_CODES);
  let code: string;
  let isUnique = false;
  
  while (!isUnique) {
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `STU-${randomPart}`;
    
    const existing = await schoolCodesCollection.findOne({ code });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code!;
}
