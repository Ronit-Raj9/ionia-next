/**
 * Learning Assessment Questions for Adaptive Learning System
 * 
 * Research Foundation:
 * - Bloom's Taxonomy: Cognitive depth classification
 * - Zone of Proximal Development (Vygotsky): Optimal challenge level
 * - Self-Determination Theory: Motivation and engagement
 * - Metacognition Research: Self-awareness in learning
 * - Growth Mindset (Dweck): Response to challenges
 */

export interface LearningAssessmentQuestion {
  id: string;
  question: string;
  description?: string;
  type: 'single_choice' | 'multi_choice' | 'ranking';
  options: {
    value: number | string;
    label: string;
    description?: string;
    emoji?: string;
  }[];
  metric: string;
  researchBasis: string;
}

/**
 * 5 Core Onboarding Questions
 * Maximum 5 questions to minimize friction during onboarding
 */
export const learningAssessmentQuestions: LearningAssessmentQuestion[] = [
  // Question 1: Cognitive Depth Preference (Bloom's Taxonomy)
  {
    id: 'cognitive_depth',
    question: 'When learning a new topic in your favorite subject, what do you enjoy most?',
    description: 'This helps us understand how deeply you like to explore concepts',
    type: 'single_choice',
    options: [
      {
        value: 1,
        label: 'Memorizing the main points and moving on',
        description: 'Quick learning, focus on facts',
        emoji: '📝'
      },
      {
        value: 2,
        label: 'Understanding the basic idea with examples',
        description: 'Grasp the concept with practical examples',
        emoji: '💡'
      },
      {
        value: 3,
        label: 'Understanding why things work the way they do',
        description: 'Deep dive into reasoning and logic',
        emoji: '🤔'
      },
      {
        value: 4,
        label: 'Connecting it to other things I\'ve learned',
        description: 'Making connections across concepts',
        emoji: '🔗'
      },
      {
        value: 5,
        label: 'Finding new ways to use what I learned',
        description: 'Creative application and innovation',
        emoji: '🎨'
      }
    ],
    metric: 'cognitive_depth_preference',
    researchBasis: 'Bloom\'s Taxonomy - measures preferred cognitive complexity level from Remember (1) to Create (5)'
  },

  // Question 2: Challenge Resilience (Growth Mindset + Self-Regulation)
  {
    id: 'challenge_response',
    question: 'When you get a difficult question wrong, what do you usually do?',
    description: 'This tells us about your approach to challenges',
    type: 'single_choice',
    options: [
      {
        value: 1,
        label: 'Skip it and move to the next one',
        description: 'Prefer to avoid difficult problems',
        emoji: '⏭️'
      },
      {
        value: 2,
        label: 'Feel frustrated and need a break',
        description: 'Need time to process challenges',
        emoji: '😓'
      },
      {
        value: 3,
        label: 'Try one more time before moving on',
        description: 'Give it another shot, then move forward',
        emoji: '🔄'
      },
      {
        value: 4,
        label: 'Keep trying different approaches',
        description: 'Persistent problem-solving',
        emoji: '💪'
      },
      {
        value: 5,
        label: 'Get excited to figure it out',
        description: 'Challenge enthusiast',
        emoji: '🎯'
      }
    ],
    metric: 'challenge_resilience',
    researchBasis: 'Growth Mindset Theory (Dweck) - measures persistence, self-regulation, and response to failure'
  },

  // Question 3: Subject Interest Discovery (Multi-select)
  {
    id: 'subject_affinity',
    question: 'Which activities make you lose track of time? (Select all that apply)',
    description: 'Your interests help us personalize content',
    type: 'multi_choice',
    options: [
      { value: 'math', label: 'Solving puzzles or math problems', emoji: '🧮' },
      { value: 'language', label: 'Reading stories or writing', emoji: '📚' },
      { value: 'science', label: 'Doing experiments or learning how things work', emoji: '🔬' },
      { value: 'social_studies', label: 'Learning about history, people, and cultures', emoji: '🌍' },
      { value: 'arts', label: 'Drawing, designing, or creating art', emoji: '🎨' },
      { value: 'technology', label: 'Playing with gadgets or coding', emoji: '💻' },
      { value: 'physical', label: 'Sports, building things, or hands-on activities', emoji: '🏃' },
      { value: 'music', label: 'Playing music or listening to songs', emoji: '🎵' }
    ],
    metric: 'subject_affinity_map',
    researchBasis: 'Self-Determination Theory - intrinsic motivation through interest alignment'
  },

  // Question 4: Learning Pace Self-Assessment (Metacognition)
  {
    id: 'learning_pace',
    question: 'When your teacher starts a new chapter, how quickly do you usually understand it?',
    description: 'This helps us pace the content just right for you',
    type: 'single_choice',
    options: [
      {
        value: 1,
        label: 'I need the teacher to explain multiple times',
        description: 'Slower, thorough learning pace',
        emoji: '🐢'
      },
      {
        value: 2,
        label: 'I need to read it 2-3 times at home',
        description: 'Need extra practice time',
        emoji: '📖'
      },
      {
        value: 3,
        label: 'I understand after one good explanation',
        description: 'Average learning pace',
        emoji: '👍'
      },
      {
        value: 4,
        label: 'I get it quickly and can help others',
        description: 'Fast learner, can teach peers',
        emoji: '⚡'
      },
      {
        value: 5,
        label: 'I often understand before the teacher finishes',
        description: 'Very fast learner, needs challenges',
        emoji: '🚀'
      }
    ],
    metric: 'learning_pace_self_assessment',
    researchBasis: 'Metacognition Research - self-awareness of learning speed for ZPD calibration'
  },

  // Question 5: Help-Seeking Behavior (Collaborative Learning)
  {
    id: 'help_seeking',
    question: 'When you don\'t understand something in class, what do you usually do?',
    description: 'This helps us provide the right support at the right time',
    type: 'single_choice',
    options: [
      {
        value: 1,
        label: 'Wait and hope it makes sense later',
        description: 'Passive approach, needs prompting',
        emoji: '🤞'
      },
      {
        value: 2,
        label: 'Ask my friends after class',
        description: 'Peer-dependent learning',
        emoji: '👥'
      },
      {
        value: 3,
        label: 'Try to figure it out myself first',
        description: 'Self-directed with eventual help-seeking',
        emoji: '🤓'
      },
      {
        value: 4,
        label: 'Raise my hand to ask the teacher',
        description: 'Proactive help-seeking',
        emoji: '✋'
      },
      {
        value: 5,
        label: 'Ask questions right away without hesitation',
        description: 'Highly engaged, clarifies immediately',
        emoji: '💬'
      }
    ],
    metric: 'help_seeking_tendency',
    researchBasis: 'Collaborative Learning Theory - identifies need for scaffolding and intervention timing'
  }
];

/**
 * Calculate initial metrics from onboarding responses
 */
export function calculateOnboardingMetrics(responses: Record<string, number | string[]>) {
  const metrics: any = {
    cognitive_depth_preference: responses.cognitive_depth as number || 3,
    challenge_resilience: responses.challenge_response as number || 3,
    learning_pace_self_assessment: responses.learning_pace as number || 3,
    help_seeking_tendency: responses.help_seeking as number || 3,
    subject_affinity_map: {
      math: 0,
      science: 0,
      language: 0,
      social_studies: 0,
      arts: 0,
      technology: 0,
      other: {}
    },
    assessed_at: new Date()
  };

  // Process subject affinity (multi-select)
  if (Array.isArray(responses.subject_affinity)) {
    const selectedSubjects = responses.subject_affinity as string[];
    const baseScore = 10; // Max score for selected subjects
    const distributedScore = baseScore / selectedSubjects.length;

    selectedSubjects.forEach(subject => {
      if (subject in metrics.subject_affinity_map) {
        metrics.subject_affinity_map[subject] = Math.round(distributedScore);
      } else {
        metrics.subject_affinity_map.other[subject] = Math.round(distributedScore);
      }
    });
  }

  return metrics;
}

/**
 * Generate initial dynamic metrics based on onboarding
 */
export function generateInitialDynamicMetrics(onboardingMetrics: any) {
  return {
    actual_learning_pace: onboardingMetrics.learning_pace_self_assessment * 2, // Scale to 1-10
    concept_mastery_rate: 0, // Will be calculated from question attempts
    error_recovery_rate: 50, // Neutral starting point
    question_attempt_ratio: 1.0, // Assume full attempt initially
    time_per_difficulty_level: {
      easy: 60, // seconds
      medium: 120,
      hard: 180
    },
    skip_patterns: [],
    strength_topics: [],
    weakness_topics: []
  };
}

/**
 * Determine initial ZPD metrics
 */
export function calculateInitialZPDMetrics(onboardingMetrics: any) {
  const { cognitive_depth_preference, challenge_resilience, learning_pace_self_assessment } = onboardingMetrics;
  
  // Calculate optimal challenge level
  let optimalLevel: 'easy' | 'medium' | 'hard' = 'medium';
  
  const avgScore = (cognitive_depth_preference + challenge_resilience + learning_pace_self_assessment) / 3;
  
  if (avgScore <= 2) {
    optimalLevel = 'easy';
  } else if (avgScore >= 4) {
    optimalLevel = 'hard';
  }

  return {
    current_difficulty_level: 'in_zpd' as const,
    optimal_challenge_level: optimalLevel,
    scaffolding_needed: challenge_resilience <= 2 || learning_pace_self_assessment <= 2,
    last_zpd_adjustment: new Date()
  };
}

/**
 * Generate learning style insights
 */
export function generateLearningInsights(onboardingMetrics: any) {
  const insights: string[] = [];

  // Cognitive depth insights
  if (onboardingMetrics.cognitive_depth_preference >= 4) {
    insights.push('Prefers deep, analytical learning with connections between concepts');
  } else if (onboardingMetrics.cognitive_depth_preference <= 2) {
    insights.push('Prefers concrete, fact-based learning with clear examples');
  }

  // Challenge resilience insights
  if (onboardingMetrics.challenge_resilience >= 4) {
    insights.push('High persistence when facing challenges - can handle difficult problems');
  } else if (onboardingMetrics.challenge_resilience <= 2) {
    insights.push('Needs encouragement and scaffolding when facing difficult problems');
  }

  // Learning pace insights
  if (onboardingMetrics.learning_pace_self_assessment >= 4) {
    insights.push('Fast learner - needs advanced content and challenges');
  } else if (onboardingMetrics.learning_pace_self_assessment <= 2) {
    insights.push('Learns best with repetition and multiple explanations');
  }

  // Help-seeking insights
  if (onboardingMetrics.help_seeking_tendency >= 4) {
    insights.push('Proactive learner - asks questions and seeks clarification');
  } else if (onboardingMetrics.help_seeking_tendency <= 2) {
    insights.push('May need prompting to ask for help - benefits from automatic hints');
  }

  return insights;
}

/**
 * Recommend starting difficulty based on onboarding
 */
export function recommendStartingDifficulty(onboardingMetrics: any): 'easy' | 'medium' | 'hard' {
  const compositeScore = (
    onboardingMetrics.cognitive_depth_preference +
    onboardingMetrics.challenge_resilience +
    onboardingMetrics.learning_pace_self_assessment
  ) / 3;

  if (compositeScore >= 4) return 'hard';
  if (compositeScore >= 2.5) return 'medium';
  return 'easy';
}

/**
 * Recommend starting Bloom's level
 */
export function recommendStartingBloomsLevel(onboardingMetrics: any): number {
  // Map cognitive depth preference to Bloom's level
  return Math.min(6, Math.max(1, onboardingMetrics.cognitive_depth_preference + 1));
}

