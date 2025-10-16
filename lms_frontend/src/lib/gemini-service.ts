/**
 * Gemini AI Service
 * Handles all AI operations: OCR, personalization, grading, and analytics
 */

import { StudentProfile } from './db';

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Model selection
const GEMINI_PRO_MODEL = 'gemini-1.5-pro-latest';
const GEMINI_FLASH_MODEL = 'gemini-1.5-flash-latest';
const GEMINI_VISION_MODEL = 'gemini-1.5-pro-vision-latest';

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

/**
 * Generate AI response using Gemini (exported for academic plan generation)
 */
export async function generateAIResponse(prompt: string, useFlashModel = false): Promise<string> {
  return callGemini(prompt, useFlashModel);
}

/**
 * Call Gemini API with text prompt
 */
async function callGemini(prompt: string, useFlashModel = false): Promise<string> {
  try {
    const model = useFlashModel ? GEMINI_FLASH_MODEL : GEMINI_PRO_MODEL;
    const response = await fetch(
      `${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

/**
 * Call Gemini Vision API for image analysis (OCR)
 */
async function callGeminiVision(imageBase64: string, prompt: string): Promise<string> {
  try {
    const response = await fetch(
      `${GEMINI_API_URL}/${GEMINI_VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2, // Lower temperature for more accurate OCR
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Vision API error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error) {
    console.error('Error calling Gemini Vision API:', error);
    throw error;
  }
}

/**
 * Extract OCEAN traits from quiz responses and map to learning styles
 */
export async function analyzePersonalityAndGenerateLearningProfile(
  quizResponses: Record<string, string>
): Promise<{
  oceanTraits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  learningPreferences: {
    visualLearner: boolean;
    kinestheticLearner: boolean;
    auditoryLearner: boolean;
    readingWritingLearner: boolean;
    preferredDifficulty: 'easy' | 'medium' | 'hard';
    needsStepByStepGuidance: boolean;
    respondsToEncouragement: boolean;
  };
  intellectualTraits: {
    analyticalThinking: number;
    creativeThinking: number;
    criticalThinking: number;
    problemSolvingSkill: number;
  };
}> {
  const prompt = `You are an educational psychologist analyzing a student's learning profile based on their quiz responses.

Quiz Responses:
${JSON.stringify(quizResponses, null, 2)}

Task: Analyze these responses and determine:

1. OCEAN Personality Traits (score each 0-100):
   - Openness: Creativity, curiosity, openness to new experiences
   - Conscientiousness: Organization, dependability, discipline
   - Extraversion: Sociability, assertiveness, enthusiasm
   - Agreeableness: Cooperation, compassion, politeness
   - Neuroticism: Emotional stability (low score = stable, high = anxious)

2. Learning Preferences:
   - Primary learning style: visual, kinesthetic, auditory, or reading/writing
   - Preferred difficulty level: easy, medium, or hard
   - Needs step-by-step guidance: true/false
   - Responds to encouragement: true/false

3. Intellectual Traits (score each 0-100):
   - Analytical Thinking
   - Creative Thinking
   - Critical Thinking
   - Problem Solving Skill

Output ONLY valid JSON in this exact format:
{
  "oceanTraits": {
    "openness": 75,
    "conscientiousness": 60,
    "extraversion": 50,
    "agreeableness": 70,
    "neuroticism": 40
  },
  "learningPreferences": {
    "visualLearner": true,
    "kinestheticLearner": false,
    "auditoryLearner": false,
    "readingWritingLearner": false,
    "preferredDifficulty": "medium",
    "needsStepByStepGuidance": false,
    "respondsToEncouragement": true
  },
  "intellectualTraits": {
    "analyticalThinking": 65,
    "creativeThinking": 80,
    "criticalThinking": 70,
    "problemSolvingSkill": 75
  }
}`;

  try {
    const response = await callGemini(prompt, true); // Use flash for speed
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing personality:', error);
    // Fallback to default profile
    return {
      oceanTraits: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50
      },
      learningPreferences: {
        visualLearner: true,
        kinestheticLearner: false,
        auditoryLearner: false,
        readingWritingLearner: false,
        preferredDifficulty: 'medium',
        needsStepByStepGuidance: false,
        respondsToEncouragement: true
      },
      intellectualTraits: {
        analyticalThinking: 50,
        creativeThinking: 50,
        criticalThinking: 50,
        problemSolvingSkill: 50
      }
    };
  }
}

/**
 * Extract text from uploaded assignment image using OCR
 */
export async function extractTextFromImage(imageBase64: string): Promise<{
  extractedText: string;
  questions: string[];
  isLegible: boolean;
  confidenceScore: number;
}> {
  const prompt = `You are an expert at reading handwritten and printed text from assignment images.

Task: Extract all text from this Science assignment image. Identify:
1. All questions (numbered or bulleted)
2. Any mathematical formulas or equations
3. Any diagrams or figures (describe them)

Assess the image quality:
- Is the handwriting legible?
- Confidence score (0-100) for accuracy of extraction

Output ONLY valid JSON in this format:
{
  "extractedText": "Full extracted text here...",
  "questions": ["Question 1: ...", "Question 2: ..."],
  "isLegible": true,
  "confidenceScore": 95
}`;

  try {
    const response = await callGeminiVision(imageBase64, prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini Vision');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

/**
 * Check image quality before processing
 */
export async function checkImageQuality(imageBase64: string): Promise<{
  isBlurry: boolean;
  isLegible: boolean;
  confidenceScore: number;
  suggestions: string[];
}> {
  const prompt = `Analyze this assignment submission image for quality.

Check:
1. Is the image blurry or out of focus?
2. Is the handwriting/text legible?
3. Is the lighting adequate?
4. Is the full content visible (not cut off)?

Provide a confidence score (0-100) and suggestions for improvement if needed.

Output ONLY valid JSON:
{
  "isBlurry": false,
  "isLegible": true,
  "confidenceScore": 90,
  "suggestions": ["Good quality image, ready for grading"]
}`;

  try {
    const response = await callGeminiVision(imageBase64, prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error checking image quality:', error);
    return {
      isBlurry: false,
      isLegible: true,
      confidenceScore: 50,
      suggestions: ['Could not assess image quality']
    };
  }
}

/**
 * Personalize assignment for a specific student
 */
export async function personalizeAssignment(
  baseQuestions: string[],
  studentProfile: Partial<StudentProfile>,
  subject: string,
  topic: string,
  grade: string
): Promise<{
  personalizedQuestions: string[];
  variations: string;
  difficultyAdjustment: string;
  visualAids?: string[];
  hints?: string[];
  remedialQuestions?: string[];
  challengeQuestions?: string[];
  encouragementNote: string;
  personalizationReason: string;
}> {
  // Calculate student's topic mastery
  const topicMastery = studentProfile.subjectMastery?.find(s => s.subject === subject)
    ?.topics.find(t => t.name === topic)?.masteryScore || 50;
  
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

  const prompt = `You are an expert Science teacher for Class ${grade} CBSE curriculum. You are personalizing an assignment on "${topic}" for a student with these characteristics:

Student Profile:
- Topic Mastery: ${topicMastery}% (${topicMastery > 80 ? 'Strong' : topicMastery > 50 ? 'Average' : 'Weak'})
- Learning Style: ${learningPrefs.visualLearner ? 'Visual' : learningPrefs.auditoryLearner ? 'Auditory' : learningPrefs.kinestheticLearner ? 'Kinesthetic' : 'Reading/Writing'}
- Needs Step-by-Step Guidance: ${learningPrefs.needsStepByStepGuidance ? 'Yes' : 'No'}
- Responds to Encouragement: ${learningPrefs.respondsToEncouragement ? 'Yes' : 'No'}
- Openness (Creativity): ${oceanTraits.openness}/100
- Conscientiousness (Discipline): ${oceanTraits.conscientiousness}/100
- Neuroticism (Anxiety): ${oceanTraits.neuroticism}/100

Original Assignment Questions:
${baseQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Task: Modify this assignment to suit this student's needs. Follow these guidelines:

1. DIFFICULTY ADJUSTMENT:
   - If mastery > 80%: Make questions more challenging, add multi-step problems
   - If mastery < 50%: Simplify questions, break into sub-steps, add hints
   - If mastery 50-80%: Keep base difficulty

2. VISUAL AIDS (if Visual Learner):
   - Add diagram descriptions where helpful
   - Suggest visualizations for abstract concepts

3. STEP-BY-STEP HINTS (if needed):
   - Break complex problems into guided steps
   - Provide formula reminders

4. REMEDIAL QUESTIONS (if mastery < 60%):
   - Add 1-2 easier foundational questions before main questions

5. CHALLENGE QUESTIONS (if mastery > 85%):
   - Add 1 advanced problem combining multiple concepts

6. ENCOURAGEMENT NOTE:
   - If high neuroticism: Add calming, encouraging note
   - If high extraversion: Suggest collaborative approach

Output ONLY valid JSON in this format:
{
  "personalizedQuestions": ["Modified question 1...", "Modified question 2..."],
  "variations": "Brief description of how questions were modified",
  "difficultyAdjustment": "easier/same/harder",
  "visualAids": ["Diagram description 1...", "Diagram description 2..."],
  "hints": ["Hint for question 1...", "Hint for question 2..."],
  "remedialQuestions": ["Easier question 1...", "Easier question 2..."],
  "challengeQuestions": ["Advanced question..."],
  "encouragementNote": "Personalized encouraging message",
  "personalizationReason": "Explanation of why these modifications were made"
}`;

  try {
    const response = await callGemini(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error personalizing assignment:', error);
    // Fallback to base questions
    return {
      personalizedQuestions: baseQuestions,
      variations: 'Standard assignment (personalization failed)',
      difficultyAdjustment: 'same',
      encouragementNote: 'Good luck! Do your best.',
      personalizationReason: 'Using base assignment due to personalization error'
    };
  }
}

/**
 * Generate grading rubric from solution
 */
export async function generateGradingRubric(
  questions: string[],
  solution: string,
  totalMarks: number,
  subject: string,
  topic: string
): Promise<{
  criteria: {
    name: string;
    points: number;
    description: string;
  }[];
  aiGenerated: boolean;
}> {
  const prompt = `You are an expert Science teacher creating a grading rubric for a ${subject} assignment on "${topic}".

Questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Model Solution:
${solution}

Total Marks: ${totalMarks}

Task: Create a detailed grading rubric with key criteria to check:
- Correct formula/concept usage
- Correct substitution of values
- Calculation accuracy
- Units mentioned
- Final answer correctness
- Diagram/visualization (if applicable)

Distribute points fairly across all criteria.

Output ONLY valid JSON:
{
  "criteria": [
    {
      "name": "Correct Formula",
      "points": 20,
      "description": "Student used the correct formula for the problem"
    },
    {
      "name": "Substitution",
      "points": 15,
      "description": "Correct substitution of given values into formula"
    }
  ],
  "aiGenerated": true
}`;

  try {
    const response = await callGemini(prompt, true);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating rubric:', error);
    return {
      criteria: [
        { name: 'Correct Answer', points: totalMarks * 0.6, description: 'Final answer is correct' },
        { name: 'Working Steps', points: totalMarks * 0.3, description: 'Proper working shown' },
        { name: 'Presentation', points: totalMarks * 0.1, description: 'Clear presentation' }
      ],
      aiGenerated: true
    };
  }
}

/**
 * Grade student submission using AI
 */
export async function gradeSubmission(
  questions: string[],
  modelSolution: string,
  studentAnswer: string,
  rubric: any,
  maxScore: number,
  subject: string,
  topic: string
): Promise<{
  score: number;
  percentage: number;
  detailedFeedback: string;
  questionWiseAnalysis: any[];
  errorAnalysis: any[];
  strengthsIdentified: string[];
  areasForImprovement: any[];
  aiConfidence: number;
  requiresReview: boolean;
}> {
  const prompt = `You are an expert Science teacher grading a Class 9/10 ${subject} assignment on "${topic}".

Questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Model Solution:
${modelSolution}

Grading Rubric:
${JSON.stringify(rubric, null, 2)}

Student's Answer:
${studentAnswer}

Maximum Score: ${maxScore}

Task: Grade this answer thoroughly. Provide:
1. Total Score (out of ${maxScore})
2. Question-wise breakdown with points awarded and feedback
3. Error Analysis: Identify specific mistakes (formula errors, calculation errors, conceptual misunderstandings)
4. Strengths: What student did well
5. Areas for Improvement: Specific concepts to review
6. AI Confidence: How confident you are in this grading (0-100)

IMPORTANT:
- Award partial credit for correct approach even if final answer is wrong
- Follow CBSE marking scheme principles
- Be fair and encouraging
- If handwriting was unclear or answer seems incomplete, note it

Output ONLY valid JSON in this format:
{
  "score": 75,
  "percentage": 75.0,
  "detailedFeedback": "Overall feedback...",
  "questionWiseAnalysis": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "studentAnswer": "...",
      "correctAnswer": "...",
      "pointsAwarded": 8,
      "maxPoints": 10,
      "isCorrect": false,
      "partialCredit": true,
      "feedback": "Correct formula used (+5), but calculation error (-2)"
    }
  ],
  "errorAnalysis": [
    {
      "errorType": "Calculation Error",
      "description": "Incorrect multiplication in step 3",
      "relatedConcept": "Arithmetic",
      "severity": "minor"
    }
  ],
  "strengthsIdentified": ["Good understanding of core concept", "Clear presentation"],
  "areasForImprovement": [
    {
      "concept": "Formula Application",
      "suggestion": "Review how to apply Ohm's Law in series circuits"
    }
  ],
  "aiConfidence": 85,
  "requiresReview": false
}`;

  try {
    const response = await callGemini(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from grading');
    }
    const result = JSON.parse(jsonMatch[0]);
    
    // Ensure requiresReview is set correctly
    result.requiresReview = result.aiConfidence < 70;
    
    return result;
  } catch (error) {
    console.error('Error grading submission:', error);
    throw error;
  }
}

/**
 * Generate class analytics insights
 */
export async function generateClassInsights(
  topicPerformance: any[],
  classWeaknesses: any[],
  studentCount: number
): Promise<{
  insights: {
    type: 'warning' | 'suggestion' | 'positive';
    title: string;
    description: string;
    actionable: boolean;
    suggestedAction?: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  predictedChallenges: string[];
  recommendedTopics: string[];
  studentsNeedingAttention: string[];
}> {
  const prompt = `You are an educational data analyst reviewing Class 9/10 Science performance data.

Topic Performance:
${JSON.stringify(topicPerformance, null, 2)}

Class Weaknesses:
${JSON.stringify(classWeaknesses, null, 2)}

Total Students: ${studentCount}

Task: Analyze this data and provide:
1. Key insights (warnings, suggestions, positive observations)
2. Predicted challenges (topics likely to be difficult based on current performance)
3. Recommended topics to review or teach next
4. Any patterns in student struggles

Output ONLY valid JSON in this format:
{
  "insights": [
    {
      "type": "warning",
      "title": "60% students struggling with Ohm's Law",
      "description": "More than half the class scored below 60% on Ohm's Law questions",
      "actionable": true,
      "suggestedAction": "Conduct a revision session on Ohm's Law with practical examples",
      "priority": "high"
    }
  ],
  "predictedChallenges": ["Magnetism", "Chemical Equations"],
  "recommendedTopics": ["Review Ohm's Law", "Practice circuit problems"],
  "studentsNeedingAttention": []
}`;

  try {
    const response = await callGemini(prompt, true);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      insights: [],
      predictedChallenges: [],
      recommendedTopics: [],
      studentsNeedingAttention: []
    };
  }
}

export default {
  analyzePersonalityAndGenerateLearningProfile,
  extractTextFromImage,
  checkImageQuality,
  personalizeAssignment,
  generateGradingRubric,
  gradeSubmission,
  generateClassInsights
};




