import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// GET - Retrieve list of students
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Only teachers and admins can access student list
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    try {
      const usersCollection = await getCollection(COLLECTIONS.USERS);
      
      // Get all student users
      const students = await usersCollection
        .find({ role: 'student' })
        .sort({ mockUserId: 1 })
        .toArray();

      // Transform to the format expected by StudentSelector
      const formattedStudents = students.map(student => ({
        id: student.mockUserId,
        name: student.displayName || student.name || `Student ${student.mockUserId.replace('student', '')}`,
        email: student.email || `${student.mockUserId}@example.com`,
        isSelected: false
      }));

      // If no students found in database, use fallback
      if (formattedStudents.length === 0) {
        const fallbackStudents = [];
        for (let i = 1; i <= 20; i++) {
          fallbackStudents.push({
            id: `student${i}`,
            name: `Student ${i}`,
            email: `student${i}@example.com`,
            isSelected: false
          });
        }

        return NextResponse.json({
          success: true,
          data: fallbackStudents,
          fallback: true
        });
      }

      return NextResponse.json({
        success: true,
        data: formattedStudents
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      
      // Fallback to default students if database is not available
      const fallbackStudents = [];
      for (let i = 1; i <= 20; i++) {
        fallbackStudents.push({
          id: `student${i}`,
          name: `Student ${i}`,
          email: `student${i}@example.com`,
          isSelected: false
        });
      }

      return NextResponse.json({
        success: true,
        data: fallbackStudents,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
