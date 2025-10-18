/**
 * Choice Metric Calculator
 * 
 * Analyzes student question choices to extract behavioral patterns
 * and psychological insights about learning approach
 */

import { StudentQuestionVariant, StudentLearningProfile } from './db';
import { QuestionAnalysis } from './questionAnalyzer';

export interface ChoiceAnalysisResult {
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  bloomsDistribution: Record<number, number>;
  avoidedQuestions: {
    questionId: string;
    difficulty: string;
    bloomsLevel: number;
    topics: string[];
    possibleReason: 'too_hard' | 'too_easy' | 'unfamiliar_topic' | 'time_consuming' | 'uncertain' | 'abstract_concepts';
    viewCount: number;
    timeSpentViewing: number;
  }[];
  patterns: {
    avoidsHighBloomsLevel: boolean;
    prefersConcrete: boolean;
    riskAverse: boolean;
    challengeSeeker: boolean;
    balancedApproach: boolean;
    strategicDiversity: boolean;
  };
  timeToMakeChoice: number;
  hesitationIndicators: string[];
  decisionConfidence: 'low' | 'medium' | 'high';
  metricScores: {
    confidenceScore: number; // 0-100
    strategicThinking: number; // 0-100
    selfAwareness: number; // 0-100
  };
}

/**
 * Analyze student's question choices
 */
export function analyzeQuestionChoices(
  allVariants: StudentQuestionVariant[],
  chosenVariants: StudentQuestionVariant[],
  masterQuestions: Array<{ id: string; aiAnalysis: QuestionAnalysis }>,
  studentProfile: StudentLearningProfile
): ChoiceAnalysisResult {
  
  const chosenIds = chosenVariants.map(v => v.masterQuestionId);
  const avoidedVariants = allVariants.filter(v => !chosenIds.includes(v.masterQuestionId));
  
  // Get analyses for chosen and avoided
  const chosenAnalyses = chosenVariants.map(v => {
    const master = masterQuestions.find(q => q.id === v.masterQuestionId);
    return master?.aiAnalysis;
  }).filter(Boolean) as QuestionAnalysis[];
  
  const avoidedAnalyses = avoidedVariants.map(v => {
    const master = masterQuestions.find(q => q.id === v.masterQuestionId);
    return { variant: v, analysis: master?.aiAnalysis };
  }).filter(item => item.analysis) as Array<{ variant: StudentQuestionVariant; analysis: QuestionAnalysis }>;
  
  // Calculate distributions
  const difficultyDistribution = calculateDifficultyDistribution(chosenAnalyses);
  const bloomsDistribution = calculateBloomsDistribution(chosenAnalyses);
  
  // Analyze avoided questions
  const avoidedQuestions = analyzeAvoidedQuestions(avoidedAnalyses, studentProfile);
  
  // Identify patterns
  const patterns = identifyChoicePatterns(chosenAnalyses, avoidedAnalyses.map(a => a.analysis), studentProfile);
  
  // Time analysis
  const timeAnalysis = analyzeChoiceTime(allVariants);
  
  // Calculate metric scores
  const metricScores = calculateMetricScores(chosenAnalyses, avoidedAnalyses.map(a => a.analysis), studentProfile);
  
  return {
    difficultyDistribution,
    bloomsDistribution,
    avoidedQuestions,
    patterns,
    timeToMakeChoice: timeAnalysis.totalTime,
    hesitationIndicators: timeAnalysis.hesitations,
    decisionConfidence: timeAnalysis.confidence,
    metricScores
  };
}

/**
 * Calculate difficulty distribution of chosen questions
 */
function calculateDifficultyDistribution(analyses: QuestionAnalysis[]): {
  easy: number;
  medium: number;
  hard: number;
} {
  return analyses.reduce(
    (acc, analysis) => {
      const difficultyScore = analysis.difficultyAnalysis.overallScore;
      if (difficultyScore <= 3) {
        acc.easy++;
      } else if (difficultyScore <= 7) {
        acc.medium++;
      } else {
        acc.hard++;
      }
      return acc;
    },
    { easy: 0, medium: 0, hard: 0 }
  );
}

/**
 * Calculate Bloom's level distribution
 */
function calculateBloomsDistribution(analyses: QuestionAnalysis[]): Record<number, number> {
  return analyses.reduce((acc, analysis) => {
    const bloomsLevel = getBloomsLevelNumber(analysis.bloomTaxonomy.level);
    acc[bloomsLevel] = (acc[bloomsLevel] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
}

// Helper function to convert Bloom's taxonomy level to number
function getBloomsLevelNumber(level: string): number {
  const levelMap: Record<string, number> = {
    'remember': 1,
    'understand': 2,
    'apply': 3,
    'analyze': 4,
    'evaluate': 5,
    'create': 6
  };
  return levelMap[level] || 1;
}

/**
 * Analyze avoided questions to understand why
 */
function analyzeAvoidedQuestions(
  avoidedItems: Array<{ variant: StudentQuestionVariant; analysis: QuestionAnalysis }>,
  profile: StudentLearningProfile
): ChoiceAnalysisResult['avoidedQuestions'] {
  
  return avoidedItems.map(({ variant, analysis }) => {
    const possibleReason = inferAvoidanceReason(analysis, variant, profile);
    
    return {
      questionId: variant.masterQuestionId,
      difficulty: getDifficultyFromScore(analysis.difficultyAnalysis.overallScore),
      bloomsLevel: getBloomsLevelNumber(analysis.bloomTaxonomy.level),
      topics: analysis.concepts,
      possibleReason,
      viewCount: variant.viewCount || 0,
      timeSpentViewing: variant.timeSpentViewing || 0
    };
  });
}

// Helper function to convert difficulty score to string
function getDifficultyFromScore(score: number): string {
  if (score <= 3) return 'easy';
  if (score <= 7) return 'medium';
  return 'hard';
}

/**
 * Infer why a question was avoided
 */
function inferAvoidanceReason(
  analysis: QuestionAnalysis,
  variant: StudentQuestionVariant,
  profile: StudentLearningProfile
): 'too_hard' | 'too_easy' | 'unfamiliar_topic' | 'time_consuming' | 'uncertain' | 'abstract_concepts' {
  
  const difficulty = getDifficultyFromScore(analysis.difficultyAnalysis.overallScore);
  
  // Too hard: High difficulty and student has low ZPD
  if (difficulty === 'hard' && profile.zpdMetrics.optimal_challenge_level === 'easy') {
    return 'too_hard';
  }
  
  // Too easy: Low difficulty and student has high ZPD
  if (difficulty === 'easy' && profile.zpdMetrics.optimal_challenge_level === 'hard') {
    return 'too_easy';
  }
  
  // Abstract concepts: High abstraction and student prefers concrete
  if (analysis.cognitiveComplexity.score >= 7 && profile.onboardingMetrics.cognitive_depth_preference <= 2) {
    return 'abstract_concepts';
  }
  
  // Time consuming: High estimated time
  if (analysis.estimatedTime > 5) { // Convert to minutes
    return 'time_consuming';
  }
  
  // Unfamiliar topic: Check if topic is in weakness list
  const hasWeakness = profile.dynamicMetrics.weakness_topics?.some(w =>
    analysis.concepts.includes(w.topicName)
  );
  if (hasWeakness) {
    return 'unfamiliar_topic';
  }
  
  // Uncertain: Multiple views but not chosen
  if (variant.viewCount > 2) {
    return 'uncertain';
  }
  
  // Default
  return 'uncertain';
}

/**
 * Identify behavioral patterns in choices
 */
function identifyChoicePatterns(
  chosenAnalyses: QuestionAnalysis[],
  avoidedAnalyses: QuestionAnalysis[],
  profile: StudentLearningProfile
): ChoiceAnalysisResult['patterns'] {
  
  // Avoids high Bloom's level
  const avgChosenBlooms = chosenAnalyses.reduce((sum, a) => sum + getBloomsLevelNumber(a.bloomTaxonomy.level), 0) / chosenAnalyses.length;
  const avgAvoidedBlooms = avoidedAnalyses.reduce((sum, a) => sum + getBloomsLevelNumber(a.bloomTaxonomy.level), 0) / avoidedAnalyses.length;
  const avoidsHighBloomsLevel = avgAvoidedBlooms > avgChosenBlooms + 1;
  
  // Prefers concrete
  const avgChosenAbstraction = chosenAnalyses.reduce((sum, a) => sum + a.cognitiveComplexity.score, 0) / chosenAnalyses.length;
  const avgAvoidedAbstraction = avoidedAnalyses.reduce((sum, a) => sum + a.cognitiveComplexity.score, 0) / avoidedAnalyses.length;
  const prefersConcrete = avgAvoidedAbstraction > avgChosenAbstraction + 0.5;
  
  // Risk averse: Mostly easy/medium
  const hardCount = chosenAnalyses.filter(a => getDifficultyFromScore(a.difficultyAnalysis.overallScore) === 'hard').length;
  const riskAverse = hardCount === 0 || (hardCount / chosenAnalyses.length) < 0.2;
  
  // Challenge seeker: Mostly medium/hard
  const easyCount = chosenAnalyses.filter(a => getDifficultyFromScore(a.difficultyAnalysis.overallScore) === 'easy').length;
  const challengeSeeker = (hardCount / chosenAnalyses.length) > 0.4;
  
  // Balanced approach: Good mix of difficulties
  const diffDist = calculateDifficultyDistribution(chosenAnalyses);
  const isBalanced = diffDist.easy > 0 && diffDist.medium > 0 && diffDist.hard > 0;
  const balancedApproach = isBalanced && !riskAverse && !challengeSeeker;
  
  // Strategic diversity: Good topic coverage
  const topicSet = new Set<string>();
  chosenAnalyses.forEach(a => a.concepts.forEach((t: string) => topicSet.add(t)));
  const strategicDiversity = topicSet.size >= Math.min(chosenAnalyses.length, 5);
  
  return {
    avoidsHighBloomsLevel,
    prefersConcrete,
    riskAverse,
    challengeSeeker,
    balancedApproach,
    strategicDiversity
  };
}

/**
 * Analyze time spent making choice
 */
function analyzeChoiceTime(variants: StudentQuestionVariant[]): {
  totalTime: number;
  hesitations: string[];
  confidence: 'low' | 'medium' | 'high';
} {
  const totalTime = variants.reduce((sum, v) => sum + (v.timeSpentViewing || 0), 0);
  const hesitations: string[] = [];
  
  // Identify hesitation patterns
  variants.forEach(v => {
    if (v.viewCount > 3 && !v.wasChosen) {
      hesitations.push(`Viewed question ${v.masterQuestionId} ${v.viewCount} times but didn't choose it`);
    }
    if (v.timeSpentViewing > 60 && !v.wasChosen) {
      hesitations.push(`Spent ${Math.round(v.timeSpentViewing)}s on question ${v.masterQuestionId} but avoided it`);
    }
  });
  
  // Determine confidence based on time and hesitations
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  
  if (totalTime < 60 && hesitations.length === 0) {
    confidence = 'high'; // Quick, decisive
  } else if (totalTime > 300 || hesitations.length > 3) {
    confidence = 'low'; // Slow, many hesitations
  }
  
  return { totalTime, hesitations, confidence };
}

/**
 * Calculate metric scores from choices
 */
function calculateMetricScores(
  chosenAnalyses: QuestionAnalysis[],
  avoidedAnalyses: QuestionAnalysis[],
  profile: StudentLearningProfile
): {
  confidenceScore: number;
  strategicThinking: number;
  selfAwareness: number;
} {
  
  // Confidence score: Based on difficulty of chosen questions
  const difficultyScore = chosenAnalyses.reduce((sum, a) => {
    const difficulty = getDifficultyFromScore(a.difficultyAnalysis.overallScore);
    if (difficulty === 'easy') return sum + 1;
    if (difficulty === 'medium') return sum + 2;
    return sum + 3;
  }, 0);
  const maxDifficultyScore = chosenAnalyses.length * 3;
  const confidenceScore = Math.round((difficultyScore / maxDifficultyScore) * 100);
  
  // Strategic thinking: Balance and diversity
  const diffDist = calculateDifficultyDistribution(chosenAnalyses);
  const hasBalance = diffDist.easy > 0 && diffDist.medium > 0;
  const topicCount = new Set(chosenAnalyses.flatMap(a => a.concepts)).size;
  const hasDiversity = topicCount >= Math.min(chosenAnalyses.length - 1, 4);
  
  let strategicScore = 50; // Base
  if (hasBalance) strategicScore += 25;
  if (hasDiversity) strategicScore += 25;
  
  // Self-awareness: Choosing appropriate difficulty for ZPD
  const optimalLevel = profile.zpdMetrics.optimal_challenge_level;
  const appropriateChoices = chosenAnalyses.filter(a => {
    const difficulty = getDifficultyFromScore(a.difficultyAnalysis.overallScore);
    if (optimalLevel === 'easy') return difficulty === 'easy' || difficulty === 'medium';
    if (optimalLevel === 'hard') return difficulty === 'medium' || difficulty === 'hard';
    return difficulty === 'medium'; // Medium ZPD
  }).length;
  
  const selfAwarenessScore = Math.round((appropriateChoices / chosenAnalyses.length) * 100);
  
  return {
    confidenceScore: Math.min(100, Math.max(0, confidenceScore)),
    strategicThinking: Math.min(100, Math.max(0, strategicScore)),
    selfAwareness: Math.min(100, Math.max(0, selfAwarenessScore))
  };
}

/**
 * Update student learning profile based on choices
 */
export function updateProfileFromChoices(
  profile: StudentLearningProfile,
  choiceAnalysis: ChoiceAnalysisResult
): Partial<StudentLearningProfile> {
  
  const { patterns, metricScores, difficultyDistribution } = choiceAnalysis;
  
  // Determine difficulty preference
  let difficultyPreference: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed';
  if (difficultyDistribution.easy > difficultyDistribution.medium + difficultyDistribution.hard) {
    difficultyPreference = 'easy';
  } else if (difficultyDistribution.hard > difficultyDistribution.easy + difficultyDistribution.medium) {
    difficultyPreference = 'hard';
  } else if (difficultyDistribution.medium > difficultyDistribution.easy + difficultyDistribution.hard) {
    difficultyPreference = 'medium';
  }
  
  // Calculate average Bloom's level from chosen questions
  const avgBloomsLevel = Object.entries(choiceAnalysis.bloomsDistribution)
    .reduce((sum, [level, count]) => sum + (parseInt(level) * count), 0) /
    Object.values(choiceAnalysis.bloomsDistribution).reduce((a, b) => a + b, 0);
  
  // Update topic avoidance patterns
  const topicAvoidanceMap = new Map<string, number>();
  choiceAnalysis.avoidedQuestions.forEach(q => {
    q.topics.forEach(topic => {
      topicAvoidanceMap.set(topic, (topicAvoidanceMap.get(topic) || 0) + 1);
    });
  });
  
  const topicAvoidancePatterns = Array.from(topicAvoidanceMap.entries())
    .filter(([_, count]) => count >= 2) // Avoided at least twice
    .map(([topicName, timesAvoided]) => ({
      topicId: topicName.toLowerCase().replace(/\s+/g, '_'),
      topicName,
      timesAvoided,
      possibleAnxiety: timesAvoided >= 3,
      needsIntervention: timesAvoided >= 3 && patterns.riskAverse
    }));
  
  return {
    behavioralPatterns: {
      ...profile.behavioralPatterns,
      questionSelectionPatterns: {
        difficultyPreference,
        bloomsLevelComfort: Math.round(avgBloomsLevel),
        avoidsAbstractConcepts: patterns.prefersConcrete,
        challengeAcceptance: metricScores.confidenceScore,
        strategicSelection: metricScores.strategicThinking,
        decisionMakingSpeed: choiceAnalysis.timeToMakeChoice,
        choiceConfidence: metricScores.confidenceScore
      }
    },
    dynamicMetrics: {
      ...profile.dynamicMetrics,
      topicAvoidancePatterns
    },
    updatedAt: new Date()
  };
}

/**
 * Generate insights for teacher
 */
export function generateTeacherInsights(
  choiceAnalysis: ChoiceAnalysisResult,
  studentName: string
): string[] {
  const insights: string[] = [];
  const { patterns, metricScores, avoidedQuestions } = choiceAnalysis;
  
  // Confidence insights
  if (metricScores.confidenceScore < 40) {
    insights.push(`${studentName} shows low confidence - consistently avoids challenging questions`);
  } else if (metricScores.confidenceScore > 80) {
    insights.push(`${studentName} demonstrates high confidence - seeks challenging problems`);
  }
  
  // Strategic thinking
  if (metricScores.strategicThinking < 50) {
    insights.push(`${studentName} may benefit from guidance on strategic question selection`);
  } else if (metricScores.strategicThinking > 75) {
    insights.push(`${studentName} shows excellent strategic thinking in question selection`);
  }
  
  // Self-awareness
  if (metricScores.selfAwareness < 50) {
    insights.push(`${studentName}'s choices don't match their ability level - may need counseling`);
  }
  
  // Pattern insights
  if (patterns.riskAverse) {
    insights.push(`${studentName} is risk-averse - needs encouragement to tackle harder problems`);
  }
  
  if (patterns.avoidsHighBloomsLevel) {
    insights.push(`${studentName} avoids higher-order thinking questions - focus on building analysis skills`);
  }
  
  if (patterns.prefersConcrete) {
    insights.push(`${studentName} prefers concrete problems - gradually introduce abstract concepts`);
  }
  
  // Topic avoidance
  const frequentlyAvoided = avoidedQuestions
    .filter(q => q.viewCount > 2)
    .map(q => q.topics[0])
    .filter(Boolean);
  
  if (frequentlyAvoided.length > 0) {
    insights.push(`${studentName} shows anxiety around: ${frequentlyAvoided.slice(0, 3).join(', ')}`);
  }
  
  // Decision confidence
  if (choiceAnalysis.decisionConfidence === 'low') {
    insights.push(`${studentName} took a long time to decide - may lack confidence in assessment`);
  }
  
  return insights;
}

/**
 * Calculate choice quality score (0-100)
 */
export function calculateChoiceQualityScore(choiceAnalysis: ChoiceAnalysisResult): number {
  const { metricScores } = choiceAnalysis;
  
  // Weighted average
  const score = (
    metricScores.confidenceScore * 0.3 +
    metricScores.strategicThinking * 0.4 +
    metricScores.selfAwareness * 0.3
  );
  
  return Math.round(score);
}

