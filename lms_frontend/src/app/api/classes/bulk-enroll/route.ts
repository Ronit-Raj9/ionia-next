import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Class } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/sessionManager';
import { ObjectId } from 'mongodb';

/**
 * POST - Bulk enroll students into classes
 * SECURE: Requires valid session authentication
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate session from HTTP-only cookie
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admin and superadmin can bulk enroll
    if (!['admin', 'superadmin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Only admins and superadmins can bulk enroll students' },
        { status: 403 }
      );
    }

    const { creatorUserId, creatorRole, schoolId, enrollments } = await request.json();

    if (!enrollments || !Array.isArray(enrollments) || enrollments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enrollments array is required' },
        { status: 400 }
      );
    }

    const classesCollection = await getCollection(COLLECTIONS.CLASSES);
    const usersCollection = await getCollection(COLLECTIONS.USERS);

    const results: any[] = [];
    const errors: any[] = [];

    // Process each enrollment
    for (const enrollment of enrollments) {
      const { studentId, classId, className } = enrollment;

      try {
        // Validate student exists and belongs to school
        const student = await usersCollection.findOne({ 
          userId: studentId,
          role: 'student'
        });

        if (!student) {
          errors.push({
            studentId,
            className: className || enrollment.className || 'Unknown',
            error: 'Student not found'
          });
          continue;
        }

        // Validate school scoping for admin
        if (session.role !== 'superadmin' && session.schoolId) {
          if (!student.schoolId || student.schoolId.toString() !== session.schoolId) {
            errors.push({
              studentId,
              className: className || enrollment.className || 'Unknown',
              error: 'Student does not belong to your school'
            });
            continue;
          }
        }

        // Validate class exists - try by ID first, then by name
        let classData: Class | null = null;
        
        if (classId && ObjectId.isValid(classId)) {
          // Try to find by ObjectId
          try {
            classData = await classesCollection.findOne({ 
              _id: new ObjectId(classId)
            }) as unknown as Class | null;
          } catch (error) {
            // Invalid ObjectId format, continue to name search
          }
        }
        
        // If not found by ID, search by subject and grade (parse from className)
        if (!classData && className) {
          // Parse subject and grade from className
          const lowerName = className.trim().toLowerCase();
          
          // Common subject keywords
          const subjects = ['science', 'math', 'mathematics', 'english', 'history', 'physics', 'chemistry', 'biology', 'computer science', 'cs'];
          
          // Extract subject
          let foundSubject: string | null = null;
          for (const subject of subjects) {
            if (lowerName.includes(subject)) {
              foundSubject = subject;
              break;
            }
          }
          
          // Extract grade number
          const gradeMatch = lowerName.match(/(?:grade|class|g|gr)\s*(\d+)|^(\d+)(?:\s|$)|(\d+)(?:\s|$)/i);
          let foundGrade: string | null = null;
          
          if (gradeMatch) {
            foundGrade = gradeMatch[1] || gradeMatch[2] || gradeMatch[3] || null;
          }
          
          // Build query based on subject and grade
          const classQuery: any = {};
          
          // Add school scoping for non-superadmin
          if (session.role !== 'superadmin' && session.schoolId) {
            // session.schoolId is a string, convert to ObjectId
            classQuery.schoolId = new ObjectId(session.schoolId);
          }
          
          // If we found subject and/or grade, match by those
          if (foundSubject || foundGrade) {
            if (foundSubject) {
              // Match subject (case-insensitive, partial match)
              classQuery.subject = { $regex: new RegExp(foundSubject, 'i') };
            }
            
            if (foundGrade) {
              // Match grade - can be "Grade 7", "7", "Grade7", etc.
              // Extract numbers from grade field and match
              // Create $or for grade matching, but combine properly with subject
              const gradeConditions = [
                { grade: { $regex: new RegExp(foundGrade, 'i') } },
                { grade: { $regex: new RegExp(`grade\\s*${foundGrade}|class\\s*${foundGrade}`, 'i') } },
                { className: { $regex: new RegExp(foundGrade, 'i') } } // Fallback to class name
              ];
              
              // If we also have subject, combine properly
              if (foundSubject) {
                // Both subject and grade must match
                classQuery.$and = [
                  { subject: { $regex: new RegExp(foundSubject, 'i') } },
                  { $or: gradeConditions }
                ];
                // Remove subject from top level since it's in $and
                delete classQuery.subject;
              } else {
                // Only grade matching
                classQuery.$or = gradeConditions;
              }
            }
          } else {
            // Fallback: try exact class name match if we can't parse subject/grade
            classQuery.className = { $regex: new RegExp(`^${className.trim()}$`, 'i') };
          }
          
          classData = await classesCollection.findOne(classQuery) as unknown as Class | null;
        }

        if (!classData) {
          errors.push({
            studentId,
            className: className || enrollment.className || 'Unknown',
            error: `Class "${className || enrollment.className}" not found`
          });
          continue;
        }

        // Validate school scoping for class
        if (session.role !== 'superadmin' && session.schoolId) {
          // Convert classData.schoolId to string for comparison
          let classSchoolId: string;
          if (classData.schoolId instanceof ObjectId) {
            classSchoolId = classData.schoolId.toString();
          } else if (typeof classData.schoolId === 'string') {
            classSchoolId = classData.schoolId;
          } else {
            classSchoolId = String(classData.schoolId);
          }
            
          if (!classSchoolId || classSchoolId !== session.schoolId) {
            errors.push({
              studentId,
              className: className || enrollment.className || 'Unknown',
              error: 'Class does not belong to your school'
            });
            continue;
          }
        }

        // Check if student is already enrolled
        if (classData.studentIds && classData.studentIds.includes(studentId)) {
          results.push({
            studentId,
            studentName: student.name,
            className: classData.className || enrollment.className,
            status: 'skipped',
            message: 'Student already enrolled in this class'
          });
          continue;
        }

        // Add student to class (use classData._id which we found)
        const updateResult = await classesCollection.updateOne(
          { _id: classData._id },
          { 
            $addToSet: { studentIds: studentId },
            $set: { updatedAt: new Date() }
          }
        );

        if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
          results.push({
            studentId,
            studentName: student.name,
            className: classData.className || enrollment.className,
            status: 'success',
            message: 'Enrolled successfully'
          });
        } else {
          errors.push({
            studentId,
            className: enrollment.className,
            error: 'Failed to enroll student'
          });
        }

      } catch (error) {
        console.error(`Error enrolling student ${studentId}:`, error);
        errors.push({
          studentId,
          className: enrollment.className,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Format errors as results for consistency
    const errorResults = errors.map(err => ({
      studentId: err.studentId,
      studentName: err.studentName || 'Unknown',
      className: err.className,
      status: 'error',
      error: err.error
    }));

    const allResults = [...results, ...errorResults];

    return NextResponse.json({
      success: true,
      message: `Processed ${allResults.length} enrollment(s): ${results.length} successful, ${errors.length} failed`,
      data: allResults,
      summary: {
        total: allResults.length,
        successful: results.length,
        failed: errors.length,
        skipped: results.filter(r => r.status === 'skipped').length
      }
    });

  } catch (error) {
    console.error('Error in bulk enrollment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process bulk enrollment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

