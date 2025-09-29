import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// DELETE - Remove demo/seed classes
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const role = searchParams.get('role');

    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);

    // Delete classes that contain "Demo" in their name or were created by demo teachers
    const result = await classesCollection.deleteMany({
      $or: [
        { className: { $regex: /demo/i } }, // Case-insensitive match for "demo"
        { teacherMockId: teacherId, className: { $regex: /demo/i } }
      ]
    });

    return NextResponse.json({
      success: true,
      message: `Removed ${result.deletedCount} demo classes`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up demo classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup demo classes' },
      { status: 500 }
    );
  }
}
