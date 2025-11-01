import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, School, User, SchoolCode, connectToDatabase } from '@/lib/db';
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

    // Get user and verify admin role (userId is the custom ID, not MongoDB _id)
    const user = await usersCollection.findOne({ userId: userId });
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Validate schoolId exists and convert to ObjectId
    if (!user.schoolId) {
      return NextResponse.json(
        { success: false, error: 'User is not associated with a school' },
        { status: 400 }
      );
    }

    // Get school data
    const school = await schoolsCollection.findOne({ _id: new ObjectId(user.schoolId) });
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
 * PUT /api/schools/manage
 * Edit school details (Superadmin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { schoolId, updates } = await request.json();

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'School ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const schoolsCollection = db.collection<School>(COLLECTIONS.SCHOOLS);

    // Validate school exists
    const school = await schoolsCollection.findOne({ _id: new ObjectId(schoolId) });
    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Prepare update data (only allow specific fields)
    const allowedFields = [
      'schoolName',
      'schoolType',
      'address',
      'contact',
      'settings',
      'subscription'
    ];
    
    const updateData: any = { updatedAt: new Date() };
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'address' || field === 'contact' || field === 'settings' || field === 'subscription') {
          // Merge nested objects - ensure we're working with objects
          const existingValue = school[field as keyof School];
          const newValue = updates[field];
          if (existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)) {
            updateData[field] = { ...existingValue as object, ...newValue };
          } else {
            updateData[field] = newValue;
          }
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    await schoolsCollection.updateOne(
      { _id: new ObjectId(schoolId) },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: 'School details updated successfully'
    });

  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update school',
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
    const { userId, action, data, schoolId: actionSchoolId } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const schoolsCollection = await getCollection(COLLECTIONS.SCHOOLS);
    const schoolCodesCollection = await getCollection(COLLECTIONS.SCHOOL_CODES);
    const classesCollection = await getCollection(COLLECTIONS.CLASSES);

    // Get user and verify role (admin for their school, superadmin for any school)
    const user = await usersCollection.findOne({ userId: userId });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // For superadmin actions, use schoolId from request
    // For admin actions, use their own schoolId
    const targetSchoolId = actionSchoolId || (user.role === 'superadmin' ? actionSchoolId : user.schoolId);
    
    if (!targetSchoolId) {
      return NextResponse.json(
        { success: false, error: 'School ID is required' },
        { status: 400 }
      );
    }

    // Get school
    const school = await schoolsCollection.findOne({ _id: new ObjectId(targetSchoolId) });
    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Verify permissions
    if (user.role === 'admin' && user.schoolId?.toString() !== targetSchoolId.toString()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You can only manage your own school' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'freezeSchool':
        // Only superadmin can freeze schools
        if (user.role !== 'superadmin') {
          return NextResponse.json(
            { success: false, error: 'Only superadmins can freeze schools' },
            { status: 403 }
          );
        }

        // Update school status to frozen
        await schoolsCollection.updateOne(
          { _id: school._id },
          { 
            $set: { 
              status: 'frozen',
              frozenAt: new Date(),
              frozenBy: userId,
              updatedAt: new Date()
            } 
          }
        );

        // Suspend all users associated with the school
        const schoolUsersResult = await usersCollection.updateMany(
          { schoolId: school._id, role: { $in: ['admin', 'teacher', 'student'] } },
          { 
            $set: { 
              status: 'suspended',
              updatedAt: new Date()
            } 
          }
        );

        // Disable all classes
        await classesCollection.updateMany(
          { schoolId: school._id },
          {
            $set: {
              isActive: false,
              updatedAt: new Date()
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: `School frozen successfully. ${schoolUsersResult.modifiedCount} users suspended.`,
          data: {
            usersAffected: schoolUsersResult.modifiedCount
          }
        });

      case 'unfreezeSchool':
        // Only superadmin can unfreeze schools
        if (user.role !== 'superadmin') {
          return NextResponse.json(
            { success: false, error: 'Only superadmins can unfreeze schools' },
            { status: 403 }
          );
        }

        // Update school status to active
        await schoolsCollection.updateOne(
          { _id: school._id },
          { 
            $set: { 
              status: 'active',
              updatedAt: new Date()
            },
            $unset: {
              frozenAt: '',
              frozenBy: ''
            }
          }
        );

        // Reactivate all users associated with the school
        const reactivatedUsersResult = await usersCollection.updateMany(
          { schoolId: school._id, role: { $in: ['admin', 'teacher', 'student'] } },
          { 
            $set: { 
              status: 'active',
              updatedAt: new Date()
            } 
          }
        );

        // Reactivate all classes
        await classesCollection.updateMany(
          { schoolId: school._id },
          {
            $set: {
              isActive: true,
              updatedAt: new Date()
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: `School unfrozen successfully. ${reactivatedUsersResult.modifiedCount} users reactivated.`,
          data: {
            usersAffected: reactivatedUsersResult.modifiedCount
          }
        });

      case 'deleteSchool':
        // Only superadmin can delete schools
        if (user.role !== 'superadmin') {
          return NextResponse.json(
            { success: false, error: 'Only superadmins can delete schools' },
            { status: 403 }
          );
        }

        // Soft delete: Mark school as deleted
        await schoolsCollection.updateOne(
          { _id: school._id },
          { 
            $set: { 
              status: 'deleted',
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: userId,
              updatedAt: new Date()
            } 
          }
        );

        // Set all users to inactive
        const deletedUsersResult = await usersCollection.updateMany(
          { schoolId: school._id, role: { $in: ['admin', 'teacher', 'student'] } },
          { 
            $set: { 
              status: 'inactive',
              updatedAt: new Date()
            } 
          }
        );

        // Disable all classes
        await classesCollection.updateMany(
          { schoolId: school._id },
          {
            $set: {
              isActive: false,
              updatedAt: new Date()
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: `School deleted successfully. ${deletedUsersResult.modifiedCount} users deactivated.`,
          data: {
            usersAffected: deletedUsersResult.modifiedCount
          }
        });

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
