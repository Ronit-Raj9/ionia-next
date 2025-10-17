/**
 * Question Analyzer
 * 
 * Uses Gemini AI to analyze teacher-provided questions and extract:
 * - Difficulty level
 * - Bloom's Taxonomy level
 * - Cognitive complexity
 * - Key concepts
 * - Prerequisites
 * - Estimated time
 * - Cognitive load
 * - Required skills
 * - Abstraction level
 */

import { generateAIResponse } from './gemini-service';

export interface QuestionAnalysisResult {
  difficulty: 'easy' | 'medium' | 'hard';
  bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6;
  cognitiveComplexity: number; // 1-10
  identifiedTopics: string[];
  keyConcepts: string[];
  prerequisites: string[];
  estimatedTime: number; // seconds
  cognitiveLoad: 'low' | 'medium' | 'high';
  requiredSkills: string[];
  abstractionLevel: number; // 1-5
  analyzedAt: Date;
}

/**
 * Analyze a single question using AI
 */
export async function analyzeQuestion(
  questionText: string,
  subject: string,
  grade: string,
  questionType: string,
  options?: string[]
): Promise<QuestionAnalysisResult> {
  
  const prompt = createAnalysisPrompt(questionText, subject, grade, questionType, options);
  
  try {
    const aiResponse = await generateAIResponse(prompt);
    const analysis = parseAIAnalysis(aiResponse);
    
    return {
      ...analysis,
      analyzedAt: new Date()
    };
  } catch (error) {
    console.error('Error analyzing question:', error);
    // Return fallback analysis
    return createFallbackAnalysis(questionText, questionType);
  }
}

/**
 * Analyze multiple questions in batch
 */
export async function analyzeQuestionsBatch(
  questions: Array<{
    id: string;
    questionText: string;
    questionType: string;
    options?: string[];
  }>,
  subject: string,
  grade: string
): Promise<Record<string, QuestionAnalysisResult>> {
  const results: Record<string, QuestionAnalysisResult> = {};
  
  // Process questions sequentially to avoid rate limits
  for (const question of questions) {
    try {
      const analysis = await analyzeQuestion(
        question.questionText,
        subject,
        grade,
        question.questionType,
        question.options
      );
      results[question.id] = analysis;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error analyzing question ${question.id}:`, error);
      results[question.id] = createFallbackAnalysis(question.questionText, question.questionType);
    }
  }
  
  return results;
}

/**
 * Create analysis prompt for Gemini
 */
function createAnalysisPrompt(
  questionText: string,
  subject: string,
  grade: string,
  questionType: string,
  options?: string[]
): string {
  return `You are an expert educational psychologist analyzing a question for Grade ${grade} ${subject}.

**Question:**
${questionText}

${questionType === 'mcq' && options ? `**Options:**\n${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}` : ''}

**Question Type:** ${questionType}

Please analyze this question and provide the following in JSON format:

1. **difficulty** (easy/medium/hard): Based on grade-level expectations
   - easy: Below grade level, routine application
   - medium: At grade level, requires understanding
   - hard: Above grade level, requires deep analysis

2. **bloomsLevel** (1-6): Bloom's Taxonomy classification
   - 1: Remember (recall facts)
   - 2: Understand (explain concepts)
   - 3: Apply (use knowledge in new situations)
   - 4: Analyze (break down information)
   - 5: Evaluate (make judgments)
   - 6: Create (produce new work)

3. **cognitiveComplexity** (1-10): Overall mental effort required

4. **identifiedTopics** (array of strings): Main topics covered (e.g., ["Linear Equations", "Algebra"])

5. **keyConcepts** (array of strings): Specific concepts tested (e.g., ["Slope", "Y-intercept"])

6. **prerequisites** (array of strings): What students need to know first (e.g., ["Basic arithmetic", "Variable manipulation"])

7. **estimatedTime** (seconds): How long a typical student should take

8. **cognitiveLoad** (low/medium/high): Working memory demand
   - low: Simple, straightforward
   - medium: Multiple steps or concepts
   - high: Complex, multi-layered reasoning

9. **requiredSkills** (array of strings): Skills needed (e.g., ["Problem-solving", "Critical thinking", "Calculation"])

10. **abstractionLevel** (1-5): How abstract vs. concrete
    - 1: Very concrete (real objects, direct experience)
    - 2: Concrete with some abstraction
    - 3: Mixed concrete and abstract
    - 4: Mostly abstract
    - 5: Highly abstract (theoretical, symbolic)

**Respond ONLY with valid JSON:**
\`\`\`json
{
  "difficulty": "medium",
  "bloomsLevel": 3,
  "cognitiveComplexity": 6,
  "identifiedTopics": ["..."],
  "keyConcepts": ["..."],
  "prerequisites": ["..."],
  "estimatedTime": 180,
  "cognitiveLoad": "medium",
  "requiredSkills": ["..."],
  "abstractionLevel": 3
}
\`\`\``;
}

/**
 * Parse AI response into structured analysis
 */
function parseAIAnalysis(aiResponse: string): Omit<QuestionAnalysisResult, 'analyzedAt'> {
  try {
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and sanitize
    return {
      difficulty: validateDifficulty(parsed.difficulty),
      bloomsLevel: validateBloomsLevel(parsed.bloomsLevel),
      cognitiveComplexity: Math.min(10, Math.max(1, parseInt(parsed.cognitiveComplexity) || 5)),
      identifiedTopics: Array.isArray(parsed.identifiedTopics) ? parsed.identifiedTopics : [],
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
      prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites : [],
      estimatedTime: Math.min(600, Math.max(30, parseInt(parsed.estimatedTime) || 120)),
      cognitiveLoad: validateCognitiveLoad(parsed.cognitiveLoad),
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
      abstractionLevel: Math.min(5, Math.max(1, parseInt(parsed.abstractionLevel) || 3))
    };
  } catch (error) {
    console.error('Error parsing AI analysis:', error);
    throw error;
  }
}

/**
 * Create fallback analysis if AI fails
 */
function createFallbackAnalysis(questionText: string, questionType: string): QuestionAnalysisResult {
  // Simple heuristics for fallback
  const wordCount = questionText.split(/\s+/).length;
  const hasNumbers = /\d+/.test(questionText);
  const hasEquation = /[=+\-*/^]/.test(questionText);
  
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  let bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6 = 3;
  let estimatedTime = 120;
  
  // Heuristic difficulty estimation
  if (wordCount < 20 && questionType === 'mcq') {
    difficulty = 'easy';
    bloomsLevel = 2;
    estimatedTime = 60;
  } else if (wordCount > 50 || questionType === 'essay') {
    difficulty = 'hard';
    bloomsLevel = 5;
    estimatedTime = 300;
  }
  
  return {
    difficulty,
    bloomsLevel,
    cognitiveComplexity: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7,
    identifiedTopics: [],
    keyConcepts: [],
    prerequisites: [],
    estimatedTime,
    cognitiveLoad: difficulty === 'easy' ? 'low' : difficulty === 'medium' ? 'medium' : 'high',
    requiredSkills: ['Problem-solving', 'Critical thinking'],
    abstractionLevel: hasNumbers || hasEquation ? 2 : 3,
    analyzedAt: new Date()
  };
}

/**
 * Validation helpers
 */
function validateDifficulty(value: any): 'easy' | 'medium' | 'hard' {
  if (['easy', 'medium', 'hard'].includes(value)) return value;
  return 'medium';
}

function validateBloomsLevel(value: any): 1 | 2 | 3 | 4 | 5 | 6 {
  const level = parseInt(value);
  if (level >= 1 && level <= 6) return level as 1 | 2 | 3 | 4 | 5 | 6;
  return 3;
}

function validateCognitiveLoad(value: any): 'low' | 'medium' | 'high' {
  if (['low', 'medium', 'high'].includes(value)) return value;
  return 'medium';
}

/**
 * Compare question difficulties for ranking
 */
export function compareQuestionDifficulty(
  analysis1: QuestionAnalysisResult,
  analysis2: QuestionAnalysisResult
): number {
  const difficultyMap = { easy: 1, medium: 2, hard: 3 };
  
  const score1 = difficultyMap[analysis1.difficulty] * 10 + analysis1.bloomsLevel;
  const score2 = difficultyMap[analysis2.difficulty] * 10 + analysis2.bloomsLevel;
  
  return score1 - score2;
}

/**
 * Get difficulty distribution for a set of questions
 */
export function getQuestionDifficultyDistribution(
  analyses: QuestionAnalysisResult[]
): { easy: number; medium: number; hard: number } {
  return analyses.reduce(
    (acc, analysis) => {
      acc[analysis.difficulty]++;
      return acc;
    },
    { easy: 0, medium: 0, hard: 0 }
  );
}

/**
 * Get Bloom's level distribution
 */
export function getBloomsDistribution(
  analyses: QuestionAnalysisResult[]
): Record<number, number> {
  return analyses.reduce((acc, analysis) => {
    acc[analysis.bloomsLevel] = (acc[analysis.bloomsLevel] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
}

/**
 * Calculate average cognitive complexity
 */
export function calculateAverageCognitiveComplexity(
  analyses: QuestionAnalysisResult[]
): number {
  if (analyses.length === 0) return 0;
  
  const sum = analyses.reduce((acc, analysis) => acc + analysis.cognitiveComplexity, 0);
  return Math.round(sum / analyses.length);
}

/**
 * Identify common topics across questions
 */
export function identifyCommonTopics(
  analyses: QuestionAnalysisResult[]
): { topic: string; count: number }[] {
  const topicCount = new Map<string, number>();
  
  analyses.forEach(analysis => {
    analysis.identifiedTopics.forEach(topic => {
      topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
    });
  });
  
  return Array.from(topicCount.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Suggest optimal question selection for balanced assessment
 */
export function suggestBalancedSelection(
  analyses: QuestionAnalysisResult[],
  totalToSelect: number
): {
  suggested: number[];
  reasoning: string;
} {
  // Aim for: 30% easy, 50% medium, 20% hard
  const targetEasy = Math.floor(totalToSelect * 0.3);
  const targetMedium = Math.ceil(totalToSelect * 0.5);
  const targetHard = totalToSelect - targetEasy - targetMedium;
  
  const easy = analyses.filter(a => a.difficulty === 'easy');
  const medium = analyses.filter(a => a.difficulty === 'medium');
  const hard = analyses.filter(a => a.difficulty === 'hard');
  
  const selected: number[] = [];
  
  // Select from each category
  const selectFrom = (arr: QuestionAnalysisResult[], count: number) => {
    return arr.slice(0, Math.min(count, arr.length));
  };
  
  const selectedEasy = selectFrom(easy, targetEasy);
  const selectedMedium = selectFrom(medium, targetMedium);
  const selectedHard = selectFrom(hard, targetHard);
  
  // Get indices (simplified - would need actual mapping)
  const reasoning = `Suggested ${selectedEasy.length} easy, ${selectedMedium.length} medium, ${selectedHard.length} hard questions for balanced assessment.`;
  
  return { suggested: selected, reasoning };
}

