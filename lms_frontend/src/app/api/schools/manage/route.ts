import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, School, User, SchoolCode } from '@/lib/db';
import { ObjectId } from 'mongodb';

/**
 * GET /api/schools/manage
 * Get school management data for admin
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate userId format
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const schoolsCollection = await getCollection(COLLECTIONS.SCHOOLS);
    const schoolCodesCollection = await getCollection(COLLECTIONS.SCHOOL_CODES);

    // Get user and verify admin role
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get school data
    const school = await schoolsCollection.findOne({ _id: user.schoolId });
    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Get school codes
    const schoolCodes = await schoolCodesCollection.find({ 
      schoolId: school._id 
    }).toArray();

    // Get teachers and students
    const teachers = await usersCollection.find({ 
      schoolId: school._id, 
      role: 'teacher' 
    }).toArray();

    const students = await usersCollection.find({ 
      schoolId: school._id, 
      role: 'student' 
    }).toArray();

    return NextResponse.json({
      success: true,
      data: {
        school,
        teachers,
        students,
        schoolCodes,
        stats: {
          totalTeachers: teachers.length,
          totalStudents: students.length,
          activeCodes: schoolCodes.filter(code => code.isActive).length,
        }
      }
    });

  } catch (error) {
    console.error('School management error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch school management data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schools/manage
 * Update school settings or manage teachers/students
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, action, data } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const schoolsCollection = await getCollection(COLLECTIONS.SCHOOLS);
    const schoolCodesCollection = await getCollection(COLLECTIONS.SCHOOL_CODES);

    // Get user and verify admin role
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get school
    const school = await schoolsCollection.findOne({ _id: user.schoolId });
    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'updateSettings':
        await schoolsCollection.updateOne(
          { _id: school._id },
          { 
            $set: { 
              ...data,
              updatedAt: new Date() 
            } 
          }
        );
        return NextResponse.json({
          success: true,
          message: 'School settings updated successfully'
        });

      case 'addTeacherEmail':
        const { email } = data;
        if (!email) {
          return NextResponse.json(
            { success: false, error: 'Email is required' },
            { status: 400 }
          );
        }

        if (school.teacherEmails.includes(email)) {
          return NextResponse.json(
            { success: false, error: 'Email already in whitelist' },
            { status: 400 }
          );
        }

        await schoolsCollection.updateOne(
          { _id: school._id },
          { 
            $push: { teacherEmails: email },
            $set: { updatedAt: new Date() }
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Teacher email added to whitelist'
        });

      case 'removeTeacherEmail':
        const { emailToRemove } = data;
        if (!emailToRemove) {
          return NextResponse.json(
            { success: false, error: 'Email is required' },
            { status: 400 }
          );
        }

        await schoolsCollection.updateOne(
          { _id: school._id },
          { 
            $pull: { teacherEmails: emailToRemove },
            $set: { updatedAt: new Date() }
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Teacher email removed from whitelist'
        });

      case 'generateNewStudentCode':
        const newCode = await generateUniqueStudentCode();
        const newSchoolCode: Omit<SchoolCode, '_id'> = {
          schoolId: school._id!,
          code: newCode,
          isActive: true,
          generatedBy: user._id!,
          usedBy: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await schoolCodesCollection.insertOne(newSchoolCode);

        return NextResponse.json({
          success: true,
          message: 'New student join code generated',
          data: { code: newCode }
        });

      case 'deactivateStudentCode':
        const { codeId } = data;
        if (!codeId) {
          return NextResponse.json(
            { success: false, error: 'Code ID is required' },
            { status: 400 }
          );
        }

        await schoolCodesCollection.updateOne(
          { _id: new ObjectId(codeId) },
          { 
            $set: { 
              isActive: false,
              updatedAt: new Date() 
            } 
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Student join code deactivated'
        });

      case 'toggleStudentRegistration':
        const { allowRegistration } = data;
        await schoolsCollection.updateOne(
          { _id: school._id },
          { 
            $set: { 
              'settings.allowStudentRegistration': allowRegistration,
              updatedAt: new Date() 
            } 
          }
        );

        return NextResponse.json({
          success: true,
          message: `Student registration ${allowRegistration ? 'enabled' : 'disabled'}`
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('School management error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update school management data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
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
