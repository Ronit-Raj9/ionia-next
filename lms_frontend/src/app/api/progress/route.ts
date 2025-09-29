import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Progress, StudentProfile, Submission } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const mockUserId = searchParams.get('mockUserId');
    const classId = searchParams.get('classId');
    const studentMockId = searchParams.get('studentMockId');

    if (!role || !mockUserId) {
      return NextResponse.json(
        { success: false, error: 'Role and mockUserId are required' },
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

    if (role === 'student') {
      // Students can only see their own progress
      return await getStudentProgress(mockUserId, classId);
    } else {
      // Teachers and admins can see class progress
      return await getClassProgress(classId, studentMockId || undefined);
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
    const { role, mockUserId, classId, action } = body;

    if (!role || !mockUserId) {
      return NextResponse.json(
        { success: false, error: 'Role and mockUserId are required' },
        { status: 400 }
      );
    }

    // Only teachers and admins can trigger progress updates
    if (!['teacher', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can update progress' },
        { status: 403 }
      );
    }

    if (action === 'refresh') {
      // Validate required parameters
      if (!classId) {
        return NextResponse.json(
          { success: false, error: 'classId is required for refresh action' },
          { status: 400 }
        );
      }
      
      // Refresh/recalculate progress data
      await refreshProgressData(classId);
      return NextResponse.json({
        success: true,
        message: 'Progress data refreshed successfully',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
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

async function getStudentProgress(studentMockId: string, classId: string) {
  try {
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);

    // Get student profile
    const profile = await profilesCollection.findOne({ studentMockId }) as unknown as StudentProfile;
    
    // Get student progress
    const progress = await progressCollection.findOne({ studentMockId, classId }) as unknown as Progress;
    
    // Get recent submissions
    const recentSubmissions = await submissionsCollection
      .find({ studentMockId })
      .sort({ submissionTime: -1 })
      .limit(10)
      .toArray() as unknown as Submission[];

    // Calculate metrics
    const totalSubmissions = recentSubmissions.length;
    const processedSubmissions = recentSubmissions.filter(s => s.processed && s.grade);
    const averageScore = processedSubmissions.length > 0 
      ? processedSubmissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0) / processedSubmissions.length 
      : 0;
    
    const accuracy = averageScore;
    const completionRate = totalSubmissions > 0 ? (processedSubmissions.length / totalSubmissions) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        student: {
          mockUserId: studentMockId,
          profile: profile || null,
        },
        metrics: {
          totalSubmissions,
          averageScore: Math.round(accuracy),
          completionRate: Math.round(completionRate),
          weaknesses: profile?.previousPerformance.weaknesses || [],
          strengths: profile?.intellectualProfile.strengths || [],
          masteryScores: profile?.previousPerformance.masteryScores || {},
          timeSaved: progress?.metrics.timeSaved || 0,
        },
        recentActivity: processedSubmissions.slice(0, 5).map(submission => ({
          date: submission.submissionTime,
          score: submission.grade?.score || 0,
          feedback: submission.grade?.feedback || '',
        })),
        progress: progress || null,
      },
    });
  } catch (error) {
    console.error('Student progress error:', error);
    throw error;
  }
}

async function getClassProgress(classId: string, specificStudentId?: string) {
  try {
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);

    // Get all student profiles for the class
    const profiles = await profilesCollection
      .find({ classId })
      .toArray() as unknown as StudentProfile[];

    if (profiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          classMetrics: {
            totalStudents: 0,
            averageScore: 0,
            completionRate: 0,
            totalSubmissions: 0,
          },
          heatmap: [],
          studentProgress: [],
        },
      });
    }

    // Filter by specific student if requested
    const targetProfiles = specificStudentId 
      ? profiles.filter(p => p.studentMockId === specificStudentId)
      : profiles;

    // Get submissions for all students
    const studentIds = targetProfiles.map(p => p.studentMockId);
    const allSubmissions = await submissionsCollection
      .find({ studentMockId: { $in: studentIds } })
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
      profile.previousPerformance.weaknesses.forEach(weakness => {
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
        const studentSubmissions = allSubmissions.filter(s => s.studentMockId === profile.studentMockId);
        const studentProcessed = studentSubmissions.filter(s => s.processed && s.grade);
        const studentAverage = studentProcessed.length > 0
          ? studentProcessed.reduce((sum, s) => sum + (s.grade?.score || 0), 0) / studentProcessed.length
          : 0;

        const progress = await progressCollection.findOne({
          studentMockId: profile.studentMockId,
          classId,
        }) as unknown as Progress;

        return {
          studentMockId: profile.studentMockId,
          displayName: `Student ${profile.studentMockId.replace('student', '')}`,
          metrics: {
            totalSubmissions: studentSubmissions.length,
            averageScore: Math.round(studentAverage),
            weaknesses: profile.previousPerformance.weaknesses,
            strengths: profile.intellectualProfile.strengths,
            personalityType: profile.personalityProfile.type,
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
        classMetrics: {
          totalStudents: targetProfiles.length,
          averageScore: Math.round(averageScore),
          completionRate: totalSubmissions > 0 ? Math.round((processedSubmissions.length / totalSubmissions) * 100) : 0,
          totalSubmissions,
          totalTimeSaved: studentProgress.reduce((sum, sp) => sum + (sp.progress?.metrics.timeSaved || 0), 0),
        },
        heatmap,
        studentProgress: studentProgress.sort((a, b) => b.metrics.averageScore - a.metrics.averageScore),
      },
    });
  } catch (error) {
    console.error('Class progress error:', error);
    throw error;
  }
}

async function refreshProgressData(classId: string) {
  try {
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);

    // Get all student profiles
    const profiles = await profilesCollection
      .find({ classId })
      .toArray() as unknown as StudentProfile[];

    // Update progress for each student
    for (const profile of profiles) {
      const submissions = await submissionsCollection
        .find({ studentMockId: profile.studentMockId })
        .toArray() as unknown as Submission[];

      const processedSubmissions = submissions.filter(s => s.processed && s.grade);
      const averageScore = processedSubmissions.length > 0
        ? processedSubmissions.reduce((sum, s) => sum + (s.grade?.score || 0), 0) / processedSubmissions.length
        : 0;

      // Update or create progress record
      await progressCollection.updateOne(
        { studentMockId: profile.studentMockId, classId },
        {
          $set: {
            metrics: {
              mastery: { overall: averageScore },
              weaknesses: profile.previousPerformance.weaknesses,
              timeSaved: submissions.length * 10, // 10 minutes per submission
            },
          },
          $push: {
            updates: {
              timestamp: new Date(),
              change: `Progress refreshed - Average: ${Math.round(averageScore)}%`,
            },
          },
        } as any,
        { upsert: true }
      );
    }
  } catch (error) {
    console.error('Refresh progress error:', error);
    throw error;
  }
}
