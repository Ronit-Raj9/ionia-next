import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, School, SchoolCode } from '@/lib/db';

/**
 * POST /api/schools/validate-code
 * Validate student join code and return school information
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Join code is required' },
        { status: 400 }
      );
    }

    const schoolsCollection = await getCollection(COLLECTIONS.SCHOOLS);
    const schoolCodesCollection = await getCollection(COLLECTIONS.SCHOOL_CODES);

    // Find active school code with atomic operation to prevent race conditions
    const schoolCode = await schoolCodesCollection.findOneAndUpdate(
      {
        code: code.toUpperCase(),
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      },
      {
        $set: { 
          lastValidatedAt: new Date(),
          validationCount: { $inc: 1 }
        }
      },
      { 
        returnDocument: 'after',
        maxTimeMS: 5000 // 5 second timeout to prevent long locks
      }
    );

    if (!schoolCode) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired join code',
        data: null
      });
    }

    // Get school information
    const school = await schoolsCollection.findOne({
      _id: schoolCode.schoolId,
      'verification.status': { $in: ['pending', 'verified'] }
    });

    if (!school) {
      return NextResponse.json({
        success: false,
        error: 'School not found or not verified',
        data: null
      });
    }

    // Check if school allows student registration
    if (!school.settings.allowStudentRegistration) {
      return NextResponse.json({
        success: false,
        error: 'School is not accepting new student registrations',
        data: null
      });
    }

    // Check usage limits
    if (schoolCode.maxUses && schoolCode.usedBy && schoolCode.usedBy.length >= schoolCode.maxUses) {
      return NextResponse.json({
        success: false,
        error: 'Join code has reached maximum usage limit',
        data: null
      });
    }

    // Return school information for student registration
    return NextResponse.json({
      success: true,
      message: 'Valid join code',
      data: {
        schoolId: school._id,
        schoolName: school.schoolName,
        schoolType: school.schoolType,
        address: school.address,
        contact: school.contact,
        settings: school.settings,
        codeInfo: {
          code: schoolCode.code,
          maxUses: schoolCode.maxUses,
          usedCount: schoolCode.usedBy?.length || 0,
          expiresAt: schoolCode.expiresAt,
        }
      }
    });

  } catch (error) {
    console.error('Code validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate join code',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
