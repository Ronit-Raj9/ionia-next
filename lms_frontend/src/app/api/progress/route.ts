import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Progress, StudentProfile, Submission, User } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Helper function to validate user permissions
async function validateUserPermissions(userId: string, role: string, classId: string, schoolId?: string): Promise<boolean> {
  try {
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ userId }) as unknown as User | null;
    
    if (!user) {
      return false;
    }

    // Check if user role matches
    if (user.role !== role) {
      return false;
    }

    // For students, check if they belong to the class
    if (role === 'student' && user.classId !== classId) {
      return false;
    }

    // For teachers and admins, check school access
    if ((role === 'teacher' || role === 'admin') && schoolId && user.schoolId?.toString() !== schoolId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Permission validation error:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const schoolId = searchParams.get('schoolId');

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    // Validate role permissions
    if (!['teacher', 'admin', 'student'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 403 }
      );
    }

    // Validate required parameters
    if (!classId) {
      return NextResponse.json(
        { success: false, error: 'classId is required' },
        { status: 400 }
      );
    }

    // Validate user permissions
    const hasPermission = await validateUserPermissions(userId, role, classId, schoolId || undefined);
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to access this data' },
        { status: 403 }
      );
    }

    if (role === 'student') {
      // Students can only see their own progress
      return await getStudentProgress(userId, classId, schoolId || undefined);
    } else {
      // Teachers and admins can see class progress
      return await getClassProgress(classId, schoolId || undefined, studentId || undefined);
    }
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, userId, chainId, action, classId, schoolId } = body;

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    // Handle new chain-based actions
    if (action === 'start' && chainId) {
      // Students can start question chains
      if (role !== 'student') {
        return NextResponse.json(
          { success: false, error: 'Only students can start question chains' },
          { status: 403 }
        );
      }

      // Create or update student progress for the chain
      const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
      
      // Check if progress already exists
      const existingProgress = await progressCollection.findOne({
        userId: userId,
        chainId: chainId
      });

      if (existingProgress) {
        return NextResponse.json({
          success: true,
          message: 'Question chain already started',
          data: { progressId: existingProgress._id }
        });
      }

      // Create new progress record
      const newProgress = {
        userId: userId,
        chainId: chainId,
        status: 'in_progress',
        currentQuestionIndex: 0,
        totalQuestions: 0, // This should be fetched from the chain
        correctAnswers: 0,
        incorrectAnswers: 0,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await progressCollection.insertOne(newProgress);
      
      return NextResponse.json({
        success: true,
        message: 'Question chain started successfully',
        data: { progressId: result.insertedId }
      });
    }

    // Handle class-based progress actions
    if (action === 'refresh' && classId) {
      // Only teachers and admins can trigger progress updates
      if (!['teacher', 'admin'].includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Only teachers and admins can update progress' },
          { status: 403 }
        );
      }

      // Validate user permissions for refresh action
      const hasPermission = await validateUserPermissions(userId, role, classId, schoolId);
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to refresh progress data' },
          { status: 403 }
        );
      }
      
      // Refresh/recalculate progress data
      await refreshProgressData(classId, schoolId);
      return NextResponse.json({
        success: true,
        message: 'Progress data refreshed successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or missing required parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress data' },
      { status: 500 }
    );
  }
}

async function getStudentProgress(studentId: string, classId: string, schoolId?: string) {
  try {
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Build query with optional schoolId
    const profileQuery: any = { studentId };
    const progressQuery: any = { studentId, classId };
    const submissionsQuery: any = { studentId };
    
    if (schoolId) {
      profileQuery.schoolId = schoolId;
      progressQuery.schoolId = schoolId;
    }

    // Get user information
    const user = await usersCollection.findOne({ userId: studentId }) as unknown as User | null;
    
    // Get student profile
    const profile = await profilesCollection.findOne(profileQuery) as unknown as StudentProfile | null;
    
    // Get student progress
    const progress = await progressCollection.findOne(progressQuery) as unknown as Progress | null;
    
    // Get recent submissions
    const recentSubmissions = await submissionsCollection
      .find(submissionsQuery)
      .sort({ submissionTime: -1 })
      .limit(10)
      .toArray() as unknown as Submission[];

    // Calculate metrics
    const totalSubmissions = recentSubmissions.length;
    const processedSubmissions = recentSubmissions.filter(s => s.processed && s.grade);
    const averageScore = processedSubmissions.length > 0 
      ? processedSubmissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0) / processedSubmissions.length 
      : 0;
    
    const completionRate = totalSubmissions > 0 ? (processedSubmissions.length / totalSubmissions) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        student: {
          userId: studentId,
          name: user?.name || `Student ${studentId.replace('student', '')}`,
          email: user?.email || '',
          role: user?.role || 'student',
          classId: user?.classId || classId,
          profile: profile || null,
        },
        metrics: {
          totalSubmissions,
          averageScore: Math.round(averageScore),
          completionRate: Math.round(completionRate),
          weaknesses: profile?.previousPerformance?.weaknesses || [],
          strengths: profile?.intellectualProfile?.strengths || [],
          masteryScores: profile?.previousPerformance?.masteryScores || {},
          timeSaved: progress?.metrics?.timeSaved || 0,
          lastUpdated: progress?.updates?.[progress.updates.length - 1]?.timestamp || new Date(),
        },
        recentActivity: processedSubmissions.slice(0, 5).map(submission => ({
          id: submission._id?.toString() || '',
          date: submission.submissionTime,
          score: submission.grade?.score || 0,
          feedback: submission.grade?.feedback || '',
          status: submission.status || 'submitted',
        })),
        progress: progress || null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Student progress error:', error);
    throw error;
  }
}

async function getClassProgress(classId: string, schoolId?: string, specificStudentId?: string) {
  try {
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const usersCollection = await getCollection(COLLECTIONS.USERS);

    // Build query with optional schoolId
    const profilesQuery: any = { classId };
    if (schoolId) {
      profilesQuery.schoolId = schoolId;
    }

    // Get all student profiles for the class
    const profiles = await profilesCollection
      .find(profilesQuery)
      .toArray() as unknown as StudentProfile[];

    if (profiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          classInfo: {
            classId,
            schoolId: schoolId || null,
            totalStudents: 0,
          },
          classMetrics: {
            totalStudents: 0,
            averageScore: 0,
            completionRate: 0,
            totalSubmissions: 0,
            totalTimeSaved: 0,
            lastUpdated: new Date(),
          },
          heatmap: [],
          studentProgress: [],
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Filter by specific student if requested
    const targetProfiles = specificStudentId 
      ? profiles.filter(p => p.studentId === specificStudentId)
      : profiles;

    // Get submissions for all students
    const studentIds = targetProfiles.map(p => p.studentId);
    const allSubmissions = await submissionsCollection
      .find({ studentId: { $in: studentIds } })
      .toArray() as unknown as Submission[];

    // Calculate class metrics
    const totalSubmissions = allSubmissions.length;
    const processedSubmissions = allSubmissions.filter(s => s.processed && s.grade);
    const averageScore = processedSubmissions.length > 0
      ? processedSubmissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0) / processedSubmissions.length
      : 0;

    // Calculate heatmap data (weaknesses across class)
    const weaknessCount: Record<string, number> = {};
    targetProfiles.forEach(profile => {
      const weaknesses = profile.previousPerformance?.weaknesses || [];
      weaknesses.forEach(weakness => {
        weaknessCount[weakness] = (weaknessCount[weakness] || 0) + 1;
      });
    });

    const heatmap = Object.entries(weaknessCount).map(([topic, count]) => ({
      topic,
      percentage: Math.round((count / targetProfiles.length) * 100),
      studentCount: count,
    })).sort((a, b) => b.percentage - a.percentage);

    // Get individual student progress
    const studentProgress = await Promise.all(
      targetProfiles.map(async (profile) => {
        const studentSubmissions = allSubmissions.filter(s => s.studentId === profile.studentId);
        const studentProcessed = studentSubmissions.filter(s => s.processed && s.grade);
        const studentAverage = studentProcessed.length > 0
          ? studentProcessed.reduce((sum, s) => sum + (s.grade?.score || 0), 0) / studentProcessed.length
          : 0;

        // Build progress query with optional schoolId
        const progressQuery: any = {
          studentId: profile.studentId,
          classId,
        };
        if (schoolId) {
          progressQuery.schoolId = schoolId;
        }

        const progress = await progressCollection.findOne(progressQuery) as unknown as Progress | null;

        // Get user information for display name
        const user = await usersCollection.findOne({ userId: profile.studentId }) as unknown as User | null;

        return {
          studentId: profile.studentId,
          displayName: user?.name || `Student ${profile.studentId.replace('student', '')}`,
          metrics: {
            totalSubmissions: studentSubmissions.length,
            averageScore: Math.round(studentAverage),
            weaknesses: profile.previousPerformance?.weaknesses || [],
            strengths: profile.intellectualProfile?.strengths || [],
            personalityType: profile.personalityProfile?.type || 'unknown',
            lastActivity: studentSubmissions.length > 0 
              ? studentSubmissions[studentSubmissions.length - 1].submissionTime
              : null,
          },
          progress: progress || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        classInfo: {
          classId,
          schoolId: schoolId || null,
          totalStudents: targetProfiles.length,
        },
        classMetrics: {
          totalStudents: targetProfiles.length,
          averageScore: Math.round(averageScore),
          completionRate: totalSubmissions > 0 ? Math.round((processedSubmissions.length / totalSubmissions) * 100) : 0,
          totalSubmissions,
          totalTimeSaved: studentProgress.reduce((sum, sp) => sum + (sp.progress?.metrics?.timeSaved || 0), 0),
          lastUpdated: new Date(),
        },
        heatmap,
        studentProgress: studentProgress.sort((a, b) => b.metrics.averageScore - a.metrics.averageScore),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Class progress error:', error);
    throw error;
  }
}

async function refreshProgressData(classId: string, schoolId?: string) {
  try {
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);

    // Build query with optional schoolId
    const profilesQuery: any = { classId };
    if (schoolId) {
      profilesQuery.schoolId = schoolId;
    }

    // Get all student profiles
    const profiles = await profilesCollection
      .find(profilesQuery)
      .toArray() as unknown as StudentProfile[];

    // Update progress for each student
    for (const profile of profiles) {
      const submissions = await submissionsCollection
        .find({ studentId: profile.studentId })
        .toArray() as unknown as Submission[];

      const processedSubmissions = submissions.filter(s => s.processed && s.grade);
      const averageScore = processedSubmissions.length > 0
        ? processedSubmissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0) / processedSubmissions.length
        : 0;

      // Build progress query with optional schoolId
      const progressQuery: any = { studentId: profile.studentId, classId };
      if (schoolId) {
        progressQuery.schoolId = schoolId;
      }

      // Update or create progress record
      const updateData: any = {
        $set: {
          studentId: profile.studentId,
          classId,
          schoolId: schoolId || null,
          metrics: {
            mastery: { overall: averageScore },
            weaknesses: profile.previousPerformance?.weaknesses || [],
            timeSaved: submissions.length * 10, // 10 minutes per submission
            averageScore: Math.round(averageScore),
            completionRate: submissions.length > 0 ? Math.round((processedSubmissions.length / submissions.length) * 100) : 0,
            totalSubmissions: submissions.length,
          },
          updatedAt: new Date(),
        },
      };

      // Add updates array if it doesn't exist
      const existingProgress = await progressCollection.findOne(progressQuery);
      if (existingProgress) {
        updateData.$push = {
          updates: {
            timestamp: new Date(),
            change: `Progress refreshed - Average: ${Math.round(averageScore)}%`,
          },
        };
      } else {
        updateData.$set.updates = [{
          timestamp: new Date(),
          change: `Progress refreshed - Average: ${Math.round(averageScore)}%`,
        }];
      }

      await progressCollection.updateOne(
        progressQuery,
        updateData,
        { upsert: true }
      );
    }
  } catch (error) {
    console.error('Refresh progress error:', error);
    throw error;
  }
}
