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
      model: 'llama3-8b-8192',
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
      model: 'llama3-8b-8192',
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

export default groq;
