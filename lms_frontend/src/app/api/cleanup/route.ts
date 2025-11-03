import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';

/**
 * SECURITY: Development-only API to clean up test data
 * WARNING: This will delete data from the database
 * DISABLED IN PRODUCTION for security
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Disable in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is disabled in production for security reasons.' },
        { status: 403 }
      );
    }

    // SECURITY: Require authentication
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // SECURITY: Only admin and superadmin can perform cleanup
    if (!['admin', 'superadmin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only admin and superadmin can perform cleanup actions.' },
        { status: 403 }
      );
    }

    const { action, classId } = await request.json();

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);

    let result: any = {};

    switch (action) {
      case 'delete_all_assignments':
        // Delete all assignments
        const deleteAssignments = await assignmentsCollection.deleteMany({});
        const deleteSubmissions = await submissionsCollection.deleteMany({});
        
        result = {
          assignmentsDeleted: deleteAssignments.deletedCount,
          submissionsDeleted: deleteSubmissions.deletedCount
        };
        break;

      case 'delete_class_assignments':
        if (!classId) {
          return NextResponse.json(
            { success: false, error: 'classId is required for this action' },
            { status: 400 }
          );
        }

        // Delete assignments for specific class
        const deleteClassAssignments = await assignmentsCollection.deleteMany({
          classId: classId
        });

        // Delete related submissions
        const deleteClassSubmissions = await submissionsCollection.deleteMany({
          classId: classId
        });

        result = {
          assignmentsDeleted: deleteClassAssignments.deletedCount,
          submissionsDeleted: deleteClassSubmissions.deletedCount
        };
        break;

      case 'count_assignments':
        // Count assignments per class
        const assignments = await assignmentsCollection.find({}).toArray();
        
        const countByClass: Record<string, number> = {};
        assignments.forEach((assignment: any) => {
          const cId = assignment.classId || 'no-class';
          countByClass[cId] = (countByClass[cId] || 0) + 1;
        });

        result = {
          totalAssignments: assignments.length,
          byClass: countByClass,
          sampleAssignments: assignments.slice(0, 3).map((a: any) => ({
            _id: a._id,
            title: a.title,
            classId: a.classId,
            createdAt: a.createdAt
          }))
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error) {
    console.error('Error in cleanup API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform cleanup action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * SECURITY: GET endpoint to check database state
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Disable in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is disabled in production for security reasons.' },
        { status: 403 }
      );
    }

    // SECURITY: Require authentication
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // SECURITY: Only admin and superadmin can check database state
    if (!['admin', 'superadmin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const classesCollection = await getCollection(COLLECTIONS.CLASSES);

    const totalAssignments = await assignmentsCollection.countDocuments({});
    const totalSubmissions = await submissionsCollection.countDocuments({});
    const totalClasses = await classesCollection.countDocuments({});

    // Get sample data
    const sampleAssignments = await assignmentsCollection
      .find({})
      .limit(5)
      .toArray();

    const sampleClasses = await classesCollection
      .find({})
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      counts: {
        assignments: totalAssignments,
        submissions: totalSubmissions,
        classes: totalClasses
      },
      samples: {
        assignments: sampleAssignments.map((a: any) => ({
          _id: a._id,
          title: a.title,
          subject: a.subject,
          classId: a.classId,
          createdAt: a.createdAt
        })),
        classes: sampleClasses.map((c: any) => ({
          _id: c._id,
          className: c.className,
          subject: c.subject,
          studentCount: c.studentIdsngth || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error checking database state:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check database state' },
      { status: 500 }
    );
  }
}
