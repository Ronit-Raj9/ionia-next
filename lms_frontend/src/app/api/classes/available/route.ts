import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, Class } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Fetch available classes for students to join
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const studentId = searchParams.get('studentId');
    const role = searchParams.get('role');

    // Validate role permissions
    if (role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can view available classes' },
        { status: 403 }
      );
    }

    // Validate required parameters
    if (!schoolId || !studentId) {
      return NextResponse.json(
        { success: false, error: 'School ID and student ID are required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format for schoolId
    if (!ObjectId.isValid(schoolId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid school ID format' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    
    // Find classes in the same school that the student is not already a member of
    const availableClasses = await classesCollection
      .find({
        schoolId: new ObjectId(schoolId),
        isActive: true,
        studentIds: { $nin: [studentId] }
      })
      .sort({ createdAt: -1 })
      .toArray() as unknown as Class[];

    // Return only basic info needed for joining, with teacher names populated
    const formattedClasses = await Promise.all(availableClasses.map(async (classData) => {
      // Ensure teacherName is populated
      let teacherName = classData.teacherName;
      if (!teacherName || teacherName === 'Teacher') {
        const teacher = await usersCollection.findOne({ userId: classData.teacherId });
        teacherName = teacher?.name || teacher?.displayName || 'Teacher';
        
        // Update class with teacher name if missing
        if (!classData.teacherName) {
          await classesCollection.updateOne(
            { _id: classData._id },
            { $set: { teacherName: teacherName } }
          );
        }
      }

      return {
        _id: classData._id,
        className: classData.className,
        description: classData.description,
        subject: classData.subject,
        grade: classData.grade,
        teacherId: classData.teacherId,
        teacherName: teacherName, // Use populated teacher name
        studentCount: classData.studentIds?.length || 0,
        joinCode: classData.joinCode,
        currentTopic: classData.currentTopic,
        syllabus: classData.syllabus,
        createdAt: classData.createdAt
      };
    }));

    return NextResponse.json({
      success: true,
      data: formattedClasses,
      count: formattedClasses.length
    });
  } catch (error) {
    console.error('Error fetching available classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available classes' },
      { status: 500 }
    );
  }
}




