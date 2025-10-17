/**
 * Question Personalizer
 * 
 * Generates personalized variants of master questions based on
 * student learning profiles using AI
 */

import { generateAIResponse } from './gemini-service';
import { StudentLearningProfile } from './db';
import { QuestionAnalysisResult } from './questionAnalyzer';

export interface PersonalizedQuestionResult {
  questionText: string;
  questionType: string;
  options?: string[];
  hints?: string[];
  scaffolding?: {
    enabled: boolean;
    stepByStepGuidance: string[];
    visualAids?: string[];
    examples?: string[];
    formulaSheet?: string[];
  };
  simplifiedLanguage?: boolean;
  additionalContext?: string;
  encouragementNote?: string;
  personalizationDetails: {
    difficultyAdjustment: 'easier' | 'same' | 'harder';
    modificationsApplied: string[];
    basedOnMetrics: {
      cognitive_depth_preference: number;
      challenge_resilience: number;
      learning_pace: number;
      current_zpd: string;
      help_seeking_tendency: number;
    };
    expectedAccuracy: number;
    personalizationReason: string;
  };
}

/**
 * Personalize a question for a specific student
 */
export async function personalizeQuestion(
  masterQuestion: {
    id: string;
    questionText: string;
    questionType: string;
    options?: string[];
    points: number;
  },
  analysis: QuestionAnalysisResult,
  studentProfile: StudentLearningProfile,
  subject: string
): Promise<PersonalizedQuestionResult> {
  
  // Determine personalization strategy
  const strategy = determinePersonalizationStrategy(analysis, studentProfile);
  
  try {
    const prompt = createPersonalizationPrompt(
      masterQuestion,
      analysis,
      studentProfile,
      strategy,
      subject
    );
    
    const aiResponse = await generateAIResponse(prompt);
    const personalizedQuestion = parsePersonalizationResponse(aiResponse);
    
    return {
      ...personalizedQuestion,
      personalizationDetails: {
        ...personalizedQuestion.personalizationDetails,
        basedOnMetrics: {
          cognitive_depth_preference: studentProfile.onboardingMetrics.cognitive_depth_preference,
          challenge_resilience: studentProfile.onboardingMetrics.challenge_resilience,
          learning_pace: studentProfile.dynamicMetrics.actual_learning_pace,
          current_zpd: studentProfile.zpdMetrics.optimal_challenge_level,
          help_seeking_tendency: studentProfile.onboardingMetrics.help_seeking_tendency
        }
      }
    };
  } catch (error) {
    console.error('Error personalizing question:', error);
    // Return original question with minimal modifications
    return createFallbackPersonalization(masterQuestion, analysis, studentProfile);
  }
}

/**
 * Determine personalization strategy based on student profile
 */
function determinePersonalizationStrategy(
  analysis: QuestionAnalysisResult,
  profile: StudentLearningProfile
): {
  difficultyAdjustment: 'easier' | 'same' | 'harder';
  addScaffolding: boolean;
  simplifyLanguage: boolean;
  addHints: boolean;
  addEncouragement: boolean;
  modifyComplexity: boolean;
} {
  const { zpdMetrics, onboardingMetrics, dynamicMetrics } = profile;
  
  // Determine difficulty adjustment based on ZPD
  let difficultyAdjustment: 'easier' | 'same' | 'harder' = 'same';
  
  if (zpdMetrics.optimal_challenge_level === 'easy' && analysis.difficulty !== 'easy') {
    difficultyAdjustment = 'easier';
  } else if (zpdMetrics.optimal_challenge_level === 'hard' && analysis.difficulty !== 'hard') {
    difficultyAdjustment = 'harder';
  }
  
  // Add scaffolding for students who need support
  const addScaffolding = 
    zpdMetrics.scaffolding_needed ||
    onboardingMetrics.challenge_resilience <= 2 ||
    dynamicMetrics.actual_learning_pace <= 3;
  
  // Simplify language for students with lower cognitive depth preference
  const simplifyLanguage = 
    onboardingMetrics.cognitive_depth_preference <= 2 ||
    analysis.abstractionLevel > 3;
  
  // Add hints for students with low help-seeking tendency
  const addHints = 
    onboardingMetrics.help_seeking_tendency <= 2 ||
    dynamicMetrics.error_recovery_rate < 50;
  
  // Add encouragement for students with low challenge resilience
  const addEncouragement = 
    onboardingMetrics.challenge_resilience <= 2 ||
    dynamicMetrics.concept_mastery_rate < 60;
  
  // Modify complexity based on cognitive depth preference
  const modifyComplexity = 
    onboardingMetrics.cognitive_depth_preference !== analysis.bloomsLevel;
  
  return {
    difficultyAdjustment,
    addScaffolding,
    simplifyLanguage,
    addHints,
    addEncouragement,
    modifyComplexity
  };
}

/**
 * Create personalization prompt for AI
 */
function createPersonalizationPrompt(
  masterQuestion: any,
  analysis: QuestionAnalysisResult,
  profile: StudentLearningProfile,
  strategy: ReturnType<typeof determinePersonalizationStrategy>,
  subject: string
): string {
  const { onboardingMetrics, dynamicMetrics, zpdMetrics } = profile;
  
  return `You are an expert educational AI personalizing a question for a specific student.

**Original Question:**
${masterQuestion.questionText}

${masterQuestion.questionType === 'mcq' && masterQuestion.options ? 
`**Options:**
${masterQuestion.options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}` : ''}

**Question Analysis:**
- Difficulty: ${analysis.difficulty}
- Bloom's Level: ${analysis.bloomsLevel}
- Cognitive Complexity: ${analysis.cognitiveComplexity}/10
- Topics: ${analysis.identifiedTopics.join(', ')}
- Abstraction Level: ${analysis.abstractionLevel}/5

**Student Profile:**
- Cognitive Depth Preference: ${onboardingMetrics.cognitive_depth_preference}/5 (${onboardingMetrics.cognitive_depth_preference <= 2 ? 'Prefers concrete' : 'Prefers deep exploration'})
- Challenge Resilience: ${onboardingMetrics.challenge_resilience}/5 (${onboardingMetrics.challenge_resilience <= 2 ? 'Needs encouragement' : 'Embraces challenges'})
- Learning Pace: ${dynamicMetrics.actual_learning_pace}/10 (${dynamicMetrics.actual_learning_pace <= 3 ? 'Slower' : dynamicMetrics.actual_learning_pace >= 7 ? 'Fast' : 'Average'})
- Current ZPD: ${zpdMetrics.optimal_challenge_level}
- Help-Seeking: ${onboardingMetrics.help_seeking_tendency}/5 (${onboardingMetrics.help_seeking_tendency <= 2 ? 'Rarely asks for help' : 'Proactive'})
- Concept Mastery Rate: ${dynamicMetrics.concept_mastery_rate}%

**Personalization Strategy:**
${strategy.difficultyAdjustment !== 'same' ? `- Adjust difficulty: Make ${strategy.difficultyAdjustment}` : ''}
${strategy.addScaffolding ? '- Add scaffolding: Step-by-step guidance needed' : ''}
${strategy.simplifyLanguage ? '- Simplify language: Use concrete examples' : ''}
${strategy.addHints ? '- Add hints: Progressive hint system' : ''}
${strategy.addEncouragement ? '- Add encouragement: Positive reinforcement needed' : ''}
${strategy.modifyComplexity ? '- Modify complexity: Adjust to student\'s cognitive level' : ''}

**Instructions:**
Create a personalized version of this question that:
1. Maintains the core learning objective
2. Adjusts difficulty to match student's ZPD
3. Applies the personalization strategies above
4. Keeps the same question type
${masterQuestion.questionType === 'mcq' ? '5. Modifies options if needed (keep 4 options)' : ''}

**Respond ONLY with valid JSON:**
\`\`\`json
{
  "questionText": "Personalized question text here",
  ${masterQuestion.questionType === 'mcq' ? '"options": ["Option A", "Option B", "Option C", "Option D"],' : ''}
  ${strategy.addHints ? '"hints": ["Hint 1", "Hint 2", "Hint 3"],' : '"hints": [],'}
  ${strategy.addScaffolding ? `"scaffolding": {
    "enabled": true,
    "stepByStepGuidance": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
    "examples": ["Example: ..."]
  },` : '"scaffolding": null,'}
  "simplifiedLanguage": ${strategy.simplifyLanguage},
  ${strategy.simplifyLanguage ? '"additionalContext": "Additional context or real-world example",' : '"additionalContext": null,'}
  ${strategy.addEncouragement ? '"encouragementNote": "Encouraging message for the student",' : '"encouragementNote": null,'}
  "modificationsApplied": ["List of modifications made"],
  "difficultyAdjustment": "${strategy.difficultyAdjustment}",
  "expectedAccuracy": 75,
  "personalizationReason": "Brief explanation of why these modifications were made"
}
\`\`\``;
}

/**
 * Parse AI personalization response
 */
function parsePersonalizationResponse(aiResponse: string): PersonalizedQuestionResult {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      questionText: parsed.questionText,
      questionType: parsed.questionType || 'short_answer',
      options: parsed.options,
      hints: parsed.hints || [],
      scaffolding: parsed.scaffolding,
      simplifiedLanguage: parsed.simplifiedLanguage || false,
      additionalContext: parsed.additionalContext,
      encouragementNote: parsed.encouragementNote,
      personalizationDetails: {
        difficultyAdjustment: parsed.difficultyAdjustment || 'same',
        modificationsApplied: parsed.modificationsApplied || [],
        basedOnMetrics: {
          cognitive_depth_preference: 0,
          challenge_resilience: 0,
          learning_pace: 0,
          current_zpd: '',
          help_seeking_tendency: 0
        }, // Will be filled by caller
        expectedAccuracy: parsed.expectedAccuracy || 70,
        personalizationReason: parsed.personalizationReason || ''
      }
    };
  } catch (error) {
    console.error('Error parsing personalization response:', error);
    throw error;
  }
}

/**
 * Create fallback personalization without AI
 */
function createFallbackPersonalization(
  masterQuestion: any,
  analysis: QuestionAnalysisResult,
  profile: StudentLearningProfile
): PersonalizedQuestionResult {
  const strategy = determinePersonalizationStrategy(analysis, profile);
  
  // Apply basic modifications
  let questionText = masterQuestion.questionText;
  const hints: string[] = [];
  
  if (strategy.simplifyLanguage) {
    questionText = `${questionText}\n\n(Think about this step by step)`;
  }
  
  if (strategy.addHints) {
    hints.push('Break the problem into smaller parts');
    hints.push('Review the key concepts before starting');
    hints.push('Check your work carefully');
  }
  
  const encouragementNote = strategy.addEncouragement
    ? 'Take your time with this question. You can do it!'
    : undefined;
  
  return {
    questionText,
    questionType: masterQuestion.questionType,
    options: masterQuestion.options,
    hints,
    scaffolding: strategy.addScaffolding ? {
      enabled: true,
      stepByStepGuidance: ['Read the question carefully', 'Identify what you know', 'Determine what you need to find'],
      examples: []
    } : undefined,
    simplifiedLanguage: strategy.simplifyLanguage,
    additionalContext: undefined,
    encouragementNote,
    personalizationDetails: {
      difficultyAdjustment: strategy.difficultyAdjustment,
      modificationsApplied: ['Basic personalization applied (AI unavailable)'],
      basedOnMetrics: {
        cognitive_depth_preference: profile.onboardingMetrics.cognitive_depth_preference,
        challenge_resilience: profile.onboardingMetrics.challenge_resilience,
        learning_pace: profile.dynamicMetrics.actual_learning_pace,
        current_zpd: profile.zpdMetrics.optimal_challenge_level,
        help_seeking_tendency: profile.onboardingMetrics.help_seeking_tendency
      },
      expectedAccuracy: 70,
      personalizationReason: 'Fallback personalization applied'
    }
  };
}

/**
 * Personalize multiple questions for a student
 */
export async function personalizeQuestionsBatch(
  masterQuestions: Array<{
    id: string;
    questionText: string;
    questionType: string;
    options?: string[];
    points: number;
    analysis: QuestionAnalysisResult;
  }>,
  studentProfile: StudentLearningProfile,
  subject: string
): Promise<Record<string, PersonalizedQuestionResult>> {
  const results: Record<string, PersonalizedQuestionResult> = {};
  
  for (const question of masterQuestions) {
    try {
      const personalized = await personalizeQuestion(
        question,
        question.analysis,
        studentProfile,
        subject
      );
      results[question.id] = personalized;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error personalizing question ${question.id}:`, error);
      results[question.id] = createFallbackPersonalization(
        question,
        question.analysis,
        studentProfile
      );
    }
  }
  
  return results;
}

/**
 * Predict student accuracy on personalized question
 */
export function predictStudentAccuracy(
  analysis: QuestionAnalysisResult,
  profile: StudentLearningProfile,
  personalization: PersonalizedQuestionResult
): number {
  let baseAccuracy = profile.dynamicMetrics.concept_mastery_rate;
  
  // Adjust based on difficulty match
  if (personalization.personalizationDetails.difficultyAdjustment === 'easier') {
    baseAccuracy += 15;
  } else if (personalization.personalizationDetails.difficultyAdjustment === 'harder') {
    baseAccuracy -= 15;
  }
  
  // Adjust based on scaffolding
  if (personalization.scaffolding?.enabled) {
    baseAccuracy += 10;
  }
  
  // Adjust based on hints
  if (personalization.hints && personalization.hints.length > 0) {
    baseAccuracy += 5;
  }
  
  // Clamp between 0-100
  return Math.min(100, Math.max(0, Math.round(baseAccuracy)));
}

/**
 * Calculate personalization intensity
 */
export function calculatePersonalizationIntensity(
  personalization: PersonalizedQuestionResult
): 'light' | 'moderate' | 'aggressive' {
  let score = 0;
  
  if (personalization.personalizationDetails.difficultyAdjustment !== 'same') score += 2;
  if (personalization.scaffolding?.enabled) score += 2;
  if (personalization.hints && personalization.hints.length > 0) score += 1;
  if (personalization.simplifiedLanguage) score += 1;
  if (personalization.additionalContext) score += 1;
  if (personalization.encouragementNote) score += 1;
  
  if (score <= 2) return 'light';
  if (score <= 5) return 'moderate';
  return 'aggressive';
}

