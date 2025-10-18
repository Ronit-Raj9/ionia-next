/**
 * Comprehensive Resource Linking System
 * Manages connections between assignments, study materials, and educational resources
 */

import { generateAIResponse } from './gemini-service';
import { analyzeQuestion } from './questionAnalyzer';

export interface EducationalResource {
  id: string;
  title: string;
  type: 'textbook' | 'video' | 'article' | 'exercise' | 'lab' | 'reference' | 'interactive' | 'assessment';
  description: string;
  url?: string;
  fileUrl?: string;
  subject: string;
  grade: string;
  topics: string[];
  tags: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  author?: string;
  publisher?: string;
  isbn?: string;
  chapter?: string;
  pageRange?: string;
  learningObjectives: string[];
  prerequisites: string[];
  relatedConcepts: string[];
  bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  cognitiveComplexity: 'low' | 'medium' | 'high' | 'very_high';
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating?: number;
  isBookmarked: boolean;
  metadata: {
    language: string;
    format: string;
    accessibility: string[];
    cost: 'free' | 'paid' | 'subscription';
    license: string;
    lastUpdated: Date;
  };
}

export interface ResourceLink {
  id: string;
  sourceId: string; // Assignment or question ID
  targetId: string; // Resource ID
  linkType: 'prerequisite' | 'supplementary' | 'alternative' | 'extension' | 'assessment' | 'reference';
  strength: 'weak' | 'medium' | 'strong'; // How strongly related
  relevance: number; // 0-1 score
  context: string; // Why this resource is linked
  learningObjective: string; // What this link helps achieve
  suggestedUsage: 'before' | 'during' | 'after' | 'optional';
  estimatedTime: number; // Additional time needed
  difficultyAdjustment: number; // -2 to +2
  createdAt: Date;
  createdBy: string; // Teacher or system
  isActive: boolean;
}

export interface ResourceRecommendation {
  resource: EducationalResource;
  linkType: ResourceLink['linkType'];
  relevance: number;
  reasoning: string;
  suggestedUsage: ResourceLink['suggestedUsage'];
  estimatedTime: number;
  difficultyAdjustment: number;
  learningObjective: string;
}

export interface LinkingRequest {
  assignmentId: string;
  questions: string[];
  subject: string;
  grade: string;
  topic: string;
  studentProfiles?: any[]; // For personalized recommendations
  learningObjectives: string[];
  targetDifficulty: 'easy' | 'medium' | 'hard';
  timeConstraints?: number; // Maximum additional time in minutes
  resourceTypes?: EducationalResource['type'][];
  excludeTypes?: EducationalResource['type'][];
}

/**
 * Generate resource recommendations for an assignment
 */
export async function generateResourceRecommendations(request: LinkingRequest): Promise<ResourceRecommendation[]> {
  try {
    // Analyze questions to understand requirements
    const questionAnalyses = await Promise.all(
      request.questions.map(question => analyzeQuestion(question, request.subject, request.grade))
    );
    
    // Get available resources
    const availableResources = await getAvailableResources(request);
    
    // Generate AI-powered recommendations
    const recommendations = await generateAIResourceRecommendations(
      request,
      questionAnalyses,
      availableResources
    );
    
    // Filter and rank recommendations
    const filteredRecommendations = filterAndRankRecommendations(
      recommendations,
      request,
      questionAnalyses
    );
    
    return filteredRecommendations;
    
  } catch (error) {
    console.error('Resource recommendation error:', error);
    return generateFallbackRecommendations(request);
  }
}

/**
 * Get available resources based on criteria
 */
async function getAvailableResources(request: LinkingRequest): Promise<EducationalResource[]> {
  // Mock data - replace with actual database query
  const mockResources: EducationalResource[] = [
    {
      id: '1',
      title: 'Algebra Fundamentals Textbook',
      type: 'textbook',
      description: 'Comprehensive guide to algebraic concepts and problem-solving techniques',
      url: 'https://example.com/algebra-fundamentals',
      subject: request.subject,
      grade: request.grade,
      topics: [request.topic],
      tags: ['algebra', 'fundamentals', 'problem-solving'],
      difficulty: 'intermediate',
      estimatedTime: 45,
      author: 'Dr. John Smith',
      publisher: 'Educational Press',
      isbn: '978-1234567890',
      chapter: 'Chapter 3',
      pageRange: '45-67',
      learningObjectives: ['Understand algebraic concepts', 'Solve basic equations'],
      prerequisites: ['Basic arithmetic', 'Number sense'],
      relatedConcepts: ['Variables', 'Equations', 'Problem solving'],
      bloomLevel: 'understand',
      cognitiveComplexity: 'medium',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      usageCount: 23,
      rating: 4.5,
      isBookmarked: false,
      metadata: {
        language: 'en',
        format: 'pdf',
        accessibility: ['screen-reader', 'text-to-speech'],
        cost: 'paid',
        license: 'educational',
        lastUpdated: new Date('2024-01-15')
      }
    },
    {
      id: '2',
      title: 'Quadratic Equations Video Tutorial',
      type: 'video',
      description: 'Step-by-step video explanation of quadratic equations with examples',
      url: 'https://youtube.com/watch?v=example',
      subject: request.subject,
      grade: request.grade,
      topics: [request.topic],
      tags: ['quadratic', 'equations', 'video', 'tutorial'],
      difficulty: 'basic',
      estimatedTime: 20,
      author: 'Math Academy',
      learningObjectives: ['Learn quadratic equation solving', 'Practice with examples'],
      prerequisites: ['Basic algebra'],
      relatedConcepts: ['Quadratic equations', 'Factoring', 'Graphing'],
      bloomLevel: 'apply',
      cognitiveComplexity: 'low',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
      usageCount: 156,
      rating: 4.8,
      isBookmarked: true,
      metadata: {
        language: 'en',
        format: 'video',
        accessibility: ['captions', 'transcript'],
        cost: 'free',
        license: 'creative-commons',
        lastUpdated: new Date('2024-01-10')
      }
    },
    {
      id: '3',
      title: 'Interactive Algebra Practice',
      type: 'interactive',
      description: 'Interactive exercises for practicing algebraic problem solving',
      url: 'https://example.com/interactive-algebra',
      subject: request.subject,
      grade: request.grade,
      topics: [request.topic],
      tags: ['interactive', 'practice', 'algebra', 'exercises'],
      difficulty: 'intermediate',
      estimatedTime: 30,
      author: 'Interactive Learning Inc.',
      learningObjectives: ['Practice algebraic skills', 'Get immediate feedback'],
      prerequisites: ['Basic algebra knowledge'],
      relatedConcepts: ['Problem solving', 'Algebraic manipulation'],
      bloomLevel: 'apply',
      cognitiveComplexity: 'medium',
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-08'),
      usageCount: 89,
      rating: 4.2,
      isBookmarked: false,
      metadata: {
        language: 'en',
        format: 'web',
        accessibility: ['keyboard-navigation', 'screen-reader'],
        cost: 'free',
        license: 'open-source',
        lastUpdated: new Date('2024-01-08')
      }
    }
  ];
  
  // Filter resources based on request criteria
  return mockResources.filter(resource => {
    // Subject and grade match
    if (resource.subject !== request.subject || resource.grade !== request.grade) {
      return false;
    }
    
    // Topic match
    if (!resource.topics.includes(request.topic)) {
      return false;
    }
    
    // Resource type filter
    if (request.resourceTypes && !request.resourceTypes.includes(resource.type)) {
      return false;
    }
    
    if (request.excludeTypes && request.excludeTypes.includes(resource.type)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Generate AI-powered resource recommendations
 */
async function generateAIResourceRecommendations(
  request: LinkingRequest,
  questionAnalyses: any[],
  availableResources: EducationalResource[]
): Promise<ResourceRecommendation[]> {
  try {
    const prompt = createResourceRecommendationPrompt(request, questionAnalyses, availableResources);
    console.log('🔍 Generating AI resource recommendations with Gemini 2.5 Flash...');
    
    const aiResponse = await generateAIResponse(prompt);
    
    if (!aiResponse || aiResponse.trim() === '') {
      console.error('❌ Empty response from Gemini API for resource recommendations');
      throw new Error('Empty response from Gemini API');
    }
    
    console.log('✅ Received resource recommendations from Gemini API, length:', aiResponse.length);
    
    return parseResourceRecommendations(aiResponse, availableResources);
    
  } catch (error) {
    console.error('AI resource recommendation error:', error);
    return generateFallbackRecommendations(request);
  }
}

/**
 * Create prompt for AI resource recommendations
 */
function createResourceRecommendationPrompt(
  request: LinkingRequest,
  questionAnalyses: any[],
  availableResources: EducationalResource[]
): string {
  return `
You are an expert educational resource curator. Recommend the best resources for the given assignment.

**Assignment Context:**
- Subject: ${request.subject}
- Grade: ${request.grade}
- Topic: ${request.topic}
- Target Difficulty: ${request.targetDifficulty}
- Learning Objectives: ${request.learningObjectives.join(', ')}

**Questions Analysis:**
${questionAnalyses.map((analysis, index) => `
Question ${index + 1}: ${request.questions[index]}
- Bloom's Level: ${analysis.bloomTaxonomy.level}
- Cognitive Complexity: ${analysis.cognitiveComplexity.level}
- Difficulty: ${analysis.difficultyAnalysis.overallScore}/10
- Key Concepts: ${analysis.concepts.join(', ')}
- Prerequisites: ${analysis.prerequisites.join(', ')}
`).join('\n')}

**Available Resources:**
${availableResources.map(resource => `
- ${resource.title} (${resource.type})
  Description: ${resource.description}
  Difficulty: ${resource.difficulty}
  Time: ${resource.estimatedTime} min
  Bloom Level: ${resource.bloomLevel}
  Concepts: ${resource.relatedConcepts.join(', ')}
  Prerequisites: ${resource.prerequisites.join(', ')}
`).join('\n')}

**Recommendation Requirements:**
1. Match resources to question requirements and learning objectives
2. Consider prerequisite knowledge and difficulty progression
3. Suggest appropriate link types (prerequisite, supplementary, alternative, extension, assessment, reference)
4. Provide reasoning for each recommendation
5. Consider time constraints and student profiles
6. Ensure variety in resource types

**Return ONLY valid JSON in this format:**
{
  "recommendations": [
    {
      "resourceId": "resource_id",
      "linkType": "prerequisite|supplementary|alternative|extension|assessment|reference",
      "relevance": 0.85,
      "reasoning": "This resource provides essential prerequisite knowledge for understanding quadratic equations",
      "suggestedUsage": "before|during|after|optional",
      "estimatedTime": 20,
      "difficultyAdjustment": -1,
      "learningObjective": "Master basic algebraic concepts before tackling quadratic equations"
    }
  ]
}

**Guidelines:**
- Prioritize resources that directly support learning objectives
- Consider the cognitive complexity and Bloom's taxonomy alignment
- Suggest resources that address identified prerequisites
- Provide variety in resource types and difficulty levels
- Consider time constraints and student engagement
`;
}

/**
 * Parse AI resource recommendations
 */
function parseResourceRecommendations(
  response: string,
  availableResources: EducationalResource[]
): ResourceRecommendation[] {
  try {
    // Try multiple JSON extraction methods
    let jsonString = '';
    
    // Method 1: Look for complete JSON object
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    } else {
      // Method 2: Look for JSON array
      const arrayMatch = response.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonString = `{"recommendations": ${arrayMatch[0]}}`;
      } else {
        // Method 3: Try to extract from markdown code blocks
        const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1];
        }
      }
    }
    
    if (!jsonString) {
      console.warn('No valid JSON found in response, using fallback');
      return generateFallbackRecommendations({ 
        assignmentId: 'fallback',
        subject: 'General', 
        grade: '10', 
        topic: 'General',
        questions: [],
        learningObjectives: ['General learning'],
        targetDifficulty: 'medium' as const
      });
    }
    
    // Clean up the JSON string
    jsonString = jsonString.trim();
    
    // Try to fix common JSON issues
    jsonString = jsonString
      .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
      .replace(/,\s*]/g, ']') // Remove trailing commas before closing brackets
      .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
      .replace(/:(\w+)/g, ':"$1"') // Quote unquoted string values
      .replace(/:(\d+\.?\d*)/g, ':$1') // Keep numbers unquoted
      .replace(/:true/g, ':true') // Keep booleans unquoted
      .replace(/:false/g, ':false')
      .replace(/:null/g, ':null');
    
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn('JSON parsing failed, attempting to fix common issues:', parseError);
      // Try to fix common JSON issues
      jsonString = jsonString
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*([^",{\[\s][^",}\]\]]*?)(\s*[,}\]])/g, ':"$1"$2'); // Quote unquoted string values
      
      try {
        data = JSON.parse(jsonString);
      } catch (secondError) {
        console.error('JSON parsing failed after cleanup, using fallback:', secondError);
        return generateFallbackRecommendations({ 
          assignmentId: 'fallback',
          subject: 'General', 
          grade: '10', 
          topic: 'General',
          questions: [],
          learningObjectives: ['General learning'],
          targetDifficulty: 'medium' as const
        });
      }
    }
    
    const recommendations = data.recommendations || [];
    
    return recommendations.map((rec: any) => {
      const resource = availableResources.find(r => r.id === rec.resourceId);
      if (!resource) return null;
      
      return {
        resource,
        linkType: rec.linkType || 'supplementary',
        relevance: Math.max(0, Math.min(1, rec.relevance || 0.5)),
        reasoning: rec.reasoning || 'Recommended based on content alignment',
        suggestedUsage: rec.suggestedUsage || 'optional',
        estimatedTime: rec.estimatedTime || resource.estimatedTime,
        difficultyAdjustment: Math.max(-2, Math.min(2, rec.difficultyAdjustment || 0)),
        learningObjective: rec.learningObjective || 'Support learning objectives'
      };
    }).filter(Boolean);
    
  } catch (error) {
    console.error('Error parsing resource recommendations:', error);
    return [];
  }
}

/**
 * Filter and rank recommendations
 */
function filterAndRankRecommendations(
  recommendations: ResourceRecommendation[],
  request: LinkingRequest,
  questionAnalyses: any[]
): ResourceRecommendation[] {
  // Filter by time constraints
  let filtered = recommendations;
  if (request.timeConstraints) {
    filtered = filtered.filter(rec => rec.estimatedTime <= request.timeConstraints!);
  }
  
  // Remove duplicates
  const uniqueRecommendations = filtered.reduce((acc, rec) => {
    const existing = acc.find(r => r.resource.id === rec.resource.id);
    if (!existing || rec.relevance > existing.relevance) {
      return acc.filter(r => r.resource.id !== rec.resource.id).concat(rec);
    }
    return acc;
  }, [] as ResourceRecommendation[]);
  
  // Rank by relevance and other factors
  return uniqueRecommendations
    .sort((a, b) => {
      // Primary sort by relevance
      if (Math.abs(a.relevance - b.relevance) > 0.1) {
        return b.relevance - a.relevance;
      }
      
      // Secondary sort by resource rating
      const aRating = a.resource.rating || 0;
      const bRating = b.resource.rating || 0;
      if (Math.abs(aRating - bRating) > 0.5) {
        return bRating - aRating;
      }
      
      // Tertiary sort by usage count
      return b.resource.usageCount - a.resource.usageCount;
    })
    .slice(0, 10); // Limit to top 10 recommendations
}

/**
 * Generate fallback recommendations when AI fails
 */
function generateFallbackRecommendations(request: LinkingRequest): ResourceRecommendation[] {
  // Simple fallback based on topic matching
  return [
    {
      resource: {
        id: 'fallback-1',
        title: `${request.topic} Study Guide`,
        type: 'reference',
        description: `Comprehensive study guide for ${request.topic}`,
        subject: request.subject,
        grade: request.grade,
        topics: [request.topic],
        tags: [request.topic, 'study-guide'],
        difficulty: 'intermediate',
        estimatedTime: 30,
        learningObjectives: [`Learn ${request.topic} concepts`],
        prerequisites: [],
        relatedConcepts: [request.topic],
        bloomLevel: 'understand',
        cognitiveComplexity: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        isBookmarked: false,
        metadata: {
          language: 'en',
          format: 'text',
          accessibility: [],
          cost: 'free',
          license: 'educational',
          lastUpdated: new Date()
        }
      },
      linkType: 'supplementary',
      relevance: 0.7,
      reasoning: 'General study guide for the topic',
      suggestedUsage: 'optional',
      estimatedTime: 30,
      difficultyAdjustment: 0,
      learningObjective: 'Provide additional support for learning'
    }
  ];
}

/**
 * Create resource links for an assignment
 */
export async function createResourceLinks(
  assignmentId: string,
  recommendations: ResourceRecommendation[],
  createdBy: string
): Promise<ResourceLink[]> {
  const links: ResourceLink[] = recommendations.map(rec => ({
    id: `${assignmentId}-${rec.resource.id}-${Date.now()}`,
    sourceId: assignmentId,
    targetId: rec.resource.id,
    linkType: rec.linkType,
    strength: rec.relevance > 0.8 ? 'strong' : rec.relevance > 0.6 ? 'medium' : 'weak',
    relevance: rec.relevance,
    context: rec.reasoning,
    learningObjective: rec.learningObjective,
    suggestedUsage: rec.suggestedUsage,
    estimatedTime: rec.estimatedTime,
    difficultyAdjustment: rec.difficultyAdjustment,
    createdAt: new Date(),
    createdBy,
    isActive: true
  }));
  
  // Save links to database (mock implementation)
  console.log('Creating resource links:', links);
  
  return links;
}

/**
 * Get resource links for an assignment
 */
export async function getResourceLinks(assignmentId: string): Promise<ResourceLink[]> {
  // Mock implementation - replace with actual database query
  return [];
}

/**
 * Update resource link
 */
export async function updateResourceLink(
  linkId: string,
  updates: Partial<ResourceLink>
): Promise<ResourceLink | null> {
  // Mock implementation - replace with actual database update
  console.log('Updating resource link:', linkId, updates);
  return null;
}

/**
 * Delete resource link
 */
export async function deleteResourceLink(linkId: string): Promise<boolean> {
  // Mock implementation - replace with actual database delete
  console.log('Deleting resource link:', linkId);
  return true;
}

/**
 * Get personalized resource recommendations for a student
 */
export async function getPersonalizedResourceRecommendations(
  studentId: string,
  assignmentId: string,
  studentProfile: any
): Promise<ResourceRecommendation[]> {
  try {
    // Get base recommendations
    const baseRecommendations = await getResourceLinks(assignmentId);
    
    // Personalize based on student profile
    const personalizedRecommendations = await personalizeResourceRecommendations(
      baseRecommendations,
      studentProfile
    );
    
    return personalizedRecommendations;
    
  } catch (error) {
    console.error('Personalized resource recommendation error:', error);
    return [];
  }
}

/**
 * Personalize resource recommendations based on student profile
 */
async function personalizeResourceRecommendations(
  baseRecommendations: ResourceLink[],
  studentProfile: any
): Promise<ResourceRecommendation[]> {
  // Mock personalization logic
  return baseRecommendations.map(link => ({
    resource: {
      id: link.targetId,
      title: 'Personalized Resource',
      type: 'reference',
      description: 'Personalized based on student profile',
      subject: 'general',
      grade: '9',
      topics: [],
      tags: [],
      difficulty: 'intermediate',
      estimatedTime: link.estimatedTime,
      learningObjectives: [link.learningObjective],
      prerequisites: [],
      relatedConcepts: [],
      bloomLevel: 'understand',
      cognitiveComplexity: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      isBookmarked: false,
      metadata: {
        language: 'en',
        format: 'text',
        accessibility: [],
        cost: 'free',
        license: 'educational',
        lastUpdated: new Date()
      }
    },
    linkType: link.linkType,
    relevance: link.relevance,
    reasoning: link.context,
    suggestedUsage: link.suggestedUsage,
    estimatedTime: link.estimatedTime,
    difficultyAdjustment: link.difficultyAdjustment,
    learningObjective: link.learningObjective
  }));
}

/**
 * Analyze resource usage and effectiveness
 */
export async function analyzeResourceEffectiveness(
  assignmentId: string,
  timeRange: { start: Date; end: Date }
): Promise<{
  mostUsedResources: { resource: EducationalResource; usageCount: number }[];
  mostEffectiveResources: { resource: EducationalResource; effectivenessScore: number }[];
  recommendations: string[];
}> {
  // Mock analysis - replace with actual analytics
  return {
    mostUsedResources: [],
    mostEffectiveResources: [],
    recommendations: [
      'Consider adding more visual resources for better engagement',
      'Interactive exercises show higher completion rates',
      'Students prefer shorter, focused resources over long-form content'
    ]
  };
}
