/**
 * Advanced Question Analysis System
 * Implements Bloom's Taxonomy, Cognitive Complexity, and Difficulty Scoring
 */

import { generateAIResponse } from './gemini-service';

export interface BloomTaxonomyLevel {
  level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  description: string;
  keywords: string[];
  cognitiveProcess: string;
}

export interface CognitiveComplexity {
  level: 'low' | 'medium' | 'high' | 'very_high';
  score: number; // 1-10 scale
  factors: {
    informationProcessing: number;
    reasoning: number;
    problemSolving: number;
    metacognition: number;
  };
  description: string;
}

export interface DifficultyAnalysis {
  overallScore: number; // 1-10 scale
  factors: {
    contentComplexity: number;
    cognitiveLoad: number;
    prerequisiteKnowledge: number;
    timeRequired: number;
    languageComplexity: number;
  };
  recommendations: {
    gradeLevel: string;
    scaffolding: string[];
    modifications: string[];
  };
}

export interface QuestionAnalysis {
  bloomTaxonomy: BloomTaxonomyLevel;
  cognitiveComplexity: CognitiveComplexity;
  difficultyAnalysis: DifficultyAnalysis;
  keywords: string[];
  concepts: string[];
  skills: string[];
  estimatedTime: number; // in minutes
  prerequisites: string[];
}

// Bloom's Taxonomy Levels
export const BLOOM_TAXONOMY_LEVELS: BloomTaxonomyLevel[] = [
  {
    level: 'remember',
    description: 'Recall facts and basic concepts',
    keywords: ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'state'],
    cognitiveProcess: 'Retrieving relevant knowledge from long-term memory'
  },
  {
    level: 'understand',
    description: 'Explain ideas or concepts',
    keywords: ['classify', 'describe', 'discuss', 'explain', 'identify', 'locate', 'recognize', 'report', 'select', 'translate'],
    cognitiveProcess: 'Constructing meaning from instructional messages'
  },
  {
    level: 'apply',
    description: 'Use information in new situations',
    keywords: ['choose', 'demonstrate', 'dramatize', 'employ', 'illustrate', 'interpret', 'operate', 'schedule', 'sketch', 'solve', 'use', 'write'],
    cognitiveProcess: 'Carrying out or using a procedure in a given situation'
  },
  {
    level: 'analyze',
    description: 'Draw connections among ideas',
    keywords: ['appraise', 'compare', 'contrast', 'criticize', 'differentiate', 'discriminate', 'distinguish', 'examine', 'experiment', 'question', 'test'],
    cognitiveProcess: 'Breaking material into constituent parts and determining how parts relate'
  },
  {
    level: 'evaluate',
    description: 'Justify a stand or decision',
    keywords: ['appraise', 'argue', 'defend', 'judge', 'select', 'support', 'value', 'evaluate'],
    cognitiveProcess: 'Making judgments based on criteria and standards'
  },
  {
    level: 'create',
    description: 'Produce new or original work',
    keywords: ['assemble', 'construct', 'create', 'design', 'develop', 'formulate', 'write'],
    cognitiveProcess: 'Putting elements together to form a coherent or functional whole'
  }
];

/**
 * Analyze a question using AI to determine Bloom's taxonomy, cognitive complexity, and difficulty
 */
export async function analyzeQuestion(questionText: string, subject: string, grade: string): Promise<QuestionAnalysis> {
  try {
    const prompt = createQuestionAnalysisPrompt(questionText, subject, grade);
    console.log('🔍 Analyzing question with Gemini 2.5 Flash...');
    
    const aiResponse = await generateAIResponse(prompt);
    
    if (!aiResponse || aiResponse.trim() === '') {
      console.error('❌ Empty response from Gemini API');
      throw new Error('Empty response from Gemini API');
    }
    
    console.log('✅ Received response from Gemini API, length:', aiResponse.length);
    
    // Parse AI response
    const analysis = parseQuestionAnalysisResponse(aiResponse, questionText);
    
    // Validate and enhance analysis
    return validateAndEnhanceAnalysis(analysis, questionText, subject, grade);
    
  } catch (error) {
    console.error('❌ Question analysis error:', error);
    return generateFallbackAnalysis(questionText, subject, grade);
  }
}

/**
 * Create comprehensive prompt for question analysis
 */
function createQuestionAnalysisPrompt(questionText: string, subject: string, grade: string): string {
  return `
You are an expert educational psychologist and curriculum analyst. Analyze the following question comprehensively.

**Question to Analyze:**
"${questionText}"

**Context:**
- Subject: ${subject}
- Grade Level: ${grade}

**Analysis Requirements:**

1. **Bloom's Taxonomy Classification:**
   - Determine the primary cognitive level (remember, understand, apply, analyze, evaluate, create)
   - Identify supporting cognitive processes
   - Justify your classification

2. **Cognitive Complexity Assessment:**
   - Rate information processing demands (1-10)
   - Assess reasoning requirements (1-10)
   - Evaluate problem-solving complexity (1-10)
   - Consider metacognitive demands (1-10)
   - Determine overall complexity level (low, medium, high, very_high)

3. **Difficulty Analysis:**
   - Content complexity (1-10)
   - Cognitive load (1-10)
   - Prerequisite knowledge required (1-10)
   - Estimated time required (1-10)
   - Language complexity (1-10)

4. **Educational Elements:**
   - Extract key concepts and skills
   - Identify prerequisite knowledge
   - Suggest appropriate grade level
   - Recommend scaffolding strategies

**Return ONLY valid JSON in this exact format:**
{
  "bloomTaxonomy": {
    "level": "apply",
    "description": "Use information in new situations",
    "keywords": ["solve", "apply", "demonstrate"],
    "cognitiveProcess": "Carrying out or using a procedure in a given situation"
  },
  "cognitiveComplexity": {
    "level": "medium",
    "score": 6,
    "factors": {
      "informationProcessing": 5,
      "reasoning": 7,
      "problemSolving": 6,
      "metacognition": 4
    },
    "description": "Requires moderate cognitive effort with some complex reasoning"
  },
  "difficultyAnalysis": {
    "overallScore": 6,
    "factors": {
      "contentComplexity": 6,
      "cognitiveLoad": 7,
      "prerequisiteKnowledge": 5,
      "timeRequired": 6,
      "languageComplexity": 4
    },
    "recommendations": {
      "gradeLevel": "9-10",
      "scaffolding": ["Provide worked examples", "Break into smaller steps"],
      "modifications": ["Add visual aids", "Provide formula sheet"]
    }
  },
  "keywords": ["quadratic", "equation", "solve", "factor"],
  "concepts": ["Quadratic equations", "Factoring", "Algebraic manipulation"],
  "skills": ["Problem solving", "Algebraic reasoning", "Pattern recognition"],
  "estimatedTime": 8,
  "prerequisites": ["Basic algebra", "Factoring techniques", "Equation solving"]
}

**Important:** Be precise and educational in your analysis. Consider the cognitive demands and learning objectives.
`;
}

/**
 * Parse AI response into structured analysis
 */
function parseQuestionAnalysisResponse(response: string, questionText: string): QuestionAnalysis {
  try {
    // Clean the response to extract JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate and structure the response
    return {
      bloomTaxonomy: validateBloomTaxonomy(analysis.bloomTaxonomy),
      cognitiveComplexity: validateCognitiveComplexity(analysis.cognitiveComplexity),
      difficultyAnalysis: validateDifficultyAnalysis(analysis.difficultyAnalysis),
      keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
      concepts: Array.isArray(analysis.concepts) ? analysis.concepts : [],
      skills: Array.isArray(analysis.skills) ? analysis.skills : [],
      estimatedTime: typeof analysis.estimatedTime === 'number' ? analysis.estimatedTime : 5,
      prerequisites: Array.isArray(analysis.prerequisites) ? analysis.prerequisites : []
    };
    
  } catch (error) {
    console.error('Error parsing question analysis:', error);
    throw error;
  }
}

/**
 * Validate Bloom's taxonomy classification
 */
function validateBloomTaxonomy(bloom: any): BloomTaxonomyLevel {
  const validLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
  const level = validLevels.includes(bloom?.level) ? bloom.level : 'understand';
  
  return BLOOM_TAXONOMY_LEVELS.find(b => b.level === level) || BLOOM_TAXONOMY_LEVELS[1];
}

/**
 * Validate cognitive complexity analysis
 */
function validateCognitiveComplexity(complexity: any): CognitiveComplexity {
  const validLevels = ['low', 'medium', 'high', 'very_high'];
  const level = validLevels.includes(complexity?.level) ? complexity.level : 'medium';
  
  return {
    level: level as any,
    score: Math.max(1, Math.min(10, complexity?.score || 5)),
    factors: {
      informationProcessing: Math.max(1, Math.min(10, complexity?.factors?.informationProcessing || 5)),
      reasoning: Math.max(1, Math.min(10, complexity?.factors?.reasoning || 5)),
      problemSolving: Math.max(1, Math.min(10, complexity?.factors?.problemSolving || 5)),
      metacognition: Math.max(1, Math.min(10, complexity?.factors?.metacognition || 5))
    },
    description: complexity?.description || 'Moderate cognitive complexity'
  };
}

/**
 * Validate difficulty analysis
 */
function validateDifficultyAnalysis(difficulty: any): DifficultyAnalysis {
  return {
    overallScore: Math.max(1, Math.min(10, difficulty?.overallScore || 5)),
    factors: {
      contentComplexity: Math.max(1, Math.min(10, difficulty?.factors?.contentComplexity || 5)),
      cognitiveLoad: Math.max(1, Math.min(10, difficulty?.factors?.cognitiveLoad || 5)),
      prerequisiteKnowledge: Math.max(1, Math.min(10, difficulty?.factors?.prerequisiteKnowledge || 5)),
      timeRequired: Math.max(1, Math.min(10, difficulty?.factors?.timeRequired || 5)),
      languageComplexity: Math.max(1, Math.min(10, difficulty?.factors?.languageComplexity || 5))
    },
    recommendations: {
      gradeLevel: difficulty?.recommendations?.gradeLevel || '9-10',
      scaffolding: Array.isArray(difficulty?.recommendations?.scaffolding) 
        ? difficulty.recommendations.scaffolding 
        : ['Provide examples', 'Break into steps'],
      modifications: Array.isArray(difficulty?.recommendations?.modifications) 
        ? difficulty.recommendations.modifications 
        : ['Add visual aids']
    }
  };
}

/**
 * Validate and enhance the complete analysis
 */
function validateAndEnhanceAnalysis(analysis: QuestionAnalysis, questionText: string, subject: string, grade: string): QuestionAnalysis {
  // Enhance keywords extraction
  const enhancedKeywords = extractKeywordsFromText(questionText);
  analysis.keywords = Array.from(new Set([...analysis.keywords, ...enhancedKeywords]));
  
  // Adjust estimated time based on complexity
  const timeMultiplier = analysis.cognitiveComplexity.score / 5;
  analysis.estimatedTime = Math.max(2, Math.round(analysis.estimatedTime * timeMultiplier));
  
  // Add subject-specific concepts if missing
  if (analysis.concepts.length === 0) {
    analysis.concepts = extractSubjectConcepts(questionText, subject);
  }
  
  return analysis;
}

/**
 * Extract keywords from question text
 */
function extractKeywordsFromText(text: string): string[] {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 10); // Limit to 10 keywords
}

/**
 * Extract subject-specific concepts
 */
function extractSubjectConcepts(text: string, subject: string): string[] {
  const subjectConcepts: { [key: string]: string[] } = {
    'math': ['algebra', 'geometry', 'calculus', 'statistics', 'trigonometry'],
    'science': ['physics', 'chemistry', 'biology', 'experiment', 'hypothesis'],
    'english': ['literature', 'grammar', 'writing', 'comprehension', 'vocabulary'],
    'history': ['timeline', 'civilization', 'war', 'revolution', 'culture'],
    'geography': ['climate', 'population', 'resources', 'environment', 'mapping']
  };
  
  const concepts = subjectConcepts[subject.toLowerCase()] || [];
  return concepts.filter(concept => text.toLowerCase().includes(concept));
}

/**
 * Generate fallback analysis when AI fails
 */
function generateFallbackAnalysis(questionText: string, subject: string, grade: string): QuestionAnalysis {
  const keywords = extractKeywordsFromText(questionText);
  const concepts = extractSubjectConcepts(questionText, subject);
  
  return {
    bloomTaxonomy: BLOOM_TAXONOMY_LEVELS[2], // Default to 'apply'
    cognitiveComplexity: {
      level: 'medium',
      score: 5,
      factors: {
        informationProcessing: 5,
        reasoning: 5,
        problemSolving: 5,
        metacognition: 4
      },
      description: 'Moderate cognitive complexity'
    },
    difficultyAnalysis: {
      overallScore: 5,
      factors: {
        contentComplexity: 5,
        cognitiveLoad: 5,
        prerequisiteKnowledge: 5,
        timeRequired: 5,
        languageComplexity: 4
      },
      recommendations: {
        gradeLevel: grade,
        scaffolding: ['Provide examples', 'Break into steps'],
        modifications: ['Add visual aids']
      }
    },
    keywords,
    concepts,
    skills: ['Problem solving', 'Critical thinking'],
    estimatedTime: 5,
    prerequisites: ['Basic knowledge']
  };
}

/**
 * Batch analyze multiple questions
 */
export async function analyzeQuestionsBatch(questions: string[], subject: string, grade: string): Promise<QuestionAnalysis[]> {
  const analyses = await Promise.allSettled(
    questions.map(question => analyzeQuestion(question, subject, grade))
  );
  
  return analyses.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Failed to analyze question ${index + 1}:`, result.reason);
      return generateFallbackAnalysis(questions[index], subject, grade);
    }
  });
}

/**
 * Get Bloom's taxonomy level by keywords
 */
export function getBloomLevelByKeywords(questionText: string): BloomTaxonomyLevel {
  const text = questionText.toLowerCase();
  
  for (const level of BLOOM_TAXONOMY_LEVELS) {
    if (level.keywords.some(keyword => text.includes(keyword))) {
      return level;
    }
  }
  
  return BLOOM_TAXONOMY_LEVELS[1]; // Default to 'understand'
}

/**
 * Calculate overall assignment difficulty
 */
export function calculateAssignmentDifficulty(analyses: QuestionAnalysis[]): {
  averageDifficulty: number;
  difficultyDistribution: { [key: string]: number };
  recommendedGradeLevel: string;
} {
  if (analyses.length === 0) {
    return {
      averageDifficulty: 5,
      difficultyDistribution: { low: 0, medium: 0, high: 0, very_high: 0 },
      recommendedGradeLevel: '9-10'
    };
  }
  
  const averageDifficulty = analyses.reduce((sum, analysis) => sum + analysis.difficultyAnalysis.overallScore, 0) / analyses.length;
  
  const difficultyDistribution = analyses.reduce((dist, analysis) => {
    const level = analysis.cognitiveComplexity.level;
    dist[level] = (dist[level] || 0) + 1;
    return dist;
  }, {} as { [key: string]: number });
  
  // Determine recommended grade level based on average difficulty
  let recommendedGradeLevel = '9-10';
  if (averageDifficulty <= 3) recommendedGradeLevel = '6-7';
  else if (averageDifficulty <= 5) recommendedGradeLevel = '7-8';
  else if (averageDifficulty <= 7) recommendedGradeLevel = '9-10';
  else if (averageDifficulty <= 9) recommendedGradeLevel = '11-12';
  else recommendedGradeLevel = '12+';
  
  return {
    averageDifficulty: Math.round(averageDifficulty * 10) / 10,
    difficultyDistribution,
    recommendedGradeLevel
  };
}