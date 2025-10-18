/**
 * Enhanced Learning Style Adaptation System
 * Advanced personalization based on OCEAN traits and learning preferences
 */

import { generateAIResponse } from './gemini-service';
import { StudentProfile } from './db';

export interface LearningStyleProfile {
  primaryStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  secondaryStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | null;
  cognitivePreferences: {
    informationProcessing: 'sequential' | 'global' | 'balanced';
    reasoningStyle: 'analytical' | 'intuitive' | 'balanced';
    problemSolving: 'systematic' | 'creative' | 'balanced';
    attentionSpan: 'focused' | 'distributed' | 'balanced';
  };
  engagementFactors: {
    motivationType: 'intrinsic' | 'extrinsic' | 'mixed';
    challengePreference: 'low' | 'medium' | 'high';
    socialInteraction: 'individual' | 'collaborative' | 'mixed';
    feedbackStyle: 'immediate' | 'delayed' | 'mixed';
  };
  adaptationStrategies: {
    contentPresentation: string[];
    interactionMethods: string[];
    assessmentApproaches: string[];
    supportMechanisms: string[];
  };
}

export interface PersonalizedQuestion {
  originalQuestion: string;
  adaptedQuestion: string;
  adaptations: {
    visualAids: string[];
    interactiveElements: string[];
    scaffolding: string[];
    motivationElements: string[];
  };
  learningStyleAlignment: {
    primaryStyle: number; // 0-1 alignment score
    secondaryStyle: number;
    cognitiveFit: number;
    engagementFit: number;
  };
  estimatedEngagement: number; // 0-1 score
  difficultyAdjustment: number; // -2 to +2 adjustment
}

export interface AdaptationRequest {
  question: string;
  studentProfile: StudentProfile;
  subject: string;
  topic: string;
  grade: string;
  targetDifficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Analyze student's learning style from OCEAN traits and preferences
 */
export function analyzeLearningStyle(studentProfile: StudentProfile): LearningStyleProfile {
  const oceanTraits = studentProfile.oceanTraits || {
    openness: 50,
    conscientiousness: 50,
    extraversion: 50,
    agreeableness: 50,
    neuroticism: 50
  };
  
  const learningPrefs = studentProfile.learningPreferences || {
    visualLearner: true,
    kinestheticLearner: false,
    auditoryLearner: false,
    readingWritingLearner: false,
    preferredDifficulty: 'medium',
    needsStepByStepGuidance: false,
    respondsToEncouragement: true
  };
  
  // Determine primary learning style
  const styleScores = {
    visual: learningPrefs.visualLearner ? 1 : 0,
    auditory: learningPrefs.auditoryLearner ? 1 : 0,
    kinesthetic: learningPrefs.kinestheticLearner ? 1 : 0,
    reading_writing: learningPrefs.readingWritingLearner ? 1 : 0
  };
  
  // Adjust scores based on OCEAN traits
  if (oceanTraits.openness > 60) {
    styleScores.visual += 0.3;
    styleScores.kinesthetic += 0.2;
  }
  if (oceanTraits.conscientiousness > 60) {
    styleScores.reading_writing += 0.3;
  }
  if (oceanTraits.extraversion > 60) {
    styleScores.auditory += 0.3;
  }
  
  const primaryStyle = Object.keys(styleScores).reduce((a, b) => 
    styleScores[a as keyof typeof styleScores] > styleScores[b as keyof typeof styleScores] ? a : b
  ) as 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  
  // Determine secondary style
  const sortedStyles = Object.entries(styleScores)
    .sort(([,a], [,b]) => b - a)
    .map(([style]) => style);
  const secondaryStyle = sortedStyles[1] !== primaryStyle ? sortedStyles[1] as any : null;
  
  // Analyze cognitive preferences
  const cognitivePreferences = {
    informationProcessing: (oceanTraits.conscientiousness > 60 ? 'sequential' : 
                          oceanTraits.openness > 60 ? 'global' : 'balanced') as 'sequential' | 'global' | 'balanced',
    reasoningStyle: (oceanTraits.openness > 60 ? 'intuitive' : 
                   oceanTraits.conscientiousness > 60 ? 'analytical' : 'balanced') as 'analytical' | 'intuitive' | 'balanced',
    problemSolving: (oceanTraits.openness > 60 ? 'creative' : 
                   oceanTraits.conscientiousness > 60 ? 'systematic' : 'balanced') as 'systematic' | 'creative' | 'balanced',
    attentionSpan: (oceanTraits.conscientiousness > 60 ? 'focused' : 
                  oceanTraits.extraversion > 60 ? 'distributed' : 'balanced') as 'focused' | 'distributed' | 'balanced'
  };
  
  // Analyze engagement factors
  const engagementFactors = {
    motivationType: (oceanTraits.agreeableness > 60 ? 'extrinsic' : 
                   oceanTraits.openness > 60 ? 'intrinsic' : 'mixed') as 'intrinsic' | 'extrinsic' | 'mixed',
    challengePreference: (learningPrefs.preferredDifficulty === 'easy' ? 'low' :
                        learningPrefs.preferredDifficulty === 'hard' ? 'high' : 'medium') as 'low' | 'medium' | 'high',
    socialInteraction: (oceanTraits.extraversion > 60 ? 'collaborative' : 
                      oceanTraits.extraversion < 40 ? 'individual' : 'mixed') as 'individual' | 'collaborative' | 'mixed',
    feedbackStyle: (learningPrefs.respondsToEncouragement ? 'immediate' : 'delayed') as 'immediate' | 'delayed' | 'mixed'
  };
  
  // Generate adaptation strategies
  const adaptationStrategies = generateAdaptationStrategies(
    primaryStyle, 
    cognitivePreferences, 
    engagementFactors
  );
  
  return {
    primaryStyle,
    secondaryStyle,
    cognitivePreferences,
    engagementFactors,
    adaptationStrategies
  };
}

/**
 * Generate adaptation strategies based on learning style
 */
function generateAdaptationStrategies(
  primaryStyle: string,
  cognitivePreferences: any,
  engagementFactors: any
): {
  contentPresentation: string[];
  interactionMethods: string[];
  assessmentApproaches: string[];
  supportMechanisms: string[];
} {
  const strategies = {
    contentPresentation: [] as string[],
    interactionMethods: [] as string[],
    assessmentApproaches: [] as string[],
    supportMechanisms: [] as string[]
  };
  
  // Content presentation strategies
  switch (primaryStyle) {
    case 'visual':
      strategies.contentPresentation.push(
        'Include diagrams and visual representations',
        'Use color coding for different concepts',
        'Provide flowcharts and mind maps',
        'Include relevant images and illustrations'
      );
      break;
    case 'auditory':
      strategies.contentPresentation.push(
        'Include audio explanations',
        'Use verbal descriptions and storytelling',
        'Provide discussion prompts',
        'Include sound effects for engagement'
      );
      break;
    case 'kinesthetic':
      strategies.contentPresentation.push(
        'Include hands-on activities',
        'Provide interactive simulations',
        'Use manipulatives and physical objects',
        'Include movement-based learning'
      );
      break;
    case 'reading_writing':
      strategies.contentPresentation.push(
        'Provide detailed written explanations',
        'Include note-taking opportunities',
        'Use structured text formats',
        'Provide reading materials and references'
      );
      break;
  }
  
  // Interaction methods
  if (engagementFactors.socialInteraction === 'collaborative') {
    strategies.interactionMethods.push(
      'Group discussions and peer learning',
      'Collaborative problem solving',
      'Peer review and feedback'
    );
  } else if (engagementFactors.socialInteraction === 'individual') {
    strategies.interactionMethods.push(
      'Independent study and reflection',
      'Self-paced learning modules',
      'Personal goal setting'
    );
  } else {
    strategies.interactionMethods.push(
      'Mixed individual and group activities',
      'Flexible collaboration options'
    );
  }
  
  // Assessment approaches
  if (cognitivePreferences.reasoningStyle === 'analytical') {
    strategies.assessmentApproaches.push(
      'Step-by-step problem solving',
      'Detailed explanations required',
      'Process-focused evaluation'
    );
  } else if (cognitivePreferences.reasoningStyle === 'intuitive') {
    strategies.assessmentApproaches.push(
      'Creative and open-ended questions',
      'Multiple solution approaches',
      'Innovation and creativity valued'
    );
  }
  
  // Support mechanisms
  if (engagementFactors.feedbackStyle === 'immediate') {
    strategies.supportMechanisms.push(
      'Real-time feedback and hints',
      'Immediate progress indicators',
      'Instant gratification elements'
    );
  }
  
  if (cognitivePreferences.attentionSpan === 'focused') {
    strategies.supportMechanisms.push(
      'Extended time for deep work',
      'Minimal distractions',
      'Focused study sessions'
    );
  } else if (cognitivePreferences.attentionSpan === 'distributed') {
    strategies.supportMechanisms.push(
      'Frequent breaks and variety',
      'Multiple short activities',
      'Dynamic content changes'
    );
  }
  
  return strategies;
}

/**
 * Adapt a question to match student's learning style
 */
export async function adaptQuestionToLearningStyle(request: AdaptationRequest): Promise<PersonalizedQuestion> {
  try {
    const learningStyle = analyzeLearningStyle(request.studentProfile);
    const prompt = createAdaptationPrompt(request, learningStyle);
    const aiResponse = await generateAIResponse(prompt);
    
    const adaptation = parseAdaptationResponse(aiResponse, request.question);
    
    // Calculate alignment scores
    const alignmentScores = calculateAlignmentScores(adaptation, learningStyle);
    
    return {
      originalQuestion: request.question,
      adaptedQuestion: adaptation.adaptedQuestion,
      adaptations: adaptation.adaptations,
      learningStyleAlignment: alignmentScores,
      estimatedEngagement: calculateEngagementScore(adaptation, learningStyle),
      difficultyAdjustment: calculateDifficultyAdjustment(request, learningStyle)
    };
    
  } catch (error) {
    console.error('Question adaptation error:', error);
    return generateFallbackAdaptation(request);
  }
}

/**
 * Create prompt for AI-powered question adaptation
 */
function createAdaptationPrompt(request: AdaptationRequest, learningStyle: LearningStyleProfile): string {
  return `
You are an expert educational psychologist specializing in learning style adaptation. Adapt the following question to match the student's learning profile.

**Original Question:**
"${request.question}"

**Student Learning Profile:**
- Primary Learning Style: ${learningStyle.primaryStyle}
- Secondary Learning Style: ${learningStyle.secondaryStyle || 'none'}
- Information Processing: ${learningStyle.cognitivePreferences.informationProcessing}
- Reasoning Style: ${learningStyle.cognitivePreferences.reasoningStyle}
- Problem Solving: ${learningStyle.cognitivePreferences.problemSolving}
- Motivation Type: ${learningStyle.engagementFactors.motivationType}
- Challenge Preference: ${learningStyle.engagementFactors.challengePreference}
- Social Interaction: ${learningStyle.engagementFactors.socialInteraction}

**Subject:** ${request.subject}
**Topic:** ${request.topic}
**Grade:** ${request.grade}
**Target Difficulty:** ${request.targetDifficulty}

**Adaptation Requirements:**
1. Maintain the core learning objective
2. Adapt presentation to match primary learning style
3. Include elements for secondary learning style if applicable
4. Adjust difficulty based on challenge preference
5. Incorporate appropriate interaction methods
6. Add motivational elements
7. Provide necessary scaffolding

**Return ONLY valid JSON in this format:**
{
  "adaptedQuestion": "The adapted question text with all modifications",
  "adaptations": {
    "visualAids": ["Diagram of the process", "Color-coded steps", "Flowchart"],
    "interactiveElements": ["Drag and drop activity", "Interactive simulation"],
    "scaffolding": ["Step-by-step guide", "Hints and tips", "Example problems"],
    "motivationElements": ["Real-world connection", "Achievement badges", "Progress tracking"]
  }
}

**Guidelines:**
- Make adaptations meaningful and educationally sound
- Ensure the adapted question is still challenging but accessible
- Include specific, actionable adaptation elements
- Maintain academic rigor while improving engagement
`;
}

/**
 * Parse AI adaptation response
 */
function parseAdaptationResponse(response: string, originalQuestion: string): {
  adaptedQuestion: string;
  adaptations: {
    visualAids: string[];
    interactiveElements: string[];
    scaffolding: string[];
    motivationElements: string[];
  };
} {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const adaptation = JSON.parse(jsonMatch[0]);
    
    return {
      adaptedQuestion: adaptation.adaptedQuestion || originalQuestion,
      adaptations: {
        visualAids: Array.isArray(adaptation.adaptations?.visualAids) ? adaptation.adaptations.visualAids : [],
        interactiveElements: Array.isArray(adaptation.adaptations?.interactiveElements) ? adaptation.adaptations.interactiveElements : [],
        scaffolding: Array.isArray(adaptation.adaptations?.scaffolding) ? adaptation.adaptations.scaffolding : [],
        motivationElements: Array.isArray(adaptation.adaptations?.motivationElements) ? adaptation.adaptations.motivationElements : []
      }
    };
    
  } catch (error) {
    console.error('Error parsing adaptation response:', error);
    return {
      adaptedQuestion: originalQuestion,
      adaptations: {
        visualAids: [],
        interactiveElements: [],
        scaffolding: [],
        motivationElements: []
      }
    };
  }
}

/**
 * Calculate alignment scores between adaptation and learning style
 */
function calculateAlignmentScores(adaptation: any, learningStyle: LearningStyleProfile): {
  primaryStyle: number;
  secondaryStyle: number;
  cognitiveFit: number;
  engagementFit: number;
} {
  // Primary style alignment
  let primaryStyleScore = 0;
  const adaptations = adaptation.adaptations;
  
  if (learningStyle.primaryStyle === 'visual' && adaptations.visualAids.length > 0) {
    primaryStyleScore = 0.8;
  } else if (learningStyle.primaryStyle === 'kinesthetic' && adaptations.interactiveElements.length > 0) {
    primaryStyleScore = 0.8;
  } else if (learningStyle.primaryStyle === 'auditory' && adaptations.motivationElements.some((el: string) => el.includes('discussion'))) {
    primaryStyleScore = 0.8;
  } else if (learningStyle.primaryStyle === 'reading_writing' && adaptations.scaffolding.length > 0) {
    primaryStyleScore = 0.8;
  } else {
    primaryStyleScore = 0.5; // Default moderate alignment
  }
  
  // Secondary style alignment
  let secondaryStyleScore = 0;
  if (learningStyle.secondaryStyle) {
    if (learningStyle.secondaryStyle === 'visual' && adaptations.visualAids.length > 0) {
      secondaryStyleScore = 0.6;
    } else if (learningStyle.secondaryStyle === 'kinesthetic' && adaptations.interactiveElements.length > 0) {
      secondaryStyleScore = 0.6;
    } else {
      secondaryStyleScore = 0.3;
    }
  }
  
  // Cognitive fit
  const cognitiveFit = 0.7; // Default good fit
  
  // Engagement fit
  const engagementFit = adaptations.motivationElements.length > 0 ? 0.8 : 0.5;
  
  return {
    primaryStyle: primaryStyleScore,
    secondaryStyle: secondaryStyleScore,
    cognitiveFit,
    engagementFit
  };
}

/**
 * Calculate engagement score
 */
function calculateEngagementScore(adaptation: any, learningStyle: LearningStyleProfile): number {
  let score = 0.5; // Base score
  
  // Add points for style alignment
  if (learningStyle.primaryStyle === 'visual' && adaptation.adaptations.visualAids.length > 0) {
    score += 0.2;
  }
  if (learningStyle.primaryStyle === 'kinesthetic' && adaptation.adaptations.interactiveElements.length > 0) {
    score += 0.2;
  }
  
  // Add points for motivational elements
  if (adaptation.adaptations.motivationElements.length > 0) {
    score += 0.2;
  }
  
  // Add points for scaffolding
  if (adaptation.adaptations.scaffolding.length > 0) {
    score += 0.1;
  }
  
  return Math.min(1, score);
}

/**
 * Calculate difficulty adjustment
 */
function calculateDifficultyAdjustment(request: AdaptationRequest, learningStyle: LearningStyleProfile): number {
  let adjustment = 0;
  
  // Adjust based on challenge preference
  if (learningStyle.engagementFactors.challengePreference === 'low') {
    adjustment -= 1;
  } else if (learningStyle.engagementFactors.challengePreference === 'high') {
    adjustment += 1;
  }
  
  // Adjust based on cognitive preferences
  if (learningStyle.cognitivePreferences.problemSolving === 'systematic') {
    adjustment -= 0.5; // Make it more structured
  } else if (learningStyle.cognitivePreferences.problemSolving === 'creative') {
    adjustment += 0.5; // Make it more open-ended
  }
  
  return Math.max(-2, Math.min(2, adjustment));
}

/**
 * Generate fallback adaptation when AI fails
 */
function generateFallbackAdaptation(request: AdaptationRequest): PersonalizedQuestion {
  const learningStyle = analyzeLearningStyle(request.studentProfile);
  
  return {
    originalQuestion: request.question,
    adaptedQuestion: request.question,
    adaptations: {
      visualAids: learningStyle.primaryStyle === 'visual' ? ['Add relevant diagrams'] : [],
      interactiveElements: learningStyle.primaryStyle === 'kinesthetic' ? ['Include hands-on activity'] : [],
      scaffolding: learningStyle.cognitivePreferences.informationProcessing === 'sequential' ? ['Provide step-by-step guide'] : [],
      motivationElements: ['Connect to real-world applications']
    },
    learningStyleAlignment: {
      primaryStyle: 0.5,
      secondaryStyle: 0.3,
      cognitiveFit: 0.6,
      engagementFit: 0.5
    },
    estimatedEngagement: 0.6,
    difficultyAdjustment: 0
  };
}

/**
 * Batch adapt multiple questions
 */
export async function adaptQuestionsBatch(requests: AdaptationRequest[]): Promise<PersonalizedQuestion[]> {
  const adaptations = await Promise.allSettled(
    requests.map(request => adaptQuestionToLearningStyle(request))
  );
  
  return adaptations.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Failed to adapt question ${index + 1}:`, result.reason);
      return generateFallbackAdaptation(requests[index]);
    }
  });
}

/**
 * Get learning style recommendations for teachers
 */
export function getLearningStyleRecommendations(learningStyle: LearningStyleProfile): {
  teachingStrategies: string[];
  assessmentMethods: string[];
  classroomManagement: string[];
  studentSupport: string[];
} {
  return {
    teachingStrategies: learningStyle.adaptationStrategies.contentPresentation,
    assessmentMethods: learningStyle.adaptationStrategies.assessmentApproaches,
    classroomManagement: learningStyle.adaptationStrategies.interactionMethods,
    studentSupport: learningStyle.adaptationStrategies.supportMechanisms
  };
}
