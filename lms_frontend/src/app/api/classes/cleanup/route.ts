import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db';

// DELETE - Remove demo/test/seed classes and related data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const schoolId = searchParams.get('schoolId');
    const role = searchParams.get('role');
    const confirmCleanup = searchParams.get('confirm') === 'true';

    // Enhanced authorization check
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only teachers and admins can perform cleanup' },
        { status: 403 }
      );
    }

    // Require both teacherId and schoolId for safety
    if (!teacherId || !schoolId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID and School ID are required' },
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
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const classChatsCollection = await getCollection(COLLECTIONS.CLASS_CHATS);

    // Enhanced query to identify demo/test/seed classes
    const demoClassQuery = {
      schoolId: new ObjectId(schoolId),
      $or: [
        // Class name patterns
        { className: { $regex: /^(demo|test|seed|sample|temp|trial|practice)/i } },
        // Description patterns
        { description: { $regex: /^(demo|test|seed|sample|temp|trial|practice)/i } },
        // Classes created by demo/test teachers (if teacherId starts with demo/test patterns)
        { 
          $and: [
            { teacherId: { $regex: /^(demo|test|seed|sample|temp|trial|practice)/i } },
            { teacherId: teacherId }
          ]
        },
        // Classes with very few students (likely test classes)
        { 
          $expr: { $lte: [{ $size: { $ifNull: ["$studentIds", []] } }, 1] },
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Created in last 7 days
        }
      ]
    };

    // First, find classes that would be deleted (dry run)
    const classesToDelete = await classesCollection.find(demoClassQuery).toArray();

    if (classesToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No demo/test classes found to clean up',
        deletedCount: 0,
        classesFound: []
      });
    }

    // If not confirmed, return preview of what would be deleted
    if (!confirmCleanup) {
      return NextResponse.json({
        success: true,
        message: `Found ${classesToDelete.length} demo/test classes. Add ?confirm=true to proceed with deletion.`,
        preview: true,
        classesToDelete: classesToDelete.map(cls => ({
          _id: cls._id,
          className: cls.className,
          description: cls.description,
          teacherId: cls.teacherId,
          studentCount: cls.studentIds?.length || 0,
          createdAt: cls.createdAt
        })),
        totalClasses: classesToDelete.length
      });
    }

    // Proceed with actual deletion
    const classIds = classesToDelete.map(cls => cls._id);

    // Delete related data first
    const [assignmentsResult, submissionsResult, chatsResult] = await Promise.all([
      // Delete assignments for these classes
      assignmentsCollection.deleteMany({
        classId: { $in: classIds.map(id => id.toString()) }
      }),
      // Delete submissions for assignments in these classes
      submissionsCollection.deleteMany({
        assignmentId: { 
          $in: await assignmentsCollection.distinct('_id', {
            classId: { $in: classIds.map(id => id.toString()) }
          })
        }
      }),
      // Delete class chats for these classes
      classChatsCollection.deleteMany({
        classId: { $in: classIds.map(id => id.toString()) }
      })
    ]);

    // Finally, delete the classes themselves
    const classesResult = await classesCollection.deleteMany(demoClassQuery);

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up demo/test classes and related data`,
      deletedCount: classesResult.deletedCount,
      details: {
        classes: classesResult.deletedCount,
        assignments: assignmentsResult.deletedCount,
        submissions: submissionsResult.deletedCount,
        chats: chatsResult.deletedCount
      },
      totalCleaned: classesResult.deletedCount + assignmentsResult.deletedCount + submissionsResult.deletedCount + chatsResult.deletedCount
    });

  } catch (error) {
    console.error('Error cleaning up demo classes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to cleanup demo classes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
