import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, School } from '@/lib/db';

/**
 * POST /api/schools/validate-teacher
 * Validate if teacher email is whitelisted for any school
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
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

    const schoolsCollection = await getCollection(COLLECTIONS.SCHOOLS);
    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Check if teacher is already registered
    const existingTeacher = await usersCollection.findOne({ 
      email: email,
      role: 'teacher'
    });
    
    if (existingTeacher) {
      return NextResponse.json({
        success: false,
        error: 'This email is already registered as a teacher',
        data: null
      });
    }

    // Find school that has this email in teacher whitelist
    const school = await schoolsCollection.findOne({
      teacherEmails: email,
      'verification.status': { $in: ['pending', 'verified'] }
    });

    if (!school) {
      return NextResponse.json({
        success: false,
        error: 'Email not found in any school teacher whitelist',
        data: null
      });
    }

    // Return school information for teacher registration
    return NextResponse.json({
      success: true,
      message: 'Email is whitelisted for school',
      data: {
        schoolId: school._id,
        schoolName: school.schoolName,
        schoolType: school.schoolType,
        address: school.address,
        contact: school.contact,
        settings: school.settings,
      }
    });

  } catch (error) {
    console.error('Teacher validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate teacher email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
