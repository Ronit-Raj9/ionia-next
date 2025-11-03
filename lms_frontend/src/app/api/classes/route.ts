import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, Class, ClassChat } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

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
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    
    // Fetch classes created by this teacher
    const classes = await classesCollection
      .find({ teacherId: teacherId })
      .sort({ createdAt: -1 })
      .toArray() as unknown as Class[];

    // For each class, count the assignments and ensure teacherName is populated
    const classesWithCounts = await Promise.all(
      classes.map(async (classData) => {
        const assignmentCount = await assignmentsCollection.countDocuments({
          classId: classData._id?.toString()
        });

        // Ensure teacherName is set (populate if missing)
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
          ...classData,
          teacherName: teacherName, // Ensure teacher name is included
          studentCount: classData.studentIds?.length || 0,
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
    const schoolIdObjectId = new ObjectId(schoolId);
    const existingClass = await classesCollection.findOne({
      teacherId: teacherId,
      schoolId: schoolIdObjectId,
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

    // Get teacher information to store actual name
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const teacher = await usersCollection.findOne({ userId: teacherId });
    const teacherName = teacher?.name || teacher?.displayName || 'Teacher';

    const newClass: Omit<Class, '_id'> = {
      className,
      teacherId: teacherId,
      teacherName: teacherName, // Store actual teacher name
      schoolId: new ObjectId(schoolId), // Store as ObjectId for consistency
      studentIds: studentIds || [],
      description,
      subject,
      grade,
      isActive: true,
      joinCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await classesCollection.insertOne(newClass);

    // Auto-create class chat for this class
    try {
      const classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);
      const usersCollection = await getCollection(COLLECTIONS.USERS);
      
      // Verify teacher exists and get actual teacher name
      const teacher = await usersCollection.findOne({ userId: teacherId });
      if (!teacher) {
        throw new Error(`Teacher with userId ${teacherId} not found`);
      }
      const teacherName = teacher.name || teacher.displayName || 'Teacher';
      
      if (!teacherName || teacherName === 'Teacher') {
        console.error(`Warning: Teacher name not properly set for ${teacherId}`);
      }
      
      // Get students info if provided
      const studentParticipants = [];
      if (studentIds && studentIds.length > 0) {
        const students = await usersCollection.find({ 
          userId: { $in: studentIds } 
        }).toArray();
        
        studentParticipants.push(...students.map((s: any) => ({
          userId: s.userId,
          role: 'student' as const,
          name: s.name || s.displayName || 'Student',
          joinedAt: new Date(),
          isActive: true
        })));
      }
      
      // Use classId as string (ObjectId.toString()) for consistency
      const classIdString = result.insertedId.toString();
      const now = new Date();
      
      // Check if chat already exists (shouldn't happen, but safety check)
      const existingChat = await classChatsCollection.findOne({
        classId: classIdString,
        teacherId: teacherId
      });
      
      if (existingChat) {
        console.log(`Class chat already exists for class ${className}, skipping creation`);
      } else {
        const newClassChat: ClassChat = {
          classId: classIdString,
          teacherId: teacherId, // Store teacher ID
          teacherName: teacherName, // Store actual teacher name from users collection
          className: className, // Store class name for traceability
          description: description || `Chat for ${className}`,
          participants: [
            {
              userId: teacherId,
              role: 'teacher' as const,
              name: teacherName, // Use actual teacher name
              joinedAt: now,
              isActive: true
            },
            ...studentParticipants
          ],
          messages: [],
          lastActivity: now,
          settings: {
            allowStudentMessages: true,
            allowFileSharing: true,
            moderationEnabled: false,
            allowReactions: true
          },
          isActive: true,
          createdAt: now,
          updatedAt: now
        };
        
        await classChatsCollection.insertOne(newClassChat);
        console.log(`Auto-created class chat for class ${className} (ID: ${classIdString}, Teacher: ${teacherName} (${teacherId}))`);
      }
    } catch (chatError) {
      // Log error but don't fail class creation
      console.error('Failed to auto-create class chat:', chatError);
    }

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
    if (selectedStudents) updateData.studentIds = selectedStudents.map((s: any) => s.id);

    const result = await classesCollection.updateOne(
      { _id: new ObjectId(classId), teacherId: teacherId },
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
    // SECURITY: Require authentication
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // SECURITY: Only teachers and admins can delete classes
    if (!['teacher', 'admin', 'superadmin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can delete classes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json(
        { success: false, error: 'ClassId is required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);

    // SECURITY: Build query based on user role
    const deleteQuery: any = {
      _id: new ObjectId(classId)
    };

    // Teachers can only delete their own classes
    // Admins can delete classes in their school
    // Superadmin can delete any class
    if (session.role === 'teacher') {
      deleteQuery.teacherId = session.userId;
    } else if (session.role === 'admin' && session.schoolId) {
      // Admin can delete classes in their school
      deleteQuery.schoolId = new ObjectId(session.schoolId);
    }
    // Superadmin can delete any class (no additional filter)

    const result = await classesCollection.deleteOne(deleteQuery);

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
