import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db';

// GET - Fetch details for a specific assignment
export async function GET(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const mockUserId = searchParams.get('mockUserId');

    if (!role || !mockUserId) {
      return NextResponse.json(
        { success: false, error: 'Role and mockUserId are required' },
        { status: 400 }
      );
    }

    const { assignmentId } = params;

    if (!assignmentId || !ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { success: false, error: 'Valid assignment ID is required' },
        { status: 400 }
      );
    }

    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const studentProfilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    
    // Find the assignment
    const assignment = await assignmentsCollection.findOne({
      _id: new ObjectId(assignmentId)
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (role === 'teacher' && assignment.createdBy !== mockUserId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this assignment' },
        { status: 403 }
      );
    }

    // Fetch student names for personalized versions
    if (assignment.personalizedVersions && assignment.personalizedVersions.length > 0) {
      const studentIds = assignment.personalizedVersions.map((pv: any) => pv.studentMockId);
      const students = await studentProfilesCollection
        .find({ studentMockId: { $in: studentIds } })
        .toArray();

      // Create a map of studentMockId to student name
      const studentMap = new Map();
      students.forEach((student: any) => {
        studentMap.set(student.studentMockId, student.studentName || student.name || student.studentMockId);
      });

      // Add student names to personalized versions
      assignment.personalizedVersions = assignment.personalizedVersions.map((pv: any) => ({
        ...pv,
        studentName: studentMap.get(pv.studentMockId) || pv.studentMockId
      }));
    }

    return NextResponse.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment details' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { role, mockUserId } = await request.json();

    if (role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only teachers can delete assignments' },
        { status: 403 }
      );
    }

    const { assignmentId } = params;

    if (!assignmentId || !ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { success: false, error: 'Valid assignment ID is required' },
        { status: 400 }
      );
    }

    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    
    // Check if assignment exists and user has permission
    const assignment = await assignmentsCollection.findOne({
      _id: new ObjectId(assignmentId)
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.createdBy !== mockUserId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this assignment' },
        { status: 403 }
      );
    }

    // Delete the assignment
    const result = await assignmentsCollection.deleteOne({
      _id: new ObjectId(assignmentId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete assignment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
