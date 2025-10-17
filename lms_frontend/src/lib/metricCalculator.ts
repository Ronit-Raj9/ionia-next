/**
 * Metric Calculator Utility
 * 
 * Calculates and updates student learning metrics based on question attempts
 * and behavioral patterns. Uses research-based algorithms for adaptive learning.
 * 
 * Research References:
 * - Item Response Theory (IRT) for difficulty calibration
 * - Exponential Moving Average (EMA) for trend analysis
 * - Zone of Proximal Development (ZPD) for optimal challenge
 */

import { StudentLearningProfile } from '@/lib/db';

interface QuestionAttempt {
  questionId: string;
  topicId: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bloomsLevel: number;
  isCorrect: boolean;
  timeSpent: number; // seconds
  hintsUsed: number;
  confidence: 'low' | 'medium' | 'high';
  attemptedAt: Date;
  skipReason?: string;
}

/**
 * Calculate actual learning pace based on time taken vs expected
 * Returns a score from 1-10
 */
export function calculateLearningPace(
  attempts: QuestionAttempt[],
  expectedTime: Record<string, number> = { easy: 60, medium: 120, hard: 180 }
): number {
  if (attempts.length === 0) return 5; // Neutral starting point

  const recentAttempts = attempts.slice(-10); // Last 10 attempts
  
  let totalRatio = 0;
  recentAttempts.forEach(attempt => {
    const expected = expectedTime[attempt.difficulty];
    const ratio = expected / attempt.timeSpent; // >1 = faster than expected
    totalRatio += Math.min(2, Math.max(0.5, ratio)); // Clamp between 0.5 and 2
  });

  const avgRatio = totalRatio / recentAttempts.length;
  
  // Convert ratio to 1-10 scale
  // 1.0 ratio = 5 (average), 2.0 = 10 (very fast), 0.5 = 1 (very slow)
  const pace = Math.round(((avgRatio - 0.5) / 1.5) * 9 + 1);
  return Math.min(10, Math.max(1, pace));
}

/**
 * Calculate concept mastery rate (0-100%)
 * Uses Exponential Moving Average for recent performance weighting
 */
export function calculateConceptMasteryRate(
  attempts: QuestionAttempt[],
  alpha: number = 0.2 // Smoothing factor
): number {
  if (attempts.length === 0) return 0;

  // Start with simple accuracy for first few attempts
  if (attempts.length < 5) {
    const correct = attempts.filter(a => a.isCorrect).length;
    return Math.round((correct / attempts.length) * 100);
  }

  // Use EMA for better trend representation
  let ema = attempts[0].isCorrect ? 100 : 0;
  
  for (let i = 1; i < attempts.length; i++) {
    const currentValue = attempts[i].isCorrect ? 100 : 0;
    ema = alpha * currentValue + (1 - alpha) * ema;
  }

  return Math.round(ema);
}

/**
 * Calculate error recovery rate (0-100%)
 * Measures how well student learns from mistakes
 */
export function calculateErrorRecoveryRate(attempts: QuestionAttempt[]): number {
  if (attempts.length < 5) return 50; // Not enough data

  // Find questions that were attempted multiple times
  const questionAttempts = new Map<string, QuestionAttempt[]>();
  
  attempts.forEach(attempt => {
    if (!questionAttempts.has(attempt.questionId)) {
      questionAttempts.set(attempt.questionId, []);
    }
    questionAttempts.get(attempt.questionId)!.push(attempt);
  });

  let recoveryCount = 0;
  let errorCount = 0;

  questionAttempts.forEach((qAttempts) => {
    if (qAttempts.length > 1) {
      // Check if first was wrong and later was correct
      const firstWrong = !qAttempts[0].isCorrect;
      const laterCorrect = qAttempts.slice(1).some(a => a.isCorrect);
      
      if (firstWrong) {
        errorCount++;
        if (laterCorrect) recoveryCount++;
      }
    }
  });

  if (errorCount === 0) return 100; // No errors to recover from
  
  return Math.round((recoveryCount / errorCount) * 100);
}

/**
 * Calculate question attempt ratio (0-1)
 * Measures engagement - how many questions are attempted vs skipped
 */
export function calculateQuestionAttemptRatio(attempts: QuestionAttempt[]): number {
  if (attempts.length === 0) return 1.0;

  const skipped = attempts.filter(a => a.skipReason).length;
  const attempted = attempts.length - skipped;
  
  return Number((attempted / attempts.length).toFixed(2));
}

/**
 * Calculate average time per difficulty level
 */
export function calculateTimePerDifficulty(attempts: QuestionAttempt[]): {
  easy: number;
  medium: number;
  hard: number;
} {
  const times = {
    easy: [] as number[],
    medium: [] as number[],
    hard: [] as number[]
  };

  attempts.forEach(attempt => {
    if (attempt.timeSpent > 0 && attempt.timeSpent < 600) { // Cap at 10 minutes
      times[attempt.difficulty].push(attempt.timeSpent);
    }
  });

  return {
    easy: times.easy.length > 0 
      ? Math.round(times.easy.reduce((a, b) => a + b) / times.easy.length) 
      : 60,
    medium: times.medium.length > 0 
      ? Math.round(times.medium.reduce((a, b) => a + b) / times.medium.length) 
      : 120,
    hard: times.hard.length > 0 
      ? Math.round(times.hard.reduce((a, b) => a + b) / times.hard.length) 
      : 180
  };
}

/**
 * Identify strength topics (>80% accuracy)
 */
export function identifyStrengthTopics(attempts: QuestionAttempt[]): {
  topicId: string;
  topicName: string;
  subject: string;
  accuracyRate: number;
  lastAttempt: Date;
}[] {
  const topicStats = new Map<string, {
    correct: number;
    total: number;
    subject: string;
    lastAttempt: Date;
  }>();

  attempts.forEach(attempt => {
    if (!topicStats.has(attempt.topicId)) {
      topicStats.set(attempt.topicId, {
        correct: 0,
        total: 0,
        subject: attempt.subject,
        lastAttempt: attempt.attemptedAt
      });
    }
    
    const stats = topicStats.get(attempt.topicId)!;
    stats.total++;
    if (attempt.isCorrect) stats.correct++;
    if (new Date(attempt.attemptedAt) > stats.lastAttempt) {
      stats.lastAttempt = new Date(attempt.attemptedAt);
    }
  });

  const strengths: any[] = [];
  
  topicStats.forEach((stats, topicId) => {
    const accuracyRate = (stats.correct / stats.total) * 100;
    if (accuracyRate > 80 && stats.total >= 3) {
      strengths.push({
        topicId,
        topicName: topicId, // Should be mapped to actual topic name
        subject: stats.subject,
        accuracyRate: Math.round(accuracyRate),
        lastAttempt: stats.lastAttempt
      });
    }
  });

  return strengths;
}

/**
 * Identify weakness topics (<50% accuracy)
 */
export function identifyWeaknessTopics(attempts: QuestionAttempt[]): {
  topicId: string;
  topicName: string;
  subject: string;
  accuracyRate: number;
  attemptsCount: number;
  lastAttempt: Date;
}[] {
  const topicStats = new Map<string, {
    correct: number;
    total: number;
    subject: string;
    lastAttempt: Date;
  }>();

  attempts.forEach(attempt => {
    if (!topicStats.has(attempt.topicId)) {
      topicStats.set(attempt.topicId, {
        correct: 0,
        total: 0,
        subject: attempt.subject,
        lastAttempt: attempt.attemptedAt
      });
    }
    
    const stats = topicStats.get(attempt.topicId)!;
    stats.total++;
    if (attempt.isCorrect) stats.correct++;
    if (new Date(attempt.attemptedAt) > stats.lastAttempt) {
      stats.lastAttempt = new Date(attempt.attemptedAt);
    }
  });

  const weaknesses: any[] = [];
  
  topicStats.forEach((stats, topicId) => {
    const accuracyRate = (stats.correct / stats.total) * 100;
    if (accuracyRate < 50 && stats.total >= 3) {
      weaknesses.push({
        topicId,
        topicName: topicId, // Should be mapped to actual topic name
        subject: stats.subject,
        accuracyRate: Math.round(accuracyRate),
        attemptsCount: stats.total,
        lastAttempt: stats.lastAttempt
      });
    }
  });

  return weaknesses;
}

/**
 * Calculate confidence vs accuracy correlation
 * Range: -1 (overconfident) to 1 (accurate self-assessment)
 */
export function calculateConfidenceAccuracyCorrelation(attempts: QuestionAttempt[]): number {
  if (attempts.length < 10) return 0; // Need sufficient data

  const confidenceScores = {
    low: 1,
    medium: 2,
    high: 3
  };

  let sumXY = 0;
  let sumX = 0;
  let sumY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  const n = attempts.length;

  attempts.forEach(attempt => {
    const x = confidenceScores[attempt.confidence];
    const y = attempt.isCorrect ? 3 : 1; // Convert to similar scale
    
    sumXY += x * y;
    sumX += x;
    sumY += y;
    sumX2 += x * x;
    sumY2 += y * y;
  });

  // Pearson correlation coefficient
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  const correlation = numerator / denominator;
  return Number(correlation.toFixed(2));
}

/**
 * Determine growth trajectory based on recent performance trends
 */
export function determineGrowthTrajectory(attempts: QuestionAttempt[]): 
  'rapid' | 'steady' | 'slow' | 'stagnant' | 'declining' {
  if (attempts.length < 15) return 'steady'; // Not enough data

  // Split into three periods
  const third = Math.floor(attempts.length / 3);
  const period1 = attempts.slice(0, third);
  const period2 = attempts.slice(third, third * 2);
  const period3 = attempts.slice(third * 2);

  const accuracy1 = (period1.filter(a => a.isCorrect).length / period1.length) * 100;
  const accuracy2 = (period2.filter(a => a.isCorrect).length / period2.length) * 100;
  const accuracy3 = (period3.filter(a => a.isCorrect).length / period3.length) * 100;

  const trend1to2 = accuracy2 - accuracy1;
  const trend2to3 = accuracy3 - accuracy2;
  const overallTrend = accuracy3 - accuracy1;

  if (overallTrend > 20) return 'rapid';
  if (overallTrend > 10) return 'steady';
  if (overallTrend > 0) return 'slow';
  if (overallTrend > -10) return 'stagnant';
  return 'declining';
}

/**
 * Determine optimal challenge level based on ZPD principles
 * Target: 70-80% accuracy for optimal learning
 */
export function determineOptimalChallengeLevel(attempts: QuestionAttempt[]): {
  current_difficulty_level: 'below_zpd' | 'in_zpd' | 'above_zpd';
  optimal_challenge_level: 'easy' | 'medium' | 'hard';
  scaffolding_needed: boolean;
} {
  if (attempts.length < 5) {
    return {
      current_difficulty_level: 'in_zpd',
      optimal_challenge_level: 'medium',
      scaffolding_needed: false
    };
  }

  const recentAttempts = attempts.slice(-10);
  const correct = recentAttempts.filter(a => a.isCorrect).length;
  const accuracyRate = (correct / recentAttempts.length) * 100;

  // Also consider hint usage
  const avgHints = recentAttempts.reduce((sum, a) => sum + a.hintsUsed, 0) / recentAttempts.length;

  let current_difficulty_level: 'below_zpd' | 'in_zpd' | 'above_zpd';
  let optimal_challenge_level: 'easy' | 'medium' | 'hard';
  let scaffolding_needed = false;

  if (accuracyRate > 85 && avgHints < 1) {
    current_difficulty_level = 'below_zpd';
    optimal_challenge_level = 'hard';
  } else if (accuracyRate < 50 || avgHints > 2) {
    current_difficulty_level = 'above_zpd';
    optimal_challenge_level = 'easy';
    scaffolding_needed = true;
  } else {
    current_difficulty_level = 'in_zpd';
    optimal_challenge_level = 'medium';
    scaffolding_needed = avgHints > 1.5;
  }

  return {
    current_difficulty_level,
    optimal_challenge_level,
    scaffolding_needed
  };
}

/**
 * Calculate hint usage frequency
 */
export function calculateHintUsageFrequency(attempts: QuestionAttempt[]): number {
  if (attempts.length === 0) return 0;
  
  const totalHints = attempts.reduce((sum, a) => sum + a.hintsUsed, 0);
  return Number((totalHints / attempts.length).toFixed(2));
}

/**
 * Main function to update all dynamic metrics
 */
export function updateDynamicMetrics(
  profile: StudentLearningProfile,
  newAttempts: QuestionAttempt[]
): Partial<StudentLearningProfile> {
  const allAttempts = [...profile.questionHistory, ...newAttempts] as QuestionAttempt[];

  const dynamicMetrics = {
    actual_learning_pace: calculateLearningPace(allAttempts),
    concept_mastery_rate: calculateConceptMasteryRate(allAttempts),
    error_recovery_rate: calculateErrorRecoveryRate(allAttempts),
    question_attempt_ratio: calculateQuestionAttemptRatio(allAttempts),
    time_per_difficulty_level: calculateTimePerDifficulty(allAttempts),
    skip_patterns: profile.dynamicMetrics.skip_patterns, // Keep existing
    strength_topics: identifyStrengthTopics(allAttempts),
    weakness_topics: identifyWeaknessTopics(allAttempts)
  };

  const zpdMetrics = {
    ...determineOptimalChallengeLevel(allAttempts),
    last_zpd_adjustment: new Date()
  };

  const behavioralPatterns = {
    ...profile.behavioralPatterns,
    hint_usage_frequency: calculateHintUsageFrequency(allAttempts),
    confidence_accuracy_correlation: calculateConfidenceAccuracyCorrelation(allAttempts),
    growth_trajectory: determineGrowthTrajectory(allAttempts)
  };

  return {
    dynamicMetrics,
    zpdMetrics,
    behavioralPatterns,
    questionHistory: allAttempts,
    updatedAt: new Date()
  };
}

/**
 * Calculate engagement metrics based on session data
 */
export function calculateEngagementMetrics(
  sessions: { startTime: Date; endTime: Date }[],
  currentMetrics: StudentLearningProfile['engagementMetrics']
): StudentLearningProfile['engagementMetrics'] {
  if (sessions.length === 0) return currentMetrics;

  // Session frequency (sessions per week)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentSessions = sessions.filter(s => new Date(s.startTime) > oneWeekAgo);
  
  // Average session duration
  const totalDuration = sessions.reduce((sum, s) => {
    const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000 / 60;
    return sum + duration;
  }, 0);
  const avgDuration = Math.round(totalDuration / sessions.length);

  // Consecutive days
  const sortedDates = sessions
    .map(s => new Date(s.startTime).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort();
  
  let consecutiveDays = 1;
  let currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const date1 = new Date(sortedDates[i - 1]);
    const date2 = new Date(sortedDates[i]);
    const diffDays = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
      consecutiveDays = Math.max(consecutiveDays, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return {
    session_frequency: recentSessions.length,
    avg_session_duration: avgDuration,
    consecutive_days: consecutiveDays,
    progress_velocity: currentMetrics.progress_velocity, // Calculated separately
    last_activity: new Date()
  };
}

