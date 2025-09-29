import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('Please add your Groq API key to .env.local');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface PersonalizationRequest {
  questions: string[];
  studentProfile: {
    weaknesses: string[];
    personalityType: string;
    intellectualStrengths: string[];
  };
}

export interface PersonalizationResponse {
  questions: string[];
  variations: string;
}

export interface GradingRequest {
  submittedText: string;
  originalQuestions: string[];
}

export interface GradingResponse {
  score: number;
  feedback: string;
  errors: string[];
}

export async function personalizeAssignment(
  request: PersonalizationRequest
): Promise<PersonalizationResponse> {
  try {
    const prompt = `You are an AI education personalizer for Indian CBSE/ICSE curriculum. 

Personalize these math questions for a student with the following profile:
- Weaknesses: ${request.studentProfile.weaknesses.join(', ')}
- Personality Type: ${request.studentProfile.personalityType}
- Intellectual Strengths: ${request.studentProfile.intellectualStrengths.join(', ')}

Original Questions:
${request.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Instructions:
1. Adapt questions based on student weaknesses (provide remedial support if needed)
2. Match personality type (visual learners get diagrams, analytical get step-by-step)
3. Leverage intellectual strengths
4. Generate 3-5 variations (easier/harder versions)
5. Keep CBSE/ICSE alignment

Return ONLY valid JSON in this format:
{
  "questions": ["adapted question 1", "adapted question 2", ...],
  "variations": "Description of adaptations made (e.g., 'Added visual diagrams for visual learner, included remedial fractions practice')"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert education AI that personalizes learning content for Indian students. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    // Parse JSON response
    const parsed = JSON.parse(response) as PersonalizationResponse;
    
    // Validate response structure
    if (!parsed.questions || !Array.isArray(parsed.questions) || !parsed.variations) {
      throw new Error('Invalid response format from Groq API');
    }

    return parsed;
  } catch (error) {
    console.error('Groq personalization error:', error);
    throw new Error(`Failed to personalize assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function gradeSubmission(
  request: GradingRequest
): Promise<GradingResponse> {
  try {
    const prompt = `You are an AI math teacher grading student submissions for Indian CBSE/ICSE curriculum.

Original Questions:
${request.originalQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Student's Submitted Answer:
${request.submittedText}

Instructions:
1. Grade the submission against the original questions
2. Provide a score from 0-100
3. Give constructive feedback focusing on:
   - Correct steps and methodology
   - Areas for improvement
   - Specific mistakes made
4. List specific errors found
5. Be encouraging but accurate

Return ONLY valid JSON in this format:
{
  "score": 85,
  "feedback": "Good work on the algebraic steps. Your methodology is correct, but be careful with arithmetic in step 3. Consider double-checking your calculations.",
  "errors": ["Arithmetic error in step 3: 2+3=6 should be 2+3=5", "Missing unit in final answer"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert math teacher that provides accurate, constructive grading. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    // Parse JSON response
    const parsed = JSON.parse(response) as GradingResponse;
    
    // Validate response structure
    if (typeof parsed.score !== 'number' || !parsed.feedback || !Array.isArray(parsed.errors)) {
      throw new Error('Invalid response format from Groq API');
    }

    // Ensure score is within valid range
    parsed.score = Math.max(0, Math.min(100, parsed.score));

    return parsed;
  } catch (error) {
    console.error('Groq grading error:', error);
    throw new Error(`Failed to grade submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Enhanced personalization for Science assignments with OCEAN traits
export interface OceanPersonalizationRequest {
  questions: string[];
  studentProfile: {
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
    topicMastery: number; // 0-100
    weaknesses: string[];
  };
  subject: string;
  topic: string;
  grade: string;
}

export interface PersonalizedAssignmentResponse {
  personalizedQuestions: string[];
  variations: string;
  difficultyAdjustment: 'easier' | 'same' | 'harder';
  visualAids?: string[];
  hints?: string[];
  remedialQuestions?: string[];
  challengeQuestions?: string[];
  encouragementNote: string;
  personalizationReason: string;
}

export async function personalizeAssignmentWithOcean(
  request: OceanPersonalizationRequest
): Promise<PersonalizedAssignmentResponse> {
  try {
    const { questions, studentProfile, subject, topic, grade } = request;
    const { oceanTraits, learningPreferences, topicMastery, weaknesses } = studentProfile;

    const prompt = `You are an expert ${subject} teacher for Class ${grade} CBSE curriculum. You are personalizing an assignment on "${topic}".

Student Profile:
- Topic Mastery: ${topicMastery}% (${topicMastery > 80 ? 'Strong' : topicMastery > 50 ? 'Average' : 'Weak'})
- Learning Style: ${learningPreferences.visualLearner ? 'Visual' : learningPreferences.auditoryLearner ? 'Auditory' : learningPreferences.kinestheticLearner ? 'Kinesthetic' : 'Reading/Writing'}
- Needs Step-by-Step Guidance: ${learningPreferences.needsStepByStepGuidance ? 'Yes' : 'No'}
- Responds to Encouragement: ${learningPreferences.respondsToEncouragement ? 'Yes' : 'No'}
- Weaknesses: ${weaknesses.join(', ') || 'None identified'}
- OCEAN Traits:
  * Openness (Creativity): ${oceanTraits.openness}/100
  * Conscientiousness (Discipline): ${oceanTraits.conscientiousness}/100
  * Neuroticism (Anxiety): ${oceanTraits.neuroticism}/100

Original Assignment Questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Task: Modify this assignment to suit this student. Follow these guidelines:

1. DIFFICULTY ADJUSTMENT:
   - If mastery > 80%: Add challenging multi-step problems
   - If mastery < 50%: Simplify, add hints, break into sub-steps
   - If mastery 50-80%: Keep base difficulty

2. VISUAL AIDS (if Visual Learner):
   - Add diagram descriptions for abstract concepts
   - Suggest visualizations

3. STEP-BY-STEP HINTS (if needed):
   - Break complex problems into guided steps
   - Provide formula reminders

4. REMEDIAL QUESTIONS (if mastery < 60%):
   - Add 1-2 easier foundational questions

5. CHALLENGE QUESTIONS (if mastery > 85%):
   - Add 1 advanced problem

6. ENCOURAGEMENT:
   - If high neuroticism: Add calming, encouraging note
   - If high extraversion: Suggest collaborative approach

Return ONLY valid JSON:
{
  "personalizedQuestions": ["Modified question 1", "Modified question 2"],
  "variations": "Brief description of modifications",
  "difficultyAdjustment": "easier",
  "visualAids": ["Diagram description"],
  "hints": ["Hint 1"],
  "remedialQuestions": ["Easy question"],
  "challengeQuestions": ["Advanced question"],
  "encouragementNote": "Encouraging message",
  "personalizationReason": "Explanation of modifications"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert Science teacher specializing in personalized learning. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Groq API');
    }

    const parsed = JSON.parse(jsonMatch[0]) as PersonalizedAssignmentResponse;
    
    // Validate and provide defaults
    return {
      personalizedQuestions: parsed.personalizedQuestions || questions,
      variations: parsed.variations || 'Standard assignment',
      difficultyAdjustment: parsed.difficultyAdjustment || 'same',
      visualAids: parsed.visualAids,
      hints: parsed.hints,
      remedialQuestions: parsed.remedialQuestions,
      challengeQuestions: parsed.challengeQuestions,
      encouragementNote: parsed.encouragementNote || 'Good luck! Do your best.',
      personalizationReason: parsed.personalizationReason || 'Using base assignment'
    };
  } catch (error) {
    console.error('Groq OCEAN personalization error:', error);
    
    // Fallback to basic personalization
    return {
      personalizedQuestions: request.questions,
      variations: 'Standard assignment (personalization unavailable)',
      difficultyAdjustment: 'same',
      encouragementNote: 'Good luck with your assignment!',
      personalizationReason: 'Personalization service temporarily unavailable'
    };
  }
}

// Enhanced grading with detailed feedback for Science
export interface DetailedGradingRequest {
  studentAnswer: string;
  modelSolution: string;
  questions: string[];
  rubric: {
    criteria: {
      name: string;
      points: number;
      description: string;
    }[];
  };
  maxScore: number;
  subject: string;
  topic: string;
}

export interface DetailedGradingResponse {
  score: number;
  percentage: number;
  detailedFeedback: string;
  questionWiseAnalysis: {
    questionNumber: number;
    pointsAwarded: number;
    maxPoints: number;
    isCorrect: boolean;
    partialCredit: boolean;
    feedback: string;
  }[];
  errorAnalysis: {
    errorType: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
  }[];
  strengthsIdentified: string[];
  areasForImprovement: string[];
  aiConfidence: number;
}

export async function gradeSubmissionDetailed(
  request: DetailedGradingRequest
): Promise<DetailedGradingResponse> {
  try {
    const { studentAnswer, modelSolution, questions, rubric, maxScore, subject, topic } = request;

    const prompt = `You are an expert ${subject} teacher grading a Class 9/10 assignment on "${topic}".

Questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Model Solution:
${modelSolution}

Grading Rubric:
${JSON.stringify(rubric, null, 2)}

Student's Answer:
${studentAnswer}

Maximum Score: ${maxScore}

Task: Grade thoroughly. Provide:
1. Total Score and percentage
2. Question-wise breakdown with points and feedback
3. Error Analysis (identify specific mistakes)
4. Strengths (what student did well)
5. Areas for Improvement
6. AI Confidence (0-100)

Award partial credit for correct approach even if final answer is wrong.
Follow CBSE marking principles.

Return ONLY valid JSON:
{
  "score": 75,
  "percentage": 75.0,
  "detailedFeedback": "Overall feedback...",
  "questionWiseAnalysis": [
    {
      "questionNumber": 1,
      "pointsAwarded": 8,
      "maxPoints": 10,
      "isCorrect": false,
      "partialCredit": true,
      "feedback": "Correct formula (+5), calculation error (-2)"
    }
  ],
  "errorAnalysis": [
    {
      "errorType": "Calculation Error",
      "description": "Incorrect multiplication in step 3",
      "severity": "minor"
    }
  ],
  "strengthsIdentified": ["Good understanding of concept"],
  "areasForImprovement": ["Review formula application"],
  "aiConfidence": 85
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert Science teacher providing detailed, constructive grading. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1200,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from Groq API');
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Groq API');
    }

    const parsed = JSON.parse(jsonMatch[0]) as DetailedGradingResponse;
    
    // Ensure score is within valid range
    parsed.score = Math.max(0, Math.min(maxScore, parsed.score));
    parsed.percentage = (parsed.score / maxScore) * 100;
    
    return parsed;
  } catch (error) {
    console.error('Groq detailed grading error:', error);
    throw new Error(`Failed to grade submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default groq;
