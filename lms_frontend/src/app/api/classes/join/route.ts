import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS, Class, ClassChat } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// POST - Join a classroom using join code
export async function POST(request: NextRequest) {
  try {
    const { joinCode, studentId, studentName, studentEmail } = await request.json();

    // Validate required parameters
    if (!joinCode || !studentId) {
      return NextResponse.json(
        { success: false, error: 'Join code and student ID are required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Find the classroom with the given join code
    const classroom = await classesCollection.findOne({
      joinCode: joinCode,
      isActive: true
    }) as unknown as Class | null;

    if (!classroom) {
      return NextResponse.json(
        { success: false, error: 'Invalid join code or classroom not found' },
        { status: 404 }
      );
    }

    // Check if student is already in the class
    if (classroom.studentIds.includes(studentId)) {
      return NextResponse.json(
        { success: false, error: 'You are already enrolled in this class' },
        { status: 400 }
      );
    }

    // Add student to the classroom
    const updateResult = await classesCollection.updateOne(
      { _id: classroom._id },
      { 
        $addToSet: { studentIds: studentId },
        $set: { updatedAt: new Date() }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to join classroom' },
        { status: 500 }
      );
    }

    // Update student's classId in users collection (for primary class)
    if (studentName && studentEmail) {
      await usersCollection.updateOne(
        { userId: studentId },
        { 
          $set: { 
            classId: classroom._id?.toString(),
            updatedAt: new Date()
          }
        }
      );
    }

    // Auto-add student to class chat
    try {
      const classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);
      const classIdString = classroom._id?.toString() || '';
      
      // Find or create class chat for this class
      let classChat = await classChatsCollection.findOne({
        classId: classIdString,
        teacherId: classroom.teacherId
      }) as unknown as ClassChat | null;
      
      if (!classChat) {
        // Create class chat if it doesn't exist
        // Verify teacher exists and get actual teacher name
        const teacher = await usersCollection.findOne({ userId: classroom.teacherId });
        if (!teacher) {
          throw new Error(`Teacher with userId ${classroom.teacherId} not found`);
        }
        const teacherName = teacher.name || teacher.displayName || 'Teacher';
        
        if (!teacherName || teacherName === 'Teacher') {
          console.error(`Warning: Teacher name not properly set for ${classroom.teacherId}`);
        }
        
        const now = new Date();
        const newClassChat: ClassChat = {
          classId: classIdString,
          teacherId: classroom.teacherId, // Store teacher ID
          teacherName: teacherName, // Store actual teacher name from users collection
          className: classroom.className || 'Class', // Store class name for traceability
          description: `Chat for ${classroom.className || 'Class'}`,
          participants: [
            {
              userId: classroom.teacherId,
              role: 'teacher' as const,
              name: teacherName, // Use actual teacher name
              joinedAt: now,
              isActive: true
            },
            {
              userId: studentId,
              role: 'student' as const,
              name: studentName || 'Student',
              joinedAt: now,
              isActive: true
            }
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
        console.log(`Auto-created class chat for class ${classroom.className} (Teacher: ${teacherName} (${classroom.teacherId}))`);
      } else {
        // Ensure teacherName is correct in existing chat
        if (!classChat.teacherName || classChat.teacherName === 'Teacher') {
          const teacher = await usersCollection.findOne({ userId: classroom.teacherId });
          const teacherName = teacher?.name || teacher?.displayName || 'Teacher';
          
          if (teacherName && teacherName !== 'Teacher') {
            await classChatsCollection.updateOne(
              { _id: classChat._id },
              { $set: { teacherName: teacherName } }
            );
            classChat.teacherName = teacherName;
          }
        }
        
        // Add student to existing chat if not already a participant
        const isParticipant = classChat.participants?.some(
          (p: any) => p.userId === studentId && p.isActive
        );
        
        if (!isParticipant) {
          await classChatsCollection.updateOne(
            { _id: classChat._id },
            {
              $push: {
                participants: {
                  userId: studentId,
                  role: 'student' as const,
                  name: studentName || 'Student',
                  joinedAt: new Date(),
                  isActive: true
                }
              },
              $set: { updatedAt: new Date() }
            } as any
          );
          console.log(`Added student ${studentId} to class chat for ${classroom.className}`);
        }
      }
    } catch (chatError) {
      // Log error but don't fail join process
      console.error('Failed to add student to class chat:', chatError);
    }

    console.log(`Student ${studentId} joined classroom ${classroom.className} (${classroom._id})`);

    return NextResponse.json({
      success: true,
      data: {
        classroomId: classroom._id,
        className: classroom.className,
        subject: classroom.subject,
        grade: classroom.grade,
        teacherId: classroom.teacherId
      },
      message: `Successfully joined ${classroom.className}!`
    });

  } catch (error) {
    console.error('Error joining classroom:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join classroom' },
      { status: 500 }
    );
  }
}