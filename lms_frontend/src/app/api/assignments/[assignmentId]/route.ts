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
    const userId = searchParams.get('userId');

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
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
    if (role === 'teacher' && assignment.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this assignment' },
        { status: 403 }
      );
    }

    // For students, check if they are assigned to this assignment
    if (role === 'student' && !assignment.assignedTo.includes(userId)) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to this assignment' },
        { status: 403 }
      );
    }

    // Fetch student names for personalized versions
    if (assignment.personalizedVersions && assignment.personalizedVersions.length > 0) {
      const studentIds = assignment.personalizedVersions.map((pv: any) => pv.studentId);
      const students = await studentProfilesCollection
        .find({ studentId: { $in: studentIds } })
        .toArray();

      // Create a map of studentId to student name
      const studentMap = new Map();
      students.forEach((student: any) => {
        studentMap.set(student.studentId, student.studentName || student.name || student.studentId);
      });

      // Add student names to personalized versions
      assignment.personalizedVersions = assignment.personalizedVersions.map((pv: any) => ({
        ...pv,
        studentName: studentMap.get(pv.studentId) || pv.studentId
      }));
    }

    // For students, return only their personalized version if it exists
    if (role === 'student' && assignment.personalizedVersions) {
      const studentVersion = assignment.personalizedVersions.find((pv: any) => pv.studentId === userId);
      if (studentVersion) {
        assignment.personalizedContent = studentVersion;
      }
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
    const { role, userId } = await request.json();

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

    if (assignment.createdBy !== userId) {
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

// PUT - Update an assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const { role, userId, ...updateData } = await request.json();

    if (role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only teachers can update assignments' },
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

    if (assignment.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to update this assignment' },
        { status: 403 }
      );
    }

    // Update the assignment
    const result = await assignmentsCollection.updateOne(
      { _id: new ObjectId(assignmentId) },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No changes made to assignment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully'
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}
