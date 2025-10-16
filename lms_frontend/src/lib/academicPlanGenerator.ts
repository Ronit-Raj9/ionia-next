import { generateAIResponse } from '@/lib/gemini-service';
import { gradeSubmission } from '@/lib/groq';

export interface AcademicPlanRequest {
  syllabusText: string;
  calendarText?: string;
  subject: string;
  grade: string;
  academicYear: string;
}

export interface SubTopic {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  learningObjectives: string[];
  keyConcepts: string[];
  activities: string[];
  assessmentMethods: string[];
  resources: {
    type: 'textbook' | 'video' | 'article' | 'exercise' | 'lab';
    title: string;
    description?: string;
    url?: string;
  }[];
  completed: boolean;
  completedDate?: Date;
  notes?: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites: string[];
  learningObjectives: string[];
  keyConceptsToMaster: string[];
  suggestedActivities: string[];
  assessmentMethods: string[];
  resources: {
    type: 'textbook' | 'video' | 'article' | 'exercise' | 'lab';
    title: string;
    description?: string;
    url?: string;
  }[];
  subtopics: SubTopic[];
  scheduledDate?: Date;
  completed: boolean;
  completedDate?: Date;
  notes?: string;
  weekNumber: number;
  monthNumber: number;
  startWeek: number;
  endWeek: number;
}

export interface Holiday {
  name: string;
  date: string;
  type: 'holiday' | 'exam' | 'break' | 'event';
  duration?: number; // in days
}

export interface AcademicPlan {
  overview: {
    subject: string;
    grade: string;
    academicYear: string;
    totalWeeks: number;
    totalHours: number;
    description: string;
    mainGoals: string[];
  };
  topics: Topic[];
  timeline: {
    quarters: {
      quarter: number;
      name: string;
      startWeek: number;
      endWeek: number;
      focusAreas: string[];
      majorAssessments: string[];
    }[];
    milestones: {
      week: number;
      title: string;
      description: string;
      type: 'assessment' | 'project' | 'review' | 'exam';
    }[];
  };
  assessmentStrategy: {
    formativeAssessments: string[];
    summativeAssessments: string[];
    gradingCriteria: string[];
    feedbackMethods: string[];
  };
  differentiationStrategies: {
    forAdvancedLearners: string[];
    forStrugglingLearners: string[];
    forDifferentLearningStyles: string[];
  };
  integrationPoints: {
    homeworkPersonalization: {
      topicBasedAssignment: boolean;
      difficultyAdaptation: boolean;
      prerequisiteChecking: boolean;
      progressTracking: boolean;
    };
    aiRecommendations: {
      nextTopicSuggestions: boolean;
      remedialContentSuggestions: boolean;
      enrichmentActivities: boolean;
    };
  };
}

/**
 * Extract holidays and important dates from calendar text
 */
function extractHolidaysFromCalendar(calendarText: string): Holiday[] {
  const holidays: Holiday[] = [];
  
  if (!calendarText || !calendarText.trim()) {
    return holidays;
  }
  
  // Common holiday patterns
  const holidayPatterns = [
    // Indian holidays
    { pattern: /(diwali|deepavali)/gi, name: 'Diwali', type: 'holiday' as const },
    { pattern: /(holi)/gi, name: 'Holi', type: 'holiday' as const },
    { pattern: /(dussehra|dashara)/gi, name: 'Dussehra', type: 'holiday' as const },
    { pattern: /(eid|eid-ul-fitr)/gi, name: 'Eid', type: 'holiday' as const },
    { pattern: /(christmas)/gi, name: 'Christmas', type: 'holiday' as const },
    { pattern: /(independence day)/gi, name: 'Independence Day', type: 'holiday' as const },
    { pattern: /(republic day)/gi, name: 'Republic Day', type: 'holiday' as const },
    { pattern: /(gandhi jayanti)/gi, name: 'Gandhi Jayanti', type: 'holiday' as const },
    
    // Academic breaks
    { pattern: /(summer vacation|summer break)/gi, name: 'Summer Vacation', type: 'break' as const },
    { pattern: /(winter vacation|winter break)/gi, name: 'Winter Vacation', type: 'break' as const },
    { pattern: /(mid-term break)/gi, name: 'Mid-term Break', type: 'break' as const },
    
    // Exams
    { pattern: /(mid-term exam|midterm)/gi, name: 'Mid-term Exam', type: 'exam' as const },
    { pattern: /(final exam|annual exam)/gi, name: 'Final Exam', type: 'exam' as const },
    { pattern: /(unit test)/gi, name: 'Unit Test', type: 'exam' as const },
    
    // General patterns
    { pattern: /(holiday|break|vacation)/gi, name: 'Holiday', type: 'holiday' as const },
  ];
  
  // Extract dates and holidays
  const lines = calendarText.split('\n');
  
  for (const line of lines) {
    for (const { pattern, name, type } of holidayPatterns) {
      if (pattern.test(line)) {
        // Try to extract date from the line
        const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/gi);
        const date = dateMatch ? dateMatch[0] : 'TBD';
        
        holidays.push({
          name,
          date,
          type,
          duration: type === 'break' ? 7 : 1 // Default duration
        });
        break;
      }
    }
  }
  
  return holidays;
}

/**
 * Generate comprehensive academic plan using LLM
 */
export async function generateAcademicPlan(request: AcademicPlanRequest): Promise<AcademicPlan> {
  try {
    const prompt = createAcademicPlanPrompt(request);
    
    // Use Gemini for comprehensive plan generation
    const llmResponse = await generateAIResponse(prompt);
    
    // Parse and structure the response
    const academicPlan = parseAcademicPlanResponse(llmResponse, request);
    
    // Validate and enhance the plan
    const validatedPlan = validateAndEnhancePlan(academicPlan, request);
    
    return validatedPlan;
    
  } catch (error) {
    console.error('Academic plan generation error:', error);
    
    // Fallback to basic plan generation
    return generateFallbackPlan(request);
  }
}

/**
 * Create detailed prompt for LLM with subtopic breakdown and holiday consideration
 */
function createAcademicPlanPrompt(request: AcademicPlanRequest): string {
  // Extract holidays from calendar text
  const holidays = extractHolidaysFromCalendar(request.calendarText || '');
  
  return `
You are an expert curriculum designer and educational planner. Create a comprehensive, detailed academic plan based on the provided syllabus and calendar information.

**Input Information:**
- Subject: ${request.subject}
- Grade: ${request.grade}
- Academic Year: ${request.academicYear}

**Syllabus Content to Analyze:**
${request.syllabusText}

${request.calendarText ? `**Academic Calendar:**\n${request.calendarText}` : ''}

**Detected Holidays/Non-teaching Days:**
${holidays.length > 0 ? holidays.map(h => `- ${h.name}: ${h.date}`).join('\n') : 'No holidays detected'}

**CRITICAL REQUIREMENTS:**
1. Extract and create 6-12 comprehensive main topics/chapters from the syllabus content
2. Break down each main topic into 4-6 detailed subtopics with specific learning objectives
3. Consider holidays and non-teaching days in timeline planning
4. Create time-goal oriented plan (weekly/bi-weekly goals, not daily)
5. Include specific learning objectives for each subtopic
6. Provide detailed assessment strategies for each topic and subtopic
7. Consider prerequisite relationships between topics
8. Include practical activities and resources for each subtopic
9. Make it extremely detailed and practical for teachers
10. Ensure comprehensive coverage of the entire syllabus content
11. Generate realistic time estimates based on content complexity
12. Create a logical progression from basic to advanced concepts

**Instructions:**
Create a detailed academic plan in JSON format with the following structure:

{
  "overview": {
    "subject": "${request.subject}",
    "grade": "${request.grade}",
    "academicYear": "${request.academicYear}",
    "totalWeeks": <number>,
    "totalHours": <number>,
    "description": "<comprehensive description>",
    "mainGoals": ["<goal1>", "<goal2>", ...]
  },
  "topics": [
    {
      "id": "<unique_id>",
      "title": "<topic_title>",
      "description": "<detailed_description>",
      "difficulty": "basic|intermediate|advanced",
      "estimatedHours": <number>,
      "prerequisites": ["<prerequisite1>", ...],
      "learningObjectives": ["<objective1>", ...],
      "keyConceptsToMaster": ["<concept1>", ...],
      "suggestedActivities": ["<activity1>", ...],
      "assessmentMethods": ["<method1>", ...],
      "resources": [
        {
          "type": "textbook|video|article|exercise|lab",
          "title": "<resource_title>",
          "description": "<description>"
        }
      ],
      "subtopics": [
        {
          "id": "<subtopic_id>",
          "title": "<subtopic_title>",
          "description": "<detailed_subtopic_description>",
          "estimatedHours": <number>,
          "learningObjectives": ["<subtopic_objective1>", ...],
          "keyConcepts": ["<subtopic_concept1>", ...],
          "activities": ["<subtopic_activity1>", ...],
          "assessmentMethods": ["<subtopic_assessment1>", ...],
          "resources": [
            {
              "type": "textbook|video|article|exercise|lab",
              "title": "<subtopic_resource_title>",
              "description": "<description>"
            }
          ],
          "completed": false
        }
      ],
      "completed": false,
      "weekNumber": <week>,
      "monthNumber": <month>,
      "startWeek": <start_week>,
      "endWeek": <end_week>
    }
  ],
  "timeline": {
    "quarters": [
      {
        "quarter": 1,
        "name": "<quarter_name>",
        "startWeek": <week>,
        "endWeek": <week>,
        "focusAreas": ["<area1>", ...],
        "majorAssessments": ["<assessment1>", ...]
      }
    ],
    "milestones": [
      {
        "week": <week>,
        "title": "<milestone_title>",
        "description": "<description>",
        "type": "assessment|project|review|exam"
      }
    ]
  },
  "assessmentStrategy": {
    "formativeAssessments": ["<method1>", ...],
    "summativeAssessments": ["<method1>", ...],
    "gradingCriteria": ["<criteria1>", ...],
    "feedbackMethods": ["<method1>", ...]
  },
  "differentiationStrategies": {
    "forAdvancedLearners": ["<strategy1>", ...],
    "forStrugglingLearners": ["<strategy1>", ...],
    "forDifferentLearningStyles": ["<strategy1>", ...]
  },
  "integrationPoints": {
    "homeworkPersonalization": {
      "topicBasedAssignment": true,
      "difficultyAdaptation": true,
      "prerequisiteChecking": true,
      "progressTracking": true
    },
    "aiRecommendations": {
      "nextTopicSuggestions": true,
      "remedialContentSuggestions": true,
      "enrichmentActivities": true
    }
  }
}

**Requirements:**
1. Analyze the syllabus content thoroughly
2. Create 15-25 topics covering the entire curriculum
3. Sequence topics logically with proper prerequisites
4. Distribute topics across 36-40 weeks (typical academic year)
5. Include diverse assessment methods
6. Provide differentiation strategies for different learner types
7. Ensure integration points for future AI-powered homework personalization
8. Make the plan practical and implementable
9. Include specific learning objectives and key concepts for each topic
10. Suggest appropriate resources and activities

Return ONLY the JSON object, no additional text or formatting.
`;
}

/**
 * Parse LLM response into structured academic plan
 */
function parseAcademicPlanResponse(llmResponse: string, request: AcademicPlanRequest): AcademicPlan {
  try {
    // Clean the response to extract JSON
    let jsonString = llmResponse.trim();
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsedPlan = JSON.parse(jsonString) as AcademicPlan;
    
    // Add unique IDs to topics if not present
    parsedPlan.topics = parsedPlan.topics.map((topic, index) => ({
      ...topic,
      id: topic.id || `topic_${index + 1}`,
      completed: false,
      completedDate: undefined,
      notes: ''
    }));
    
    return parsedPlan;
    
  } catch (parseError) {
    console.error('Failed to parse LLM response:', parseError);
    console.log('Raw LLM response:', llmResponse);
    
    // Return fallback plan if parsing fails
    throw new Error('Failed to parse academic plan from LLM response');
  }
}

/**
 * Validate and enhance the generated plan
 */
function validateAndEnhancePlan(plan: AcademicPlan, request: AcademicPlanRequest): AcademicPlan {
  // Ensure all required fields are present
  if (!plan.overview) {
    plan.overview = {
      subject: request.subject,
      grade: request.grade,
      academicYear: request.academicYear,
      totalWeeks: 36,
      totalHours: 180,
      description: `Comprehensive ${request.subject} curriculum for Grade ${request.grade}`,
      mainGoals: [`Master ${request.subject} concepts`, 'Develop critical thinking skills']
    };
  }
  
  if (!plan.topics || plan.topics.length === 0) {
    throw new Error('No topics generated in academic plan');
  }
  
  // Ensure topics have proper sequencing
  plan.topics = plan.topics.map((topic, index) => ({
    ...topic,
    weekNumber: topic.weekNumber || Math.floor(index / 2) + 1,
    monthNumber: topic.monthNumber || Math.floor(index / 8) + 1
  }));
  
  // Ensure integration points are set
  if (!plan.integrationPoints) {
    plan.integrationPoints = {
      homeworkPersonalization: {
        topicBasedAssignment: true,
        difficultyAdaptation: true,
        prerequisiteChecking: true,
        progressTracking: true
      },
      aiRecommendations: {
        nextTopicSuggestions: true,
        remedialContentSuggestions: true,
        enrichmentActivities: true
      }
    };
  }
  
  return plan;
}

/**
 * Generate fallback plan if LLM fails
 */
function generateFallbackPlan(request: AcademicPlanRequest): AcademicPlan {
  // Extract holidays from calendar
  const holidays = extractHolidaysFromCalendar(request.calendarText || '');
  
  // Generate topics from real syllabus content
  const topics = generateTopicsFromSyllabus(request.syllabusText, request.subject, request.grade);
  
  // Calculate total weeks considering holidays
  const totalWeeks = calculateTotalWeeks(holidays);
  const totalHours = topics.reduce((sum, topic) => sum + topic.estimatedHours, 0);
  
  return {
    overview: {
      subject: request.subject,
      grade: request.grade,
      academicYear: request.academicYear,
      totalWeeks,
      totalHours,
      description: `Comprehensive ${request.subject} curriculum for Grade ${request.grade} with detailed subtopic breakdown and holiday consideration`,
      mainGoals: [
        `Master fundamental ${request.subject} concepts through structured learning`,
        'Develop problem-solving skills with practical applications',
        'Complete curriculum with time-goal oriented approach',
        'Prepare for advanced studies with solid foundation'
      ]
    },
    topics,
    timeline: generateTimelineWithHolidays(totalWeeks, holidays, topics),
    assessmentStrategy: {
      formativeAssessments: ['Weekly quizzes', 'Homework assignments', 'Class participation'],
      summativeAssessments: ['Unit tests', 'Projects', 'Final exam'],
      gradingCriteria: ['Understanding of concepts', 'Problem-solving ability', 'Communication skills'],
      feedbackMethods: ['Written feedback', 'Peer review', 'Teacher conferences']
    },
    differentiationStrategies: {
      forAdvancedLearners: ['Extension activities', 'Independent projects', 'Peer tutoring opportunities'],
      forStrugglingLearners: ['Additional practice', 'Simplified explanations', 'Extra support sessions'],
      forDifferentLearningStyles: ['Visual aids', 'Hands-on activities', 'Audio resources']
    },
    integrationPoints: {
      homeworkPersonalization: {
        topicBasedAssignment: true,
        difficultyAdaptation: true,
        prerequisiteChecking: true,
        progressTracking: true
      },
      aiRecommendations: {
        nextTopicSuggestions: true,
        remedialContentSuggestions: true,
        enrichmentActivities: true
      }
    }
  };
}

/**
 * Generate topics from real syllabus content
 */
function generateTopicsFromSyllabus(syllabusText: string, subject: string, grade: string): Topic[] {
  const topics: Topic[] = [];
  
  if (!syllabusText || !syllabusText.trim()) {
    return generateMinimalFallbackTopics(subject, grade);
  }
  
  // Extract topics from syllabus text
  const extractedTopics = extractTopicsFromText(syllabusText, subject, grade);
  
  return extractedTopics;
}

/**
 * Extract topics from syllabus text using enhanced pattern matching
 */
function extractTopicsFromText(text: string, subject: string, grade: string): Topic[] {
  const topics: Topic[] = [];
  
  // Enhanced patterns for better topic extraction
  const patterns = [
    // Chapter patterns
    /(?:chapter|unit|module|section)\s*(\d+)[:\.\s]+([^\n\r]+)/gi,
    /(?:chapter|unit|module|section)\s*(\d+)[:\.\s]*([^\n\r]+)/gi,
    
    // Topic patterns
    /(?:topic|lesson)\s*(\d+)[:\.\s]+([^\n\r]+)/gi,
    /(?:topic|lesson)\s*(\d+)[:\.\s]*([^\n\r]+)/gi,
    
    // Numbered lists
    /^(\d+)[:\.\s]+([^\n\r]+)/gm,
    /^(\d+\.\d+)\s+([^\n\r]+)/gm,
    /^(\d+\.\d+\.\d+)\s+([^\n\r]+)/gm,
    
    // Bullet points and dashes
    /^[-•]\s+([^\n\r]+)/gm,
    /^[*]\s+([^\n\r]+)/gm,
    
    // Capitalized headings
    /^([A-Z][A-Za-z\s]+):/gm,
    /^([A-Z][A-Za-z\s]+)$/gm,
    
    // Content-based extraction
    /(?:study|learn|cover|include|focus on|examine)\s+([^.\n\r]+)/gi,
    
    // Subject-specific patterns
    /(?:algebra|geometry|calculus|trigonometry|statistics|probability|functions|equations|graphs|derivatives|integrals|limits|matrices|vectors|complex numbers|sequences|series)/gi
  ];
  
  const foundTopics = new Set<string>();
  const lines = text.split('\n');
  
  // First pass: Extract obvious topics
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const topicTitle = match[2] || match[1];
      if (topicTitle && topicTitle.trim() && !foundTopics.has(topicTitle.trim()) && 
          topicTitle.trim().length > 3 && topicTitle.trim().length < 100) {
        foundTopics.add(topicTitle.trim());
      }
    }
  }
  
  // Second pass: Extract from lines that look like topics
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 5 && trimmedLine.length < 80) {
      // Check if line looks like a topic
      if (
        /^[A-Z]/.test(trimmedLine) || // Starts with capital
        /^\d+/.test(trimmedLine) || // Starts with number
        /(?:chapter|unit|module|section|topic|lesson)/i.test(trimmedLine) || // Contains topic keywords
        /(?:algebra|geometry|calculus|trigonometry|statistics|probability|functions|equations|graphs|derivatives|integrals|limits|matrices|vectors|complex numbers|sequences|series)/i.test(trimmedLine) // Contains subject keywords
      ) {
        if (!foundTopics.has(trimmedLine)) {
          foundTopics.add(trimmedLine);
        }
      }
    }
  }
  
  // Convert found topics to Topic objects
  const topicArray = Array.from(foundTopics);
  
  // If we have good topics, use them; otherwise generate comprehensive fallback
  if (topicArray.length >= 3) {
    topicArray.forEach((topicTitle, index) => {
      topics.push(createDetailedTopic(topicTitle, subject, grade, index + 1, topicArray.length));
    });
  } else {
    // Generate comprehensive subject-specific topics
    return generateComprehensiveSubjectTopics(subject, grade);
  }
  
  return topics;
}

/**
 * Create a detailed topic with proper structure
 */
function createDetailedTopic(topicTitle: string, subject: string, grade: string, index: number, totalTopics: number): Topic {
  const difficulty = index <= Math.ceil(totalTopics / 3) ? 'basic' : 
                    index <= Math.ceil(totalTopics * 2 / 3) ? 'intermediate' : 'advanced';
  
  const estimatedHours = Math.max(6, 15 - Math.floor(index / 2));
  const weekNumber = Math.ceil(index / 2);
  
  return {
    id: `topic_${index}`,
    title: topicTitle,
    description: `Comprehensive study of ${topicTitle} in ${subject} for Grade ${grade}. This topic covers fundamental concepts, practical applications, and problem-solving techniques essential for understanding ${topicTitle.toLowerCase()}.`,
    difficulty,
    estimatedHours,
    prerequisites: index > 1 ? [`topic_${index - 1}`] : [],
    learningObjectives: [
      `Master fundamental concepts of ${topicTitle}`,
      `Apply ${topicTitle} principles to solve practical problems`,
      `Demonstrate understanding through assessments and projects`,
      `Connect ${topicTitle} with real-world applications`
    ],
    keyConceptsToMaster: [
      `Core principles of ${topicTitle}`,
      `Problem-solving methodologies`,
      `Practical applications and examples`,
      `Integration with other topics`
    ],
    suggestedActivities: [
      'Conceptual learning and theory',
      'Practice problems and exercises',
      'Group discussions and peer learning',
      'Hands-on activities and demonstrations',
      'Real-world application projects'
    ],
    assessmentMethods: [
      'Formative assessments and quizzes',
      'Homework assignments and practice',
      'Unit tests and evaluations',
      'Project-based assessments',
      'Peer review and presentations'
    ],
    resources: [
      {
        type: 'textbook',
        title: `${subject} Textbook - ${topicTitle}`,
        description: `Official curriculum textbook covering ${topicTitle}`
      },
      {
        type: 'exercise',
        title: `Practice Problems - ${topicTitle}`,
        description: `Comprehensive problem sets for ${topicTitle}`
      },
      {
        type: 'video',
        title: `Video Tutorials - ${topicTitle}`,
        description: `Visual learning resources for ${topicTitle}`
      }
    ],
    subtopics: generateDetailedSubtopicsForTopic(topicTitle, subject),
    completed: false,
    weekNumber,
    monthNumber: Math.ceil(weekNumber / 4),
    startWeek: weekNumber,
    endWeek: weekNumber + 1
  };
}

/**
 * Generate comprehensive subject-specific topics when syllabus extraction fails
 */
function generateComprehensiveSubjectTopics(subject: string, grade: string): Topic[] {
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('math') || subjectLower.includes('mathematics')) {
    return generateMathematicsTopics(grade);
  } else if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
    return generateScienceTopics(grade);
  } else if (subjectLower.includes('english') || subjectLower.includes('language')) {
    return generateEnglishTopics(grade);
  } else if (subjectLower.includes('history') || subjectLower.includes('social')) {
    return generateHistoryTopics(grade);
  } else {
    return generateGenericSubjectTopics(subject, grade);
  }
}

/**
 * Generate comprehensive Mathematics topics for Grade 11
 */
function generateMathematicsTopics(grade: string): Topic[] {
  const gradeNum = parseInt(grade);
  
  if (gradeNum >= 9 && gradeNum <= 12) {
    return [
      createDetailedTopic('Sets and Relations', 'Mathematics', grade, 1, 8),
      createDetailedTopic('Functions and Graphs', 'Mathematics', grade, 2, 8),
      createDetailedTopic('Trigonometric Functions', 'Mathematics', grade, 3, 8),
      createDetailedTopic('Complex Numbers', 'Mathematics', grade, 4, 8),
      createDetailedTopic('Quadratic Equations', 'Mathematics', grade, 5, 8),
      createDetailedTopic('Sequences and Series', 'Mathematics', grade, 6, 8),
      createDetailedTopic('Permutations and Combinations', 'Mathematics', grade, 7, 8),
      createDetailedTopic('Probability and Statistics', 'Mathematics', grade, 8, 8)
    ];
  }
  
  return generateGenericSubjectTopics('Mathematics', grade);
}

/**
 * Generate comprehensive Science topics
 */
function generateScienceTopics(grade: string): Topic[] {
  return [
    createDetailedTopic('Atomic Structure and Periodic Table', 'Science', grade, 1, 6),
    createDetailedTopic('Chemical Bonding and Reactions', 'Science', grade, 2, 6),
    createDetailedTopic('States of Matter', 'Science', grade, 3, 6),
    createDetailedTopic('Thermodynamics', 'Science', grade, 4, 6),
    createDetailedTopic('Organic Chemistry', 'Science', grade, 5, 6),
    createDetailedTopic('Environmental Chemistry', 'Science', grade, 6, 6)
  ];
}

/**
 * Generate comprehensive English topics
 */
function generateEnglishTopics(grade: string): Topic[] {
  return [
    createDetailedTopic('Reading Comprehension', 'English', grade, 1, 5),
    createDetailedTopic('Grammar and Usage', 'English', grade, 2, 5),
    createDetailedTopic('Creative Writing', 'English', grade, 3, 5),
    createDetailedTopic('Literature Analysis', 'English', grade, 4, 5),
    createDetailedTopic('Communication Skills', 'English', grade, 5, 5)
  ];
}

/**
 * Generate comprehensive History topics
 */
function generateHistoryTopics(grade: string): Topic[] {
  return [
    createDetailedTopic('Ancient Civilizations', 'History', grade, 1, 5),
    createDetailedTopic('Medieval Period', 'History', grade, 2, 5),
    createDetailedTopic('Modern History', 'History', grade, 3, 5),
    createDetailedTopic('World Wars', 'History', grade, 4, 5),
    createDetailedTopic('Contemporary World', 'History', grade, 5, 5)
  ];
}

/**
 * Generate generic subject topics
 */
function generateGenericSubjectTopics(subject: string, grade: string): Topic[] {
  return [
    createDetailedTopic(`${subject} Fundamentals`, subject, grade, 1, 4),
    createDetailedTopic(`${subject} Intermediate Concepts`, subject, grade, 2, 4),
    createDetailedTopic(`${subject} Advanced Topics`, subject, grade, 3, 4),
    createDetailedTopic(`${subject} Applications`, subject, grade, 4, 4)
  ];
}

/**
 * Generate detailed subtopics for a main topic
 */
function generateDetailedSubtopicsForTopic(topicTitle: string, subject: string): SubTopic[] {
  const subtopics: SubTopic[] = [];
  
  // Generate 4-6 detailed subtopics based on the main topic
  const subtopicTemplates = [
    {
      title: `Introduction to ${topicTitle}`,
      description: `Basic concepts, definitions, and fundamental principles of ${topicTitle}`,
      hours: 3,
      concepts: ['Basic definitions', 'Fundamental principles', 'Key terminology'],
      activities: ['Conceptual learning', 'Definition practice', 'Terminology exercises']
    },
    {
      title: `Core Concepts of ${topicTitle}`,
      description: `Main principles, theories, and essential concepts in ${topicTitle}`,
      hours: 4,
      concepts: ['Core principles', 'Essential theories', 'Fundamental concepts'],
      activities: ['Theory study', 'Concept application', 'Problem-solving practice']
    },
    {
      title: `Applications of ${topicTitle}`,
      description: `Practical applications, real-world examples, and use cases of ${topicTitle}`,
      hours: 3,
      concepts: ['Practical applications', 'Real-world examples', 'Use cases'],
      activities: ['Application exercises', 'Case studies', 'Real-world projects']
    },
    {
      title: `Problem Solving in ${topicTitle}`,
      description: `Techniques, methods, and strategies for solving problems in ${topicTitle}`,
      hours: 3,
      concepts: ['Problem-solving techniques', 'Solution strategies', 'Methodology'],
      activities: ['Problem-solving practice', 'Strategy development', 'Solution analysis']
    },
    {
      title: `Advanced Topics in ${topicTitle}`,
      description: `Advanced concepts, complex problems, and extended applications of ${topicTitle}`,
      hours: 2,
      concepts: ['Advanced concepts', 'Complex problems', 'Extended applications'],
      activities: ['Advanced exercises', 'Complex problem solving', 'Extended projects']
    }
  ];
  
  subtopicTemplates.forEach((template, index) => {
    subtopics.push({
      id: `subtopic_${index + 1}`,
      title: template.title,
      description: template.description,
      estimatedHours: template.hours,
      learningObjectives: [
        `Understand and explain ${template.title.toLowerCase()}`,
        `Apply ${template.title.toLowerCase()} in practical situations`,
        `Demonstrate competency through assessments and projects`,
        `Connect ${template.title.toLowerCase()} with other concepts`
      ],
      keyConcepts: template.concepts,
      activities: template.activities,
      assessmentMethods: [
        'Conceptual understanding quizzes',
        'Practical application exercises',
        'Problem-solving assessments',
        'Project-based evaluations'
      ],
      resources: [
        {
          type: 'textbook',
          title: `${subject} - ${template.title}`,
          description: `Comprehensive study material for ${template.title}`
        },
        {
          type: 'exercise',
          title: `Practice Problems - ${template.title}`,
          description: `Targeted practice exercises for ${template.title}`
        },
        {
          type: 'video',
          title: `Video Tutorials - ${template.title}`,
          description: `Visual learning resources for ${template.title}`
        }
      ],
      completed: false
    });
  });
  
  return subtopics;
}

/**
 * Generate subtopics for a main topic (legacy function for compatibility)
 */
function generateSubtopicsForTopic(topicTitle: string, subject: string): SubTopic[] {
  return generateDetailedSubtopicsForTopic(topicTitle, subject);
}

/**
 * Calculate total weeks considering holidays
 */
function calculateTotalWeeks(holidays: Holiday[]): number {
  const baseWeeks = 36; // Standard academic year
  const holidayWeeks = holidays.reduce((total, holiday) => {
    return total + (holiday.duration || 1);
  }, 0);
  
  // Adjust for holidays (add extra weeks to compensate)
  return baseWeeks + Math.ceil(holidayWeeks / 7);
}

/**
 * Generate timeline considering holidays
 */
function generateTimelineWithHolidays(totalWeeks: number, holidays: Holiday[], topics: Topic[]) {
  const quarters = [];
  const milestones = [];
  
  // Generate quarters with holiday consideration
  const weeksPerQuarter = Math.floor(totalWeeks / 4);
  
  for (let i = 0; i < 4; i++) {
    const startWeek = i * weeksPerQuarter + 1;
    const endWeek = (i + 1) * weeksPerQuarter;
    
    quarters.push({
      quarter: i + 1,
      name: `Quarter ${i + 1}`,
      startWeek,
      endWeek,
      focusAreas: getFocusAreasForQuarter(i, topics),
      majorAssessments: [`Quarter ${i + 1} Assessment`]
    });
  }
  
  // Add milestones considering holidays
  milestones.push(
    {
      week: Math.floor(weeksPerQuarter * 1.5),
      title: 'First Quarter Assessment',
      description: 'Comprehensive evaluation of foundational concepts',
      type: 'assessment' as const
    },
    {
      week: Math.floor(weeksPerQuarter * 2.5),
      title: 'Mid-term Examination',
      description: 'Major assessment covering first half of curriculum',
      type: 'exam' as const
    },
    {
      week: Math.floor(weeksPerQuarter * 3.5),
      title: 'Third Quarter Assessment',
      description: 'Evaluation of advanced concepts and applications',
      type: 'assessment' as const
    },
    {
      week: totalWeeks,
      title: 'Final Examination',
      description: 'Comprehensive final assessment',
      type: 'exam' as const
    }
  );
  
  return { quarters, milestones };
}

/**
 * Get focus areas for each quarter
 */
function getFocusAreasForQuarter(quarterIndex: number, topics: Topic[]): string[] {
  const topicsPerQuarter = Math.ceil(topics.length / 4);
  const startIndex = quarterIndex * topicsPerQuarter;
  const endIndex = Math.min(startIndex + topicsPerQuarter, topics.length);
  
  const quarterTopics = topics.slice(startIndex, endIndex);
  
  switch (quarterIndex) {
    case 0:
      return ['Foundation concepts', 'Basic skills', 'Introduction to curriculum'];
    case 1:
      return ['Intermediate concepts', 'Application skills', 'Problem-solving development'];
    case 2:
      return ['Advanced concepts', 'Complex problem solving', 'Critical thinking'];
    case 3:
      return ['Review and revision', 'Final preparation', 'Comprehensive assessment'];
    default:
      return ['Curriculum completion', 'Assessment preparation'];
  }
}

/**
 * Generate minimal fallback topics when syllabus extraction fails
 */
function generateMinimalFallbackTopics(subject: string, grade: string): Topic[] {
  return [
    {
      id: 'topic_1',
      title: `${subject} Fundamentals`,
      description: `Introduction to core ${subject} concepts and principles for Grade ${grade}`,
      difficulty: 'basic',
      estimatedHours: 12,
      prerequisites: [],
      learningObjectives: [
        `Understand basic ${subject} concepts`,
        `Apply fundamental principles`,
        `Develop problem-solving skills`
      ],
      keyConceptsToMaster: [
        `Core ${subject} principles`,
        `Basic terminology`,
        `Fundamental skills`
      ],
      suggestedActivities: [
        'Conceptual learning',
        'Practice exercises',
        'Group discussions'
      ],
      assessmentMethods: [
        'Conceptual tests',
        'Practical assessments',
        'Participation evaluation'
      ],
      resources: [
        { type: 'textbook', title: `${subject} Basics`, description: 'Fundamental concepts' },
        { type: 'exercise', title: 'Practice Problems', description: 'Skill development' }
      ],
      subtopics: generateSubtopicsForTopic(`${subject} Fundamentals`, subject),
      completed: false,
      weekNumber: 1,
      monthNumber: 1,
      startWeek: 1,
      endWeek: 2
    }
  ];
}

/**
 * Get subject-specific topic templates
 */
function getSubjectSpecificTopics(subject: string, grade: string): any[] {
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('math') || subjectLower.includes('mathematics')) {
    return getMathematicsTopics(grade);
  } else if (subjectLower.includes('science') || subjectLower.includes('physics') || subjectLower.includes('chemistry') || subjectLower.includes('biology')) {
    return getScienceTopics(grade);
  } else if (subjectLower.includes('english') || subjectLower.includes('language')) {
    return getEnglishTopics(grade);
  } else if (subjectLower.includes('history') || subjectLower.includes('social')) {
    return getHistoryTopics(grade);
  } else {
    return getGenericTopics(subject, grade);
  }
}

function getMathematicsTopics(grade: string): any[] {
  const gradeNum = parseInt(grade);
  
  if (gradeNum >= 9 && gradeNum <= 12) {
    return [
      {
        title: "Algebraic Expressions and Equations",
        description: "Master fundamental algebraic concepts including variables, coefficients, and solving linear equations. Students will learn to manipulate algebraic expressions and solve real-world problems using algebra.",
        difficulty: 'basic',
        estimatedHours: 12,
        prerequisites: [],
        learningObjectives: [
          "Simplify algebraic expressions",
          "Solve linear equations with one variable",
          "Apply algebraic methods to word problems"
        ],
        keyConceptsToMaster: [
          "Variables and constants",
          "Linear equations",
          "Algebraic manipulation"
        ],
        suggestedActivities: [
          "Practice problem sets",
          "Group problem-solving sessions",
          "Real-world application projects"
        ],
        assessmentMethods: [
          "Weekly quizzes",
          "Problem-solving assignments",
          "Unit test"
        ],
        resources: [
          { type: 'textbook', title: 'Algebra Fundamentals', description: 'Core textbook chapter' },
          { type: 'exercise', title: 'Practice Problems Set A', description: 'Basic to intermediate problems' }
        ]
      },
      {
        title: "Quadratic Functions and Graphs",
        description: "Explore quadratic functions, their properties, and graphical representations. Students will learn to graph parabolas, find vertex and axis of symmetry, and solve quadratic equations.",
        difficulty: 'intermediate',
        estimatedHours: 15,
        prerequisites: ['topic_1'],
        learningObjectives: [
          "Graph quadratic functions",
          "Find vertex and axis of symmetry",
          "Solve quadratic equations by factoring and formula"
        ],
        keyConceptsToMaster: [
          "Parabola properties",
          "Vertex form",
          "Quadratic formula"
        ],
        suggestedActivities: [
          "Graphing exercises",
          "Calculator-based investigations",
          "Real-world modeling projects"
        ],
        assessmentMethods: [
          "Graphing assessments",
          "Problem-solving tests",
          "Project presentations"
        ],
        resources: [
          { type: 'textbook', title: 'Quadratic Functions', description: 'Advanced algebra concepts' },
          { type: 'video', title: 'Graphing Parabolas', description: 'Visual learning resource' }
        ]
      },
      {
        title: "Trigonometry Fundamentals",
        description: "Introduction to trigonometric ratios, unit circle, and basic trigonometric identities. Students will learn sine, cosine, and tangent functions and their applications.",
        difficulty: 'intermediate',
        estimatedHours: 18,
        prerequisites: ['topic_2'],
        learningObjectives: [
          "Understand trigonometric ratios",
          "Use unit circle concepts",
          "Apply trigonometry to solve triangles"
        ],
        keyConceptsToMaster: [
          "Sine, cosine, tangent",
          "Unit circle",
          "Right triangle trigonometry"
        ],
        suggestedActivities: [
          "Hands-on angle measurement",
          "Calculator explorations",
          "Real-world applications"
        ],
        assessmentMethods: [
          "Trigonometric calculations",
          "Problem-solving assessments",
          "Practical applications"
        ],
        resources: [
          { type: 'textbook', title: 'Trigonometry Basics', description: 'Fundamental concepts' },
          { type: 'exercise', title: 'Trigonometry Practice', description: 'Comprehensive problem sets' }
        ]
      },
      {
        title: "Calculus Introduction",
        description: "Introduction to limits, derivatives, and basic integration concepts. Students will explore the fundamental theorem of calculus and its applications.",
        difficulty: 'advanced',
        estimatedHours: 20,
        prerequisites: ['topic_3'],
        learningObjectives: [
          "Understand limit concepts",
          "Calculate basic derivatives",
          "Apply calculus to optimization problems"
        ],
        keyConceptsToMaster: [
          "Limits and continuity",
          "Derivative rules",
          "Applications of derivatives"
        ],
        suggestedActivities: [
          "Limit investigations",
          "Derivative calculations",
          "Optimization projects"
        ],
        assessmentMethods: [
          "Calculus problem sets",
          "Conceptual understanding tests",
          "Application projects"
        ],
        resources: [
          { type: 'textbook', title: 'Calculus Fundamentals', description: 'Introduction to calculus' },
          { type: 'video', title: 'Calculus Concepts', description: 'Visual explanations' }
        ]
      }
    ];
  }
  
  return getGenericTopics('Mathematics', grade);
}

function getScienceTopics(grade: string): any[] {
  return [
    {
      title: "Atomic Structure and Periodic Table",
      description: "Explore the fundamental structure of atoms, electron configuration, and the organization of elements in the periodic table. Students will understand how atomic properties relate to chemical behavior.",
      difficulty: 'basic',
      estimatedHours: 14,
      prerequisites: [],
      learningObjectives: [
        "Describe atomic structure",
        "Explain periodic trends",
        "Predict chemical properties"
      ],
      keyConceptsToMaster: [
        "Protons, neutrons, electrons",
        "Electron shells and orbitals",
        "Periodic trends"
      ],
      suggestedActivities: [
        "Atomic model building",
        "Periodic table analysis",
        "Chemical property investigations"
      ],
      assessmentMethods: [
        "Atomic structure quizzes",
        "Periodic table tests",
        "Laboratory reports"
      ],
      resources: [
        { type: 'textbook', title: 'Atomic Theory', description: 'Fundamental concepts' },
        { type: 'lab', title: 'Atomic Models Lab', description: 'Hands-on exploration' }
      ]
    },
    {
      title: "Chemical Bonding and Reactions",
      description: "Study ionic and covalent bonding, chemical equations, and types of chemical reactions. Students will learn to balance equations and predict reaction products.",
      difficulty: 'intermediate',
      estimatedHours: 16,
      prerequisites: ['topic_1'],
      learningObjectives: [
        "Explain different types of bonds",
        "Balance chemical equations",
        "Predict reaction outcomes"
      ],
      keyConceptsToMaster: [
        "Ionic and covalent bonds",
        "Chemical equations",
        "Reaction types"
      ],
      suggestedActivities: [
        "Bonding demonstrations",
        "Equation balancing practice",
        "Reaction experiments"
      ],
      assessmentMethods: [
        "Bonding concept tests",
        "Equation balancing assessments",
        "Laboratory practicals"
      ],
      resources: [
        { type: 'textbook', title: 'Chemical Bonding', description: 'Advanced concepts' },
        { type: 'lab', title: 'Reaction Types Lab', description: 'Experimental learning' }
      ]
    }
  ];
}

function getEnglishTopics(grade: string): any[] {
  return [
    {
      title: "Literary Analysis and Critical Reading",
      description: "Develop skills in analyzing literature, identifying themes, and understanding literary devices. Students will learn to write analytical essays and engage in critical discussions.",
      difficulty: 'basic',
      estimatedHours: 12,
      prerequisites: [],
      learningObjectives: [
        "Analyze literary texts",
        "Identify themes and motifs",
        "Write analytical essays"
      ],
      keyConceptsToMaster: [
        "Literary devices",
        "Theme analysis",
        "Critical thinking"
      ],
      suggestedActivities: [
        "Close reading exercises",
        "Group discussions",
        "Essay writing workshops"
      ],
      assessmentMethods: [
        "Reading comprehension tests",
        "Analytical essays",
        "Class participation"
      ],
      resources: [
        { type: 'textbook', title: 'Literature Anthology', description: 'Selected readings' },
        { type: 'article', title: 'Critical Analysis Guide', description: 'Writing resources' }
      ]
    }
  ];
}

function getHistoryTopics(grade: string): any[] {
  return [
    {
      title: "Historical Research and Analysis",
      description: "Learn to conduct historical research, analyze primary and secondary sources, and develop historical arguments. Students will understand cause and effect relationships in history.",
      difficulty: 'basic',
      estimatedHours: 10,
      prerequisites: [],
      learningObjectives: [
        "Conduct historical research",
        "Analyze primary sources",
        "Develop historical arguments"
      ],
      keyConceptsToMaster: [
        "Primary vs secondary sources",
        "Historical methodology",
        "Cause and effect analysis"
      ],
      suggestedActivities: [
        "Source analysis exercises",
        "Research projects",
        "Historical debates"
      ],
      assessmentMethods: [
        "Research papers",
        "Source analysis tests",
        "Presentation projects"
      ],
      resources: [
        { type: 'textbook', title: 'Historical Methods', description: 'Research guide' },
        { type: 'article', title: 'Primary Source Collection', description: 'Historical documents' }
      ]
    }
  ];
}

function getGenericTopics(subject: string, grade: string): any[] {
  return [
    {
      title: `${subject} Fundamentals`,
      description: `Introduction to core ${subject} concepts and principles. Students will develop foundational understanding and basic skills in ${subject.toLowerCase()}.`,
      difficulty: 'basic',
      estimatedHours: 10,
      prerequisites: [],
      learningObjectives: [
        `Understand basic ${subject} concepts`,
        `Apply fundamental principles`,
        `Develop problem-solving skills`
      ],
      keyConceptsToMaster: [
        `Core ${subject} principles`,
        `Basic terminology`,
        `Fundamental skills`
      ],
      suggestedActivities: [
        'Conceptual learning',
        'Practice exercises',
        'Group discussions'
      ],
      assessmentMethods: [
        'Conceptual tests',
        'Practical assessments',
        'Participation evaluation'
      ],
      resources: [
        { type: 'textbook', title: `${subject} Basics`, description: 'Fundamental concepts' },
        { type: 'exercise', title: 'Practice Problems', description: 'Skill development' }
      ]
    }
  ];
}

/**
 * Get homework integration suggestions for a topic
 */
export async function getHomeworkIntegrationSuggestions(topicId: string, academicPlan: AcademicPlan): Promise<{
  suggestedAssignments: string[];
  difficultyLevels: string[];
  prerequisiteChecks: string[];
  progressIndicators: string[];
}> {
  const topic = academicPlan.topics.find(t => t.id === topicId);
  
  if (!topic) {
    throw new Error('Topic not found in academic plan');
  }
  
  return {
    suggestedAssignments: [
      `Practice problems on ${topic.title}`,
      `Research assignment on ${topic.keyConceptsToMaster[0]}`,
      `Creative project incorporating ${topic.title} concepts`
    ],
    difficultyLevels: [
      `Basic: ${topic.difficulty === 'basic' ? 'Current level' : 'Simplified version'}`,
      `Intermediate: ${topic.difficulty === 'intermediate' ? 'Current level' : 'Standard version'}`,
      `Advanced: ${topic.difficulty === 'advanced' ? 'Current level' : 'Enhanced version'}`
    ],
    prerequisiteChecks: topic.prerequisites,
    progressIndicators: [
      'Completion of prerequisite topics',
      'Performance on related assessments',
      'Engagement with topic activities'
    ]
  };
}
