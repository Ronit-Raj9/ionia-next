import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Retrieve list of students filtered by schoolId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const schoolId = searchParams.get('schoolId');

    // Only teachers and admins can access student list
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Require schoolId for filtering
    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'schoolId is required to filter students' },
        { status: 400 }
      );
    }

    try {
      const usersCollection = await getCollection(COLLECTIONS.USERS);
      const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
      
      // Get student users filtered by EXACT schoolId match (case-sensitive)
      const students = await usersCollection
        .find({ 
          role: 'student',
          schoolId: schoolId  // Exact match, case-sensitive
        })
        .sort({ userId: 1 })
        .toArray();

      // Get student profiles to fetch names
      const profiles = await studentProfilesCollection
        .find({})
        .toArray();
      
      // Create a map of userId to profile
      const profileMap = new Map();
      profiles.forEach((profile: any) => {
        profileMap.set(profile.studentId, profile);
      });

      // Transform to the format expected by StudentSelector
      const formattedStudents = students.map(student => {
        const profile = profileMap.get(student.userId);
        return {
          id: student.userId,
          name: profile?.studentName || profile?.name || student.displayName || student.name || `Student ${student.userId.replace('STUDENT_', '')}`,
          email: profile?.email || student.email || `${student.userId}@example.com`,
          isSelected: false
        };
      });

      // Return the students found (even if empty)
      return NextResponse.json({
        success: true,
        data: formattedStudents,
        message: formattedStudents.length === 0 ? `No students found for school: ${schoolId}` : `Found ${formattedStudents.length} students for school: ${schoolId}`,
        schoolId: schoolId,
        totalStudents: formattedStudents.length
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      
      // Return error instead of fallback dummy data
      return NextResponse.json({
        success: false,
        error: 'Database connection failed. Please check your database connection.',
        data: []
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
