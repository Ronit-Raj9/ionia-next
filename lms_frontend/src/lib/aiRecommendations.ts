import { personalizeAssignment } from './groq';
import { personalizeAssignmentFallback } from './openai';
import { Progress, StudentProfile, Assignment } from './db';

// AI-powered assignment suggestions for teachers
export async function generateAssignmentSuggestions(
  classWeaknesses: string[],
  averageMastery: number,
  subject: string = 'mathematics'
): Promise<Assignment['suggestions']> {
  try {
    const weaknessesText = classWeaknesses.join(', ');
    const prompt = `
Based on class performance data:
- Subject: ${subject}
- Weaknesses: ${weaknessesText}
- Average mastery: ${averageMastery}%

Suggest 3-5 next assignment tasks that would help address these weaknesses. 
For each suggestion, provide:
1. A clear task description
2. The specific weakness it addresses
3. Difficulty level (easy/medium/hard)
4. Estimated completion time in minutes

Format as JSON array with objects containing: recommendedTask, basedOn, difficulty, estimatedTime.
Focus on CBSE/ICSE curriculum standards for Indian schools.
`;

    const response = await personalizeAssignment({
      questions: [`Generate assignment suggestions for: ${classWeaknesses.join(', ')}`],
      studentProfile: {
        weaknesses: classWeaknesses,
        personalityType: 'analytical',
        intellectualStrengths: ['problem-solving']
      }
    });
    
    // Parse AI response and format as suggestions
    let suggestions: Assignment['suggestions'] = [];
    
    try {
      // The response is already a PersonalizationResponse object
      if (response.questions && Array.isArray(response.questions)) {
        suggestions = response.questions.map((question: string, index: number) => ({
          recommendedTask: question || 'Practice problems',
          basedOn: classWeaknesses[index] || 'General improvement',
          difficulty: 'medium',
          estimatedTime: 30
        }));
      }
    } catch (parseError) {
      // Fallback: create suggestions from response text
      suggestions = [
        {
          recommendedTask: `Address ${classWeaknesses[0] || 'core concepts'} with targeted practice`,
          basedOn: `Class weakness in ${classWeaknesses[0] || 'fundamentals'}`,
          difficulty: averageMastery < 60 ? 'easy' : averageMastery < 80 ? 'medium' : 'hard',
          estimatedTime: 30
        },
        {
          recommendedTask: 'Mixed practice problems covering multiple topics',
          basedOn: 'Comprehensive skill building',
          difficulty: 'medium',
          estimatedTime: 45
        }
      ];
    }

    return suggestions;
  } catch (error) {
    console.error('Error generating assignment suggestions:', error);
    
    // Fallback suggestions based on common patterns
    return [
      {
        recommendedTask: 'Basic arithmetic and number operations',
        basedOn: 'Foundation strengthening',
        difficulty: 'easy',
        estimatedTime: 25
      },
      {
        recommendedTask: 'Word problems and application-based questions',
        basedOn: 'Problem-solving skills',
        difficulty: 'medium',
        estimatedTime: 35
      },
      {
        recommendedTask: 'Advanced concepts and challenging problems',
        basedOn: 'Higher-order thinking',
        difficulty: 'hard',
        estimatedTime: 50
      }
    ];
  }
}

// Generate adaptive learning path for students
export async function generateAdaptivePath(
  studentProfile: StudentProfile,
  currentMastery: Record<string, number>
): Promise<string[]> {
  try {
    const weaknesses = studentProfile.previousPerformance.weaknesses.join(', ');
    const strengths = studentProfile.intellectualProfile.strengths.join(', ');
    
    const prompt = `
Student Profile:
- Learning style: ${studentProfile.personalityProfile.type}
- Strengths: ${strengths}
- Weaknesses: ${weaknesses}
- Current mastery levels: ${JSON.stringify(currentMastery)}

Create an adaptive learning path with 5-7 sequential topics/skills.
Start with reinforcing weak areas, then build towards advanced concepts.
Consider the student's learning style and strengths.

Return as JSON array of topic names in learning order.
`;

    const response = await personalizeAssignment({
      questions: ['Generate adaptive learning path'],
      studentProfile: {
        weaknesses: studentProfile.previousPerformance.weaknesses,
        personalityType: studentProfile.personalityProfile.type,
        intellectualStrengths: studentProfile.intellectualProfile.strengths
      }
    });
    
    try {
      // Use the variations field from the response
      const pathItems = response.variations ? response.variations.split(',').map(item => item.trim()) : [];
      if (pathItems.length > 0) {
        return pathItems.slice(0, 7); // Limit to 7 items
      }
    } catch (parseError) {
      // Fallback path based on weaknesses
      const fallbackPath = [
        'Number Systems Review',
        'Basic Operations',
        'Fractions and Decimals',
        'Algebra Fundamentals',
        'Geometry Basics',
        'Problem Solving Strategies',
        'Advanced Applications'
      ];
      
      return fallbackPath;
    }
  } catch (error) {
    console.error('Error generating adaptive path:', error);
    
    // Default learning path
    return [
      'Foundation Review',
      'Core Concepts',
      'Practice Problems',
      'Application Tasks',
      'Advanced Challenges'
    ];
  }

  return [];
}

// Generate hints for students during problem solving
export async function generateHint(
  question: string,
  studentProfile: StudentProfile,
  previousAttempts: string[] = []
): Promise<string> {
  try {
    const learningStyle = studentProfile.personalityProfile.type;
    const attemptsText = previousAttempts.length > 0 
      ? `Previous attempts: ${previousAttempts.join(', ')}` 
      : 'First attempt';
    
    const prompt = `
Question: ${question}
Student learning style: ${learningStyle}
${attemptsText}

Provide a helpful hint that guides the student without giving away the answer.
Adapt the hint style to the student's learning preference.
Keep it encouraging and specific to their learning style.
Maximum 2 sentences.
`;

    const response = await personalizeAssignment({
      questions: [question],
      studentProfile: {
        weaknesses: studentProfile.previousPerformance.weaknesses,
        personalityType: studentProfile.personalityProfile.type,
        intellectualStrengths: studentProfile.intellectualProfile.strengths
      }
    });
    
    // Clean up the response - use variations field
    const hint = response.variations ? response.variations.replace(/['"]/g, '').trim() : '';
    
    return hint || "Break down the problem into smaller steps and identify what you know versus what you need to find.";
  } catch (error) {
    console.error('Error generating hint:', error);
    
    // Fallback hints based on learning style
    const fallbackHints = {
      'visual': "Try drawing a diagram or picture to represent the problem.",
      'auditory': "Read the problem aloud and think about what it's asking step by step.",
      'kinesthetic': "Use physical objects or your fingers to work through the problem.",
      'reading': "Underline key information and write out what you know and what you need to find."
    };
    
    const style = studentProfile.personalityProfile.type.toLowerCase();
    return fallbackHints[style as keyof typeof fallbackHints] || 
           "Take your time and break the problem into smaller, manageable parts.";
  }
}

// Generate parent-friendly progress summary
export async function generateParentSummary(
  progress: Progress,
  studentName: string
): Promise<string> {
  try {
    const recentScore = progress.advancedMetrics?.scoreUplift || 0;
    const strengths = progress.metrics.strengths?.join(', ') || 'problem solving';
    const weaknesses = progress.metrics.weaknesses.join(', ');
    
    const prompt = `
Generate a positive, encouraging summary for parents about their child's progress:

Student: ${studentName}
Recent score improvement: ${recentScore}%
Strengths: ${strengths}
Areas for growth: ${weaknesses}
Completion rate: ${progress.metrics.completionRate || 85}%

Write 2-3 sentences that:
1. Highlight positive progress and strengths
2. Mention areas for continued focus (diplomatically)
3. Provide encouragement and next steps

Keep it positive, specific, and actionable for parents.
`;

    const response = await personalizeAssignment({
      questions: ['Generate parent summary'],
      studentProfile: {
        weaknesses: progress.metrics.weaknesses || [],
        personalityType: 'analytical',
        intellectualStrengths: progress.metrics.strengths || []
      }
    });
    
    return (response.variations || '').replace(/['"]/g, '').trim() || 
           `${studentName} is making steady progress in mathematics. They show particular strength in ${strengths} and are working to improve in ${weaknesses}. With continued practice, they're on track for excellent growth this term.`;
  } catch (error) {
    console.error('Error generating parent summary:', error);
    
    return `${studentName} is actively engaged in their learning and showing consistent effort. They're developing strong problem-solving skills and making good progress across all areas. Keep encouraging their curiosity and practice at home!`;
  }
}
