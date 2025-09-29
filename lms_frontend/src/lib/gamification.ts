import { Progress, StudentProfile, Submission } from './db';

// Badge definitions
export const BADGES = {
  FIRST_SUBMISSION: {
    name: 'Getting Started',
    description: 'Submitted your first assignment',
    icon: '🎯',
    color: 'blue'
  },
  PERFECT_SCORE: {
    name: 'Perfect Score',
    description: 'Achieved 100% on an assignment',
    icon: '⭐',
    color: 'gold'
  },
  STREAK_3: {
    name: 'On Fire',
    description: '3 days learning streak',
    icon: '🔥',
    color: 'orange'
  },
  STREAK_7: {
    name: 'Dedicated Learner',
    description: '7 days learning streak',
    icon: '💪',
    color: 'purple'
  },
  IMPROVEMENT: {
    name: 'Rising Star',
    description: 'Improved score by 20% or more',
    icon: '📈',
    color: 'green'
  },
  MATH_MASTER: {
    name: 'Math Master',
    description: 'Mastered 5 math concepts',
    icon: '🧮',
    color: 'indigo'
  },
  PROBLEM_SOLVER: {
    name: 'Problem Solver',
    description: 'Solved 10 challenging problems',
    icon: '🧩',
    color: 'teal'
  },
  HELPER: {
    name: 'Helpful Friend',
    description: 'Helped classmates with questions',
    icon: '🤝',
    color: 'pink'
  },
  CONSISTENT: {
    name: 'Consistent Performer',
    description: 'Maintained 80%+ average for a week',
    icon: '🎖️',
    color: 'emerald'
  },
  EXPLORER: {
    name: 'Knowledge Explorer',
    description: 'Completed assignments in 3+ topics',
    icon: '🗺️',
    color: 'cyan'
  }
} as const;

export type BadgeType = keyof typeof BADGES;

// Check and award badges based on submission
export function checkAndAwardBadges(
  submission: Submission,
  studentProgress: Progress,
  allSubmissions: Submission[]
): BadgeType[] {
  const newBadges: BadgeType[] = [];
  const currentBadges = studentProgress.gamificationData?.badges || [];

  // First submission badge
  if (allSubmissions.length === 1 && !currentBadges.includes('FIRST_SUBMISSION')) {
    newBadges.push('FIRST_SUBMISSION');
  }

  // Perfect score badge
  if (submission.grade?.score === 100 && !currentBadges.includes('PERFECT_SCORE')) {
    newBadges.push('PERFECT_SCORE');
  }

  // Improvement badge (20% score increase)
  if (allSubmissions.length >= 2) {
    const previousScores = allSubmissions
      .slice(-3, -1) // Get 2 previous submissions
      .filter(s => s.grade)
      .map(s => s.grade!.score);
    
    if (previousScores.length > 0) {
      const avgPrevious = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
      const improvement = ((submission.grade?.score || 0) - avgPrevious) / avgPrevious * 100;
      
      if (improvement >= 20 && !currentBadges.includes('IMPROVEMENT')) {
        newBadges.push('IMPROVEMENT');
      }
    }
  }

  // Math Master badge (5 concepts mastered)
  const masteredConcepts = Object.values(studentProgress.metrics.mastery || {})
    .filter(score => score >= 80).length;
  
  if (masteredConcepts >= 5 && !currentBadges.includes('MATH_MASTER')) {
    newBadges.push('MATH_MASTER');
  }

  // Problem Solver badge (10 submissions with score > 70)
  const goodSubmissions = allSubmissions.filter(s => s.grade && s.grade.score >= 70).length;
  if (goodSubmissions >= 10 && !currentBadges.includes('PROBLEM_SOLVER')) {
    newBadges.push('PROBLEM_SOLVER');
  }

  // Consistent performer badge
  const recentScores = allSubmissions.slice(-5).filter(s => s.grade).map(s => s.grade!.score);
  if (recentScores.length >= 5) {
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    if (avgRecent >= 80 && !currentBadges.includes('CONSISTENT')) {
      newBadges.push('CONSISTENT');
    }
  }

  // Explorer badge (3+ different topics)
  const uniqueTopics = new Set(allSubmissions.map(s => s.chainLink || 'general')).size;
  if (uniqueTopics >= 3 && !currentBadges.includes('EXPLORER')) {
    newBadges.push('EXPLORER');
  }

  return newBadges;
}

// Calculate progress bars for different topics
export function calculateProgressBars(
  studentProgress: Progress,
  allSubmissions: Submission[]
): Record<string, number> {
  const progressBars: Record<string, number> = {};

  // Overall progress
  progressBars['Overall'] = Math.min(100, (studentProgress.metrics.averageScore || 0));

  // Topic-specific progress based on mastery
  const mastery = studentProgress.metrics.mastery || {};
  Object.entries(mastery).forEach(([topic, score]) => {
    progressBars[topic] = Math.min(100, score);
  });

  // Submission consistency (based on recent activity)
  const recentSubmissions = allSubmissions.filter(s => {
    const daysSince = (Date.now() - s.submissionTime.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });
  
  progressBars['Weekly Activity'] = Math.min(100, (recentSubmissions.length / 5) * 100);

  // Learning streak progress
  const streakDays = calculateStreakDays(allSubmissions);
  progressBars['Learning Streak'] = Math.min(100, (streakDays / 7) * 100);

  return progressBars;
}

// Calculate current learning streak
export function calculateStreakDays(submissions: Submission[]): number {
  if (submissions.length === 0) return 0;

  const sortedSubmissions = submissions
    .sort((a, b) => b.submissionTime.getTime() - a.submissionTime.getTime());

  let streakDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const submission of sortedSubmissions) {
    const submissionDate = new Date(submission.submissionTime);
    submissionDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === streakDays) {
      streakDays++;
    } else if (daysDiff > streakDays) {
      break;
    }
  }

  return streakDays;
}

// Generate achievement notifications
export function generateAchievementNotification(badgeType: BadgeType): string {
  const badge = BADGES[badgeType];
  const encouragingMessages = [
    "Amazing work! 🎉",
    "You're on fire! 🔥",
    "Fantastic achievement! ⭐",
    "Keep it up! 💪",
    "Outstanding! 🌟",
    "You're crushing it! 🚀"
  ];

  const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  
  return `${randomMessage} You earned the "${badge.name}" badge! ${badge.icon}`;
}

// Calculate engagement metrics
export function calculateEngagementMetrics(
  submissions: Submission[],
  studentProfile: StudentProfile
): StudentProfile['engagementMetrics'] {
  const totalAssignments = 20; // Assume 20 total assignments available
  const completedAssignments = submissions.length;
  
  const completionRate = Math.min(100, (completedAssignments / totalAssignments) * 100);
  
  const badgeCount = studentProfile.engagementMetrics?.badgeCount || 0;
  
  const streakDays = calculateStreakDays(submissions);
  
  const totalTimeSpent = submissions.reduce((total, sub) => {
    return total + (sub.timeSpent || 30); // Default 30 minutes if not tracked
  }, 0);

  // Progress chains based on mastery levels
  const progressChains = [
    { chainId: 'arithmetic', status: 'mastered' as const },
    { chainId: 'algebra', status: 'in_progress' as const },
    { chainId: 'geometry', status: 'locked' as const }
  ];

  return {
    completionRate,
    badgeCount,
    progressChains,
    streakDays,
    totalTimeSpent
  };
}

// Generate motivational messages based on performance
export function generateMotivationalMessage(
  recentScore: number,
  streakDays: number,
  improvementTrend: 'up' | 'down' | 'stable'
): string {
  const messages = {
    high_performance: [
      "You're absolutely crushing it! Keep up the excellent work! 🌟",
      "Outstanding performance! You're becoming a math superstar! ⭐",
      "Incredible work! Your dedication is really paying off! 🚀"
    ],
    good_performance: [
      "Great job! You're making solid progress! 💪",
      "Nice work! Keep building on this momentum! 📈",
      "Well done! You're developing strong skills! 🎯"
    ],
    improving: [
      "Amazing improvement! Your hard work is showing! 📈",
      "Look at that progress! You're getting stronger every day! 💪",
      "Fantastic growth! Keep up the great effort! 🌱"
    ],
    encouraging: [
      "Every expert was once a beginner. Keep practicing! 🌟",
      "You're learning and growing with each attempt! 🌱",
      "Progress takes time. You're on the right track! 🎯"
    ],
    streak_celebration: [
      `${streakDays} days strong! You're building an amazing habit! 🔥`,
      `${streakDays}-day streak! Your consistency is inspiring! ⚡`,
      `${streakDays} days in a row! You're unstoppable! 🚀`
    ]
  };

  // Streak celebration takes priority
  if (streakDays >= 3) {
    return messages.streak_celebration[Math.floor(Math.random() * messages.streak_celebration.length)];
  }

  // Performance-based messages
  if (recentScore >= 90) {
    return messages.high_performance[Math.floor(Math.random() * messages.high_performance.length)];
  } else if (recentScore >= 70) {
    return messages.good_performance[Math.floor(Math.random() * messages.good_performance.length)];
  } else if (improvementTrend === 'up') {
    return messages.improving[Math.floor(Math.random() * messages.improving.length)];
  } else {
    return messages.encouraging[Math.floor(Math.random() * messages.encouraging.length)];
  }
}

// Update student profile with new engagement data
export function updateEngagementMetrics(
  studentProfile: StudentProfile,
  newBadges: BadgeType[],
  submissions: Submission[]
): StudentProfile {
  const currentMetrics = studentProfile.engagementMetrics || {
    completionRate: 0,
    badgeCount: 0,
    progressChains: [],
    streakDays: 0,
    totalTimeSpent: 0
  };

  const updatedMetrics = calculateEngagementMetrics(submissions, studentProfile);
  if (updatedMetrics) {
    updatedMetrics.badgeCount = currentMetrics.badgeCount + newBadges.length;
  }

  return {
    ...studentProfile,
    engagementMetrics: updatedMetrics || currentMetrics,
    updatedAt: new Date()
  };
}
