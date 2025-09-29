import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const timeRange = searchParams.get('timeRange') || 'month';

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get student submissions and progress data
    const submissionsCollection = await getCollection(COLLECTIONS.SUBMISSIONS);
    const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
    const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'semester':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch submissions for the time range
    const submissions = await submissionsCollection
      .find({
        studentMockId: studentId,
        createdAt: { $gte: startDate }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch progress data
    const progress = await progressCollection.findOne({
      studentMockId: studentId
    });

    // Fetch student profile
    const profile = await profilesCollection.findOne({
      studentMockId: studentId
    });

    // Calculate analytics data
    const analyticsData = calculateAdvancedAnalytics(submissions, progress, profile, timeRange);

    return NextResponse.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Advanced analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

function calculateAdvancedAnalytics(submissions: any[], progress: any, profile: any, timeRange: string) {
  // Calculate performance metrics
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter(s => s.grade && s.grade.isPublished);
  const averageScore = gradedSubmissions.length > 0 
    ? gradedSubmissions.reduce((sum, s) => sum + (s.grade.score / s.grade.maxScore) * 100, 0) / gradedSubmissions.length
    : 0;

  // Calculate previous period for comparison
  const previousPeriod = calculatePreviousPeriod(submissions, timeRange);
  const previousAverageScore = previousPeriod.averageScore;

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (averageScore > previousAverageScore + 2) trend = 'up';
  else if (averageScore < previousAverageScore - 2) trend = 'down';

  // Calculate subject-wise performance
  const subjectPerformance = calculateSubjectPerformance(submissions);

  // Calculate learning patterns
  const learningPatterns = calculateLearningPatterns(submissions, profile);

  // Generate predictions
  const predictions = generatePredictions(submissions, subjectPerformance, learningPatterns);

  // Generate parent report
  const parentReport = generateParentReport(submissions, progress, profile);

  return {
    studentId: submissions[0]?.studentMockId || '',
    timeRange,
    performance: {
      current: Math.round(averageScore),
      previous: Math.round(previousAverageScore),
      trend
    },
    subjects: subjectPerformance,
    learningPatterns,
    predictions,
    parentReport
  };
}

function calculatePreviousPeriod(submissions: any[], timeRange: string) {
  const now = new Date();
  let previousStart: Date;
  let previousEnd: Date;

  switch (timeRange) {
    case 'week':
      previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      previousEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      previousEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'semester':
      previousStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      previousEnd = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      previousEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const previousSubmissions = submissions.filter(s => {
    const submissionDate = new Date(s.createdAt);
    return submissionDate >= previousStart && submissionDate <= previousEnd;
  });

  const gradedPrevious = previousSubmissions.filter(s => s.grade && s.grade.isPublished);
  const averageScore = gradedPrevious.length > 0 
    ? gradedPrevious.reduce((sum, s) => sum + (s.grade.score / s.grade.maxScore) * 100, 0) / gradedPrevious.length
    : 0;

  return { averageScore };
}

function calculateSubjectPerformance(submissions: any[]) {
  const subjects = ['Mathematics', 'Science', 'English', 'History'];
  const subjectData: { [key: string]: { scores: number[], lastUpdated: string } } = {};

  // Initialize subject data
  subjects.forEach(subject => {
    subjectData[subject] = { scores: [], lastUpdated: 'Never' };
  });

  // Process submissions
  submissions.forEach(submission => {
    if (submission.grade && submission.grade.isPublished) {
      const subject = submission.subject || 'Mathematics';
      const score = (submission.grade.score / submission.grade.maxScore) * 100;
      
      if (subjectData[subject]) {
        subjectData[subject].scores.push(score);
        const lastUpdated = new Date(submission.createdAt);
        if (lastUpdated > new Date(subjectData[subject].lastUpdated)) {
          subjectData[subject].lastUpdated = lastUpdated.toLocaleDateString();
        }
      }
    }
  });

  // Calculate averages and trends
  return subjects.map(subject => {
    const data = subjectData[subject];
    const averageScore = data.scores.length > 0 
      ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
      : 0;

    // Simple trend calculation
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (data.scores.length >= 2) {
      const recent = data.scores.slice(0, Math.ceil(data.scores.length / 2));
      const older = data.scores.slice(Math.ceil(data.scores.length / 2));
      const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
      const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
      
      if (recentAvg > olderAvg + 2) trend = 'up';
      else if (recentAvg < olderAvg - 2) trend = 'down';
    }

    return {
      name: subject,
      score: Math.round(averageScore),
      trend,
      lastUpdated: data.lastUpdated
    };
  });
}

function calculateLearningPatterns(submissions: any[], profile: any) {
  // Analyze submission times to find peak hours
  const submissionHours = submissions.map(s => new Date(s.createdAt).getHours());
  const hourCounts: { [key: number]: number } = {};
  
  submissionHours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  // Get preferred subjects from profile or calculate from submissions
  const subjectCounts: { [key: string]: number } = {};
  submissions.forEach(s => {
    const subject = s.subject || 'Mathematics';
    subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
  });

  const preferredSubjects = Object.entries(subjectCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([subject]) => subject);

  // Calculate completion rate
  const totalAssignments = submissions.length;
  const completedAssignments = submissions.filter(s => s.processed).length;
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  // Determine difficulty level based on performance
  const averageScore = submissions.length > 0 
    ? submissions.reduce((sum, s) => {
        if (s.grade && s.grade.isPublished) {
          return sum + (s.grade.score / s.grade.maxScore) * 100;
        }
        return sum;
      }, 0) / submissions.length
    : 0;

  let difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium';
  if (averageScore >= 85) difficultyLevel = 'easy';
  else if (averageScore < 70) difficultyLevel = 'hard';

  return {
    peakHours: peakHours.length > 0 ? peakHours : ['9:00 AM', '2:00 PM', '7:00 PM'],
    preferredSubjects: preferredSubjects.length > 0 ? preferredSubjects : ['Mathematics', 'Science'],
    difficultyLevel,
    completionRate: Math.round(completionRate)
  };
}

function generatePredictions(submissions: any[], subjectPerformance: any[], learningPatterns: any) {
  // Simple prediction based on recent performance
  const recentSubmissions = submissions.slice(0, 5);
  const recentScores = recentSubmissions
    .filter(s => s.grade && s.grade.isPublished)
    .map(s => (s.grade.score / s.grade.maxScore) * 100);

  const nextWeekScore = recentScores.length > 0 
    ? Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length)
    : 75;

  // Identify risk areas based on lowest performing subjects
  const riskAreas = subjectPerformance
    .filter(s => s.score < 75)
    .map(s => `${s.name} - ${s.score < 60 ? 'Basic Concepts' : 'Advanced Topics'}`)
    .slice(0, 2);

  // Generate recommendations
  const recommendations = [];
  if (nextWeekScore < 80) {
    recommendations.push('Focus on reviewing difficult concepts');
  }
  if (learningPatterns.completionRate < 80) {
    recommendations.push('Improve time management for assignments');
  }
  if (riskAreas.length > 0) {
    recommendations.push(`Pay extra attention to: ${riskAreas.join(', ')}`);
  }

  return {
    nextWeekScore,
    riskAreas: riskAreas.length > 0 ? riskAreas : ['General study habits'],
    recommendations: recommendations.length > 0 ? recommendations : ['Maintain current study routine']
  };
}

function generateParentReport(submissions: any[], progress: any, profile: any) {
  // Calculate overall progress
  const gradedSubmissions = submissions.filter(s => s.grade && s.grade.isPublished);
  const overallProgress = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.grade.score / s.grade.maxScore) * 100, 0) / gradedSubmissions.length)
    : 0;

  // Identify strengths and areas for improvement
  const strengths = [];
  const areasForImprovement = [];

  if (overallProgress >= 85) {
    strengths.push('Excellent academic performance');
  }
  if (profile?.personalityProfile?.type === 'visual') {
    strengths.push('Strong visual learning abilities');
  }
  if (profile?.personalityProfile?.type === 'analytical') {
    strengths.push('Strong analytical thinking');
  }

  if (overallProgress < 75) {
    areasForImprovement.push('Overall academic performance');
  }
  if (profile?.personalityProfile?.collaboration === 'low') {
    areasForImprovement.push('Collaborative learning skills');
  }

  // Calculate engagement and attendance (mock data for demo)
  const engagement = Math.min(95, Math.max(70, overallProgress + 10));
  const attendance = Math.min(100, Math.max(85, overallProgress + 15));

  return {
    overallProgress,
    strengths: strengths.length > 0 ? strengths : ['Consistent effort', 'Good attendance'],
    areasForImprovement: areasForImprovement.length > 0 ? areasForImprovement : ['Time management', 'Study organization'],
    engagement: Math.round(engagement),
    attendance: Math.round(attendance)
  };
}
