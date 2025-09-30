import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, Class } from '@/lib/db';

// GET - Fetch classes for a teacher
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const teacherId = searchParams.get('teacherId');

    if (!role || !teacherId) {
      return NextResponse.json(
        { success: false, error: 'Role and teacherId are required' },
        { status: 400 }
      );
    }

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can fetch classes' },
        { status: 403 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    
    // Fetch classes created by this teacher
    const classes = await classesCollection
      .find({ teacherMockId: teacherId })
      .sort({ createdAt: -1 })
      .toArray() as unknown as Class[];

    // For each class, count the assignments
    const classesWithCounts = await Promise.all(
      classes.map(async (classData) => {
        const assignmentCount = await assignmentsCollection.countDocuments({
          classId: classData._id?.toString()
        });

        return {
          ...classData,
          studentCount: classData.studentMockIds?.length || 0,
          recentAssignments: assignmentCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: classesWithCounts
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST - Create a new class
export async function POST(request: NextRequest) {
  try {
    const { teacherId, className, studentIds, description, subject, grade, schoolId, role } = await request.json();

    if (!teacherId || !className || !schoolId) {
      return NextResponse.json(
        { success: false, error: 'TeacherId, className, and schoolId are required' },
        { status: 400 }
      );
    }

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can create classes' },
        { status: 403 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);

    // Check if class with same name already exists for this teacher in this school
    const existingClass = await classesCollection.findOne({
      teacherMockId: teacherId,
      schoolId: schoolId,
      className: className
    });

    if (existingClass) {
      return NextResponse.json(
        { success: false, error: 'A class with this name already exists in your school' },
        { status: 400 }
      );
    }

    // Generate a unique join code
    const joinCode = `${schoolId.slice(0, 3).toUpperCase()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const newClass: Omit<Class, '_id'> = {
      className,
      teacherMockId: teacherId,
      schoolId,
      studentMockIds: studentIds || [],
      description,
      subject,
      grade,
      isActive: true,
      joinCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await classesCollection.insertOne(newClass);

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...newClass
      }
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create class' },
      { status: 500 }
    );
  }
}

// PUT - Update a class
export async function PUT(request: NextRequest) {
  try {
    const { classId, teacherId, className, selectedStudents, role } = await request.json();

    if (!classId || !teacherId) {
      return NextResponse.json(
        { success: false, error: 'ClassId and teacherId are required' },
        { status: 400 }
      );
    }

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can update classes' },
        { status: 403 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);

    const updateData: any = {};
    if (className) updateData.className = className;
    if (selectedStudents) updateData.studentMockIds = selectedStudents.map((s: any) => s.id);

    const result = await classesCollection.updateOne(
      { _id: new ObjectId(classId), teacherMockId: teacherId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Class not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Class updated successfully'
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a class
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const role = searchParams.get('role');

    if (!classId || !teacherId) {
      return NextResponse.json(
        { success: false, error: 'ClassId and teacherId are required' },
        { status: 400 }
      );
    }

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can delete classes' },
        { status: 403 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);

    const result = await classesCollection.deleteOne({
      _id: new ObjectId(classId),
      teacherMockId: teacherId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Class not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
