import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, Submission, StudentProfile, Progress } from '@/lib/db';
import { generateAssignmentSuggestions, generateAdaptivePath } from '@/lib/aiRecommendations';
import { calculateEngagementMetrics, calculateProgressBars, BADGES } from '@/lib/gamification';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');
    const classId = searchParams.get('classId') || '';
    const schoolId = searchParams.get('schoolId') || undefined;

    if (!role || !userId) {
      return NextResponse.json(
        { success: false, error: 'Role and userId are required' },
        { status: 400 }
      );
    }

    if (role === 'teacher') {
      return await getTeacherDashboardData(userId, classId, schoolId);
    } else if (role === 'student') {
      return await getStudentDashboardData(userId, classId, schoolId);
    } else if (role === 'admin') {
      return await getAdminDashboardData(classId, schoolId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

async function getTeacherDashboardData(teacherId: string, classId: string, schoolId?: string) {
  try {
    // Get class progress data
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const classProgressQuery: any = { classId };
    if (schoolId) {
      classProgressQuery.schoolId = schoolId;
    }
    const classProgress = await progressCollection.find(classProgressQuery).toArray();

    // Get recent assignments
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const assignmentsQuery: any = { createdBy: teacherId };
    if (schoolId) {
      assignmentsQuery.schoolId = schoolId;
    }
    const recentAssignments = await assignmentsCollection
      .find(assignmentsQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Calculate class metrics
    const totalStudents = classProgress.length;
    const averageScore = totalStudents > 0 
      ? Math.round(classProgress.reduce((sum, p) => sum + (p.metrics.averageScore || 0), 0) / totalStudents)
      : 0;
    const completionRate = totalStudents > 0
      ? Math.round(classProgress.reduce((sum, p) => sum + (p.metrics.completionRate || 0), 0) / totalStudents)
      : 0;
    const totalSubmissions = classProgress.reduce((sum, p) => sum + (p.metrics.totalSubmissions || 0), 0);
    const totalTimeSaved = classProgress.reduce((sum, p) => sum + (p.metrics.timeSaved || 0), 0);

    // Generate class weaknesses heatmap
    const allWeaknesses = classProgress.flatMap(p => p.metrics.weaknesses || []);
    const weaknessFrequency = allWeaknesses.reduce((acc, weakness) => {
      acc[weakness] = (acc[weakness] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const heatmap = Object.entries(weaknessFrequency)
      .map(([topic, count]) => ({
        topic,
        percentage: Math.round(((count as number) / totalStudents) * 100),
        studentsAffected: count as number
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8);

    // Generate AI-powered assignment suggestions
    const topWeaknesses = heatmap.slice(0, 5).map(item => item.topic);
    const suggestions = await generateAssignmentSuggestions(topWeaknesses, averageScore, 'mathematics');

    // Get student performance overview
    const studentOverview = classProgress.map(progress => {
      const recentActivity = progress.recentActivity?.[0];
      return {
        studentId: progress.studentId,
        name: `Student ${progress.studentId.replace('student', '')}`,
        averageScore: progress.metrics.averageScore || 0,
        completionRate: progress.metrics.completionRate || 0,
        strengths: progress.metrics.strengths || [],
        weaknesses: progress.metrics.weaknesses || [],
        lastActivity: recentActivity ? {
          type: recentActivity.type,
          description: recentActivity.description,
          timestamp: recentActivity.timestamp
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        classMetrics: {
          totalStudents,
          averageScore,
          completionRate,
          totalSubmissions,
          totalTimeSaved
        },
        heatmap,
        suggestions,
        recentAssignments: recentAssignments.map(assignment => ({
          _id: assignment._id,
          taskType: assignment.taskType,
          createdAt: assignment.createdAt,
          personalizedCount: assignment.personalizedVersions?.length || 0,
          suggestions: assignment.suggestions || []
        })),
        studentOverview
      }
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    throw error;
  }
}

async function getStudentDashboardData(studentId: string, classId: string, schoolId?: string) {
  try {
    // Get student progress
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const progressQuery: any = { 
      studentId, 
      classId 
    };
    if (schoolId) {
      progressQuery.schoolId = schoolId;
    }
    const studentProgress = await progressCollection.findOne(progressQuery) as unknown as Progress | null;

    // Get student profile
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const profileQuery: any = { studentId };
    if (schoolId) {
      profileQuery.schoolId = schoolId;
    }
    const studentProfile = await profilesCollection.findOne(profileQuery) as unknown as StudentProfile | null;

    // Get available assignments
    const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
    const assignmentsQuery: any = { classId };
    if (schoolId) {
      assignmentsQuery.schoolId = schoolId;
    }
    const assignments = await assignmentsCollection
      .find(assignmentsQuery)
      .sort({ createdAt: -1 })
      .toArray();

    // Get student submissions
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const submissions = await submissionsCollection
      .find({ studentId })
      .sort({ submissionTime: -1 })
      .toArray() as unknown as Submission[];

    // Calculate engagement metrics
    const engagementMetrics = studentProfile 
      ? calculateEngagementMetrics(submissions, studentProfile)
      : null;

    // Calculate progress bars
    const progressBars = studentProgress 
      ? calculateProgressBars(studentProgress, submissions)
      : {};

    // Generate adaptive learning path
    const adaptivePath = studentProfile && studentProgress
      ? await generateAdaptivePath(studentProfile, studentProgress.metrics.mastery || {})
      : [];

    // Get personalized assignments
    const personalizedAssignments = assignments.map(assignment => {
      const personalizedVersion = assignment.personalizedVersions?.find(
        (pv: any) => pv.studentId === studentId
      );
      
      const submission = submissions.find(s => s.assignmentId === assignment._id?.toString());
      
      return {
        _id: assignment._id,
        taskType: assignment.taskType,
        createdAt: assignment.createdAt,
        questions: personalizedVersion?.adaptedContent.questions || assignment.originalContent.questions,
        variations: personalizedVersion?.adaptedContent.variations || 'Standard version',
        isCompleted: !!submission,
        grade: submission?.grade,
        submissionTime: submission?.submissionTime
      };
    });

    // Get badges and achievements
    const badges = studentProgress?.gamificationData?.badges || [];
    const badgeDetails = badges.map(badgeKey => ({
      ...BADGES[badgeKey as keyof typeof BADGES],
      key: badgeKey
    }));

    return NextResponse.json({
      success: true,
      data: {
        studentInfo: {
          studentId: studentId,
          name: `Student ${studentId.replace('student', '')}`,
          learningStyle: studentProfile?.personalityProfile.type || 'visual'
        },
        progress: {
          metrics: studentProgress?.metrics || {
            mastery: {},
            weaknesses: [],
            timeSaved: 0,
            strengths: [],
            averageScore: 0,
            completionRate: 0,
            totalSubmissions: 0
          },
          progressBars,
          recentActivity: studentProgress?.recentActivity || []
        },
        gamification: {
          badges: badgeDetails,
          achievements: studentProgress?.gamificationData?.achievements || [],
          streakDays: engagementMetrics?.streakDays || 0,
          totalTimeSpent: engagementMetrics?.totalTimeSpent || 0
        },
        assignments: personalizedAssignments,
        adaptivePath,
        engagementMetrics
      }
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    throw error;
  }
}

async function getAdminDashboardData(classId: string, schoolId?: string) {
  try {
    // Get all class data
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const classProgressQuery: any = { classId };
    if (schoolId) {
      classProgressQuery.schoolId = schoolId;
    }
    const classProgress = await progressCollection.find(classProgressQuery).toArray();

    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
    const profilesQuery: any = {};
    if (schoolId) {
      profilesQuery.schoolId = schoolId;
    }
    const studentProfiles = await profilesCollection.find(profilesQuery).toArray();

    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const allSubmissions = await submissionsCollection.find({}).toArray();

    // Calculate comprehensive analytics
    const totalStudents = classProgress.length;
    const averageScore = totalStudents > 0 
      ? Math.round(classProgress.reduce((sum, p) => sum + (p.metrics.averageScore || 0), 0) / totalStudents)
      : 0;
    const completionRate = totalStudents > 0
      ? Math.round(classProgress.reduce((sum, p) => sum + (p.metrics.completionRate || 0), 0) / totalStudents)
      : 0;
    const totalSubmissions = classProgress.reduce((sum, p) => sum + (p.metrics.totalSubmissions || 0), 0);
    const totalTimeSaved = classProgress.reduce((sum, p) => sum + (p.metrics.timeSaved || 0), 0);

    // Advanced analytics
    const scoreUplift = classProgress.reduce((sum, p) => sum + (p.advancedMetrics?.scoreUplift || 0), 0) / totalStudents;
    const learningVelocity = classProgress.reduce((sum, p) => sum + (p.advancedMetrics?.learningVelocity || 1), 0) / totalStudents;

    // Class weaknesses heatmap
    const allWeaknesses = classProgress.flatMap(p => p.metrics.weaknesses || []);
    const weaknessFrequency = allWeaknesses.reduce((acc, weakness) => {
      acc[weakness] = (acc[weakness] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const heatmap = Object.entries(weaknessFrequency)
      .map(([topic, count]) => ({
        topic,
        percentage: Math.round(((count as number) / totalStudents) * 100),
        studentsAffected: count as number
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Student performance details
    const studentPerformance = classProgress.map(progress => {
      const profile = studentProfiles.find(p => p.studentId === progress.studentId);
      const studentSubmissions = allSubmissions.filter(s => s.studentId === progress.studentId);
      
      return {
        studentId: progress.studentId,
        name: `Student ${progress.studentId.replace('student', '')}`,
        averageScore: progress.metrics.averageScore || 0,
        completionRate: progress.metrics.completionRate || 0,
        strengths: progress.metrics.strengths || [],
        weaknesses: progress.metrics.weaknesses || [],
        badges: progress.gamificationData?.badges.length || 0,
        recentActivity: progress.recentActivity?.[0]?.description || 'No recent activity',
        learningStyle: profile?.personalityProfile.type || 'unknown',
        totalSubmissions: studentSubmissions.length,
        scoreUplift: progress.advancedMetrics?.scoreUplift || 0
      };
    });

    // Trends data (mock for demo)
    const trends = [
      { week: 'Week 1', averageScore: Math.max(0, averageScore - 15), completionRate: Math.max(0, completionRate - 20) },
      { week: 'Week 2', averageScore: Math.max(0, averageScore - 10), completionRate: Math.max(0, completionRate - 15) },
      { week: 'Week 3', averageScore: Math.max(0, averageScore - 5), completionRate: Math.max(0, completionRate - 10) },
      { week: 'Week 4', averageScore, completionRate }
    ];

    return NextResponse.json({
      success: true,
      data: {
        classMetrics: {
          totalStudents,
          averageScore,
          completionRate,
          totalSubmissions,
          totalTimeSaved,
          scoreUplift: Math.round(scoreUplift),
          learningVelocity: Math.round(learningVelocity * 100) / 100
        },
        heatmap,
        studentPerformance,
        trends,
        analytics: {
          engagementRate: Math.round((totalSubmissions / (totalStudents * 5)) * 100), // Assume 5 assignments
          averageTimePerAssignment: Math.round(totalTimeSaved / Math.max(1, totalSubmissions)),
          masteryDistribution: {
            high: studentPerformance.filter(s => s.averageScore >= 80).length,
            medium: studentPerformance.filter(s => s.averageScore >= 60 && s.averageScore < 80).length,
            low: studentPerformance.filter(s => s.averageScore < 60).length
          }
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    throw error;
  }
}
