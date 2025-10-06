/**
 * OCEAN Personality Assessment for Students
 * Scientific 15-question assessment based on Big Five personality traits
 */

export interface OceanQuestion {
  id: string;
  question: string;
  trait: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
  reverse: boolean; // If true, scoring is reversed (for negative statements)
}

/**
 * OCEAN Personality Quiz Questions (15 questions, 3 per trait)
 * Scored on 5-point Likert scale: Strongly Disagree (1) to Strongly Agree (5)
 */
export const oceanQuizQuestions: OceanQuestion[] = [
  // OPENNESS (Creativity, curiosity, openness to new experiences)
  {
    id: 'open_1',
    question: 'I enjoy trying new problem-solving methods, even if they seem unusual.',
    trait: 'openness',
    reverse: false
  },
  {
    id: 'open_2',
    question: 'I prefer learning topics that involve creativity and imagination.',
    trait: 'openness',
    reverse: false
  },
  {
    id: 'open_3',
    question: 'I like sticking to familiar methods rather than exploring new approaches.',
    trait: 'openness',
    reverse: true // Reversed
  },
  
  // CONSCIENTIOUSNESS (Organization, dependability, discipline)
  {
    id: 'cons_1',
    question: 'I complete my homework on time without needing reminders.',
    trait: 'conscientiousness',
    reverse: false
  },
  {
    id: 'cons_2',
    question: 'I keep my study materials organized and plan my study schedule.',
    trait: 'conscientiousness',
    reverse: false
  },
  {
    id: 'cons_3',
    question: 'I often forget to do my assignments or leave them for the last minute.',
    trait: 'conscientiousness',
    reverse: true // Reversed
  },
  
  // EXTRAVERSION (Sociability, assertiveness, enthusiasm)
  {
    id: 'extra_1',
    question: 'I prefer studying in groups rather than studying alone.',
    trait: 'extraversion',
    reverse: false
  },
  {
    id: 'extra_2',
    question: 'I feel energized when discussing ideas with classmates.',
    trait: 'extraversion',
    reverse: false
  },
  {
    id: 'extra_3',
    question: 'I prefer to work quietly by myself rather than in group activities.',
    trait: 'extraversion',
    reverse: true // Reversed
  },
  
  // AGREEABLENESS (Cooperation, compassion, politeness)
  {
    id: 'agree_1',
    question: 'I help classmates who are struggling with difficult concepts.',
    trait: 'agreeableness',
    reverse: false
  },
  {
    id: 'agree_2',
    question: 'I am patient when others take time to understand things.',
    trait: 'agreeableness',
    reverse: false
  },
  {
    id: 'agree_3',
    question: 'I get frustrated when others don\'t understand things as quickly as I do.',
    trait: 'agreeableness',
    reverse: true // Reversed
  },
  
  // NEUROTICISM (Emotional stability - lower score = more stable)
  {
    id: 'neuro_1',
    question: 'I feel anxious before exams, even when I am well-prepared.',
    trait: 'neuroticism',
    reverse: false
  },
  {
    id: 'neuro_2',
    question: 'I worry a lot about making mistakes in my assignments.',
    trait: 'neuroticism',
    reverse: false
  },
  {
    id: 'neuro_3',
    question: 'I stay calm and confident even when facing difficult problems.',
    trait: 'neuroticism',
    reverse: true // Reversed
  },
];

/**
 * Calculate OCEAN scores from quiz responses
 * @param responses Record of question ID to score (1-5)
 * @returns Object with scores for each trait (0-100 scale)
 */
export function calculateOceanScores(
  responses: Record<string, number>
): {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
} {
  const scores: Record<string, number[]> = {
    openness: [],
    conscientiousness: [],
    extraversion: [],
    agreeableness: [],
    neuroticism: []
  };

  // Group scores by trait
  oceanQuizQuestions.forEach(question => {
    const rawScore = responses[question.id] || 3; // Default to neutral
    // Reverse scoring if needed
    const score = question.reverse ? (6 - rawScore) : rawScore;
    scores[question.trait].push(score);
  });

  // Calculate average for each trait and normalize to 0-100 scale
  const normalizeScore = (scores: number[]) => {
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    // Convert from 1-5 scale to 0-100 scale
    return Math.round(((average - 1) / 4) * 100);
  };

  return {
    openness: normalizeScore(scores.openness),
    conscientiousness: normalizeScore(scores.conscientiousness),
    extraversion: normalizeScore(scores.extraversion),
    agreeableness: normalizeScore(scores.agreeableness),
    neuroticism: normalizeScore(scores.neuroticism)
  };
}

/**
 * Derive learning preferences from OCEAN traits
 */
export function deriveLearningPreferences(oceanTraits: {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}): {
  visualLearner: boolean;
  kinestheticLearner: boolean;
  auditoryLearner: boolean;
  readingWritingLearner: boolean;
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  needsStepByStepGuidance: boolean;
  respondsToEncouragement: boolean;
} {
  const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = oceanTraits;

  // Determine primary learning style
  // High openness correlates with visual/creative learning
  // High extraversion correlates with auditory/group learning
  // High conscientiousness correlates with reading/writing
  const visualLearner = openness > 60;
  const auditoryLearner = extraversion > 60;
  const readingWritingLearner = conscientiousness > 60 && openness < 50;
  const kinestheticLearner = openness > 70 && extraversion > 50;

  // Preferred difficulty based on confidence and organization
  let preferredDifficulty: 'easy' | 'medium' | 'hard';
  if (conscientiousness > 70 && neuroticism < 40) {
    preferredDifficulty = 'hard';
  } else if (conscientiousness < 40 || neuroticism > 70) {
    preferredDifficulty = 'easy';
  } else {
    preferredDifficulty = 'medium';
  }

  // Step-by-step guidance needed for low conscientiousness or high neuroticism
  const needsStepByStepGuidance = conscientiousness < 50 || neuroticism > 60;

  // Responds to encouragement if high neuroticism or low confidence
  const respondsToEncouragement = neuroticism > 50 || conscientiousness < 50;

  return {
    visualLearner,
    kinestheticLearner,
    auditoryLearner,
    readingWritingLearner,
    preferredDifficulty,
    needsStepByStepGuidance,
    respondsToEncouragement
  };
}

/**
 * Derive intellectual traits from OCEAN
 */
export function deriveIntellectualTraits(oceanTraits: {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}): {
  analyticalThinking: number;
  creativeThinking: number;
  criticalThinking: number;
  problemSolvingSkill: number;
} {
  const { openness, conscientiousness, extraversion, neuroticism } = oceanTraits;

  return {
    analyticalThinking: Math.round((conscientiousness * 0.6 + (100 - neuroticism) * 0.4)),
    creativeThinking: Math.round((openness * 0.7 + extraversion * 0.3)),
    criticalThinking: Math.round((conscientiousness * 0.5 + openness * 0.3 + (100 - neuroticism) * 0.2)),
    problemSolvingSkill: Math.round((openness * 0.4 + conscientiousness * 0.3 + (100 - neuroticism) * 0.3))
  };
}

/**
 * Get personalized learning style description
 */
export function getLearningStyleDescription(learningPreferences: {
  visualLearner: boolean;
  kinestheticLearner: boolean;
  auditoryLearner: boolean;
  readingWritingLearner: boolean;
}): string {
  if (learningPreferences.visualLearner) {
    return "You're a visual learner who benefits from diagrams, charts, and visual representations. You understand concepts better when you can see them illustrated.";
  } else if (learningPreferences.auditoryLearner) {
    return "You're an auditory learner who understands better through listening and discussion. You benefit from explanations and talking through concepts with others.";
  } else if (learningPreferences.kinestheticLearner) {
    return "You're a hands-on learner who learns best by doing and experimenting. You benefit from practical applications and interactive methods.";
  } else if (learningPreferences.readingWritingLearner) {
    return "You're a reading/writing learner who prefers written explanations and detailed notes. You learn well through reading textbooks and writing summaries.";
  } else {
    return "You have a balanced learning style that adapts well to different teaching methods.";
  }
}




