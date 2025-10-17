import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Database connection helper
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await clientPromise;
  const db = client.db('IoniaDB');
  return { client, db };
}

// Collection helpers
export async function getCollection(collectionName: string): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

// Collection names constants
export const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  STUDENT_PROFILES: 'studentProfiles',
  STUDENT_LEARNING_PROFILES: 'studentLearningProfiles',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
  ACADEMIC_PLANS: 'academicPlans',
  CURRICULUM_PROGRESS: 'curriculumProgress',
  PROGRESS: 'progress',
  STUDY_MATERIALS: 'studyMaterials',
  ANALYTICS: 'analytics',
  CHAT_CONVERSATIONS: 'chatConversations',
  CLASS_CHATS: 'classChats',
  QUESTION_BANK: 'questionBank',
  QUESTION_ATTEMPTS: 'questionAttempts',
  TEACHER_PERFORMANCE: 'teacherPerformance',
  TEACHER_QUESTION_SETS: 'teacherQuestionSets',
  STUDENT_QUESTION_VARIANTS: 'studentQuestionVariants',
  STUDENT_QUESTION_CHOICES: 'studentQuestionChoices',
} as const;

// Database schemas/interfaces
export interface User {
  _id?: ObjectId;
  role: 'teacher' | 'student' | 'admin';
  mockUserId: string; // Legacy field - to be deprecated
  userId?: string; // New unique user ID (replaces mockUserId)
  name: string; // Full name of the user (Teacher/Student/Admin)
  email: string; // Email address (required)
  displayName?: string; // Optional display name
  classId: string;
  schoolId?: string;
  phoneNumber?: string; // Contact number
  profileImage?: string; // Profile photo URL
  dashboardPreferences?: {
    theme: string;
    preferredSubjects: string[];
  };
  // Additional fields for proper user management
  status?: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Class {
  _id?: ObjectId;
  className: string;
  teacherMockId: string; // Legacy field - to be deprecated
  teacherId?: string; // New teacher ID (replaces teacherMockId)
  teacherName?: string; // Teacher's full name for display
  schoolId: string; // School ID for filtering
  studentMockIds: string[]; // Legacy field - to be deprecated
  studentIds?: string[]; // New student IDs (replaces studentMockIds)
  description?: string;
  subject?: string; // Science, Math, etc.
  grade?: string; // Grade level
  syllabus?: 'CBSE' | 'ICSE' | 'State' | 'IB' | 'Other'; // Board/Curriculum
  isActive: boolean;
  joinCode?: string; // For students to join classes
  
  // Enhanced for Indian schools
  currentTopic?: string; // Current teaching topic
  completedTopics?: string[]; // Topics already covered
  upcomingTopics?: string[]; // Topics planned
  studyMaterialLinks?: {
    bookTitle: string; // e.g., "NCERT Science Class 10"
    publisher: string; // e.g., "NCERT"
    fileUrl: string;
    chapters?: {
      number: number;
      title: string;
      topics: string[];
      indexed: boolean; // AI indexing status
    }[];
  }[];
  
  analyticsHistory?: {
    timestamp: Date;
    summary: {
      averageScore: number;
      topWeakness: string;
      completionRate: number;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfile {
  _id?: ObjectId;
  studentMockId: string;
  studentName?: string; // Full name of the student
  name?: string; // Alternative name field for compatibility
  email?: string; // Student email
  schoolId?: string;
  
  // OCEAN Personality Traits (0-100 scale)
  oceanTraits: {
    openness: number; // Creativity, curiosity, openness to new experiences
    conscientiousness: number; // Organization, dependability, discipline
    extraversion: number; // Sociability, assertiveness, enthusiasm
    agreeableness: number; // Cooperation, compassion, politeness
    neuroticism: number; // Emotional stability (low = stable, high = anxious)
  };
  
  // Learning Preferences derived from OCEAN
  learningPreferences: {
    visualLearner: boolean;
    kinestheticLearner: boolean;
    auditoryLearner: boolean;
    readingWritingLearner: boolean;
    preferredDifficulty: 'easy' | 'medium' | 'hard';
    needsStepByStepGuidance: boolean;
    respondsToEncouragement: boolean;
  };
  
  // Intellectual Traits
  intellectualTraits: {
    analyticalThinking: number; // 0-100
    creativeThinking: number;
    criticalThinking: number;
    problemSolvingSkill: number;
  };
  
  // Subject-wise Performance (for Science demo)
  subjectMastery: {
    subject: string; // e.g., "Science"
    grade: string; // e.g., "9" or "10"
    topics: {
      name: string; // e.g., "Gravitation", "Electricity"
      masteryScore: number; // 0-100
      weaknesses: string[]; // Specific weak concepts
      lastPracticed: Date;
      consecutiveHighScores: number; // Track mastery progression
    }[];
    overallMasteryScore: number;
  }[];
  
  // Assignment History & Trends
  assignmentHistory: {
    assignmentId: string;
    submissionId: string;
    subject: string;
    topic: string;
    score: number;
    submittedAt: Date;
    performance: 'excellent' | 'good' | 'average' | 'poor';
    improvementFromPrevious?: number; // Percentage change
  }[];
  
  // Personality Test Metadata
  personalityTestCompleted: boolean;
  testTakenDate?: Date;
  quizResponses?: any[]; // Original quiz responses for reference
  
  // Previous system compatibility
  previousPerformance: {
    subject: string;
    weaknesses: string[];
    masteryScores: Record<string, number>;
  };
  personalityProfile: {
    type: string;
    quizResponses: string[];
  };
  intellectualProfile: {
    strengths: string[];
    responsePatterns: string[];
  };
  
  engagementMetrics?: {
    completionRate: number;
    badgeCount: number;
    progressChains: {
      chainId: string;
      status: 'in_progress' | 'mastered' | 'locked';
    }[];
    streakDays: number;
    totalTimeSpent: number;
  };
  updatedAt: Date;
}

export interface Assignment {
  _id?: ObjectId;
  classId: string;
  schoolId?: string;
  taskType: string;
  title: string;
  description: string;
  subject: string; // Science, Math, etc.
  grade: string; // 9, 10
  topic: string; // Gravitation, Electricity, etc.
  difficulty: 'easy' | 'medium' | 'hard';
  totalMarks: number;
  
  // Assignment Type
  assignmentType: 'standard' | 'personalized'; // Same for all vs. customized per student
  
  // Base Content (uploaded by teacher)
  originalContent: {
    questions: string[];
    questionDetails?: Array<{id: string, text: string, marks: number}>; // Detailed questions with individual marks
  };
  uploadedFileUrl?: string; // Image/PDF of questions
  extractedText?: string; // AI-extracted text from uploaded file
  
  // Solution & Grading Rubric
  baseSolution?: {
    solutionText?: string;
    solutionFileUrl?: string;
    extractedSolutionText?: string;
  };
  gradingRubric?: {
    criteria: {
      name: string; // e.g., "Correct Formula"
      points: number;
      description: string;
    }[];
    aiGenerated: boolean;
  };
  
  // Study Material Reference
  studyMaterialReference?: {
    bookTitle: string;
    chapter: string;
    topics: string[];
  };
  
  // Assignment Metadata
  createdBy: string;
  assignedTo: string[]; // Student IDs who should see this assignment
  gradeSettings: {
    showMarksToStudents: boolean;
    showFeedbackToStudents: boolean;
  };
  dueDate?: Date;
  maxScore: number;
  isPublished: boolean;
  createdAt: Date;
  
  // Personalization
  personalizationEnabled: boolean;
  personalizedVersions: {
    studentMockId: string;
    adaptedContent: {
      questions: string[];
      variations: string;
      difficultyAdjustment?: string; // "easier" | "harder" | "same"
      visualAids?: string[]; // Descriptions of diagrams for visual learners
      hints?: string[]; // Step-by-step hints
      remedialQuestions?: string[]; // Easier foundational questions
      challengeQuestions?: string[]; // Advanced questions for high performers
      encouragementNote?: string; // Personalized message
    };
    personalizationReason: string; // Why this version was created
  }[];
  
  // Status Tracking
  submissionStats: {
    totalStudents: number;
    submitted: number;
    graded: number;
    pending: number;
    averageScore?: number;
  };
  
  suggestions?: {
    recommendedTask: string;
    basedOn: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: number;
  }[];
}

export interface Submission {
  _id?: ObjectId;
  assignmentId: string;
  classId: string;
  studentMockId: string;
  studentName: string;
  subject: string; // For analytics aggregation
  topic: string; // For progress tracking
  
  // Submitted Content
  submittedContent: {
    text: string;
    imageUrls: string[];
    attachments?: {
      type: 'image' | 'document';
      url: string;
      fileName: string;
      fileSize: number;
    }[];
  };
  submissionTime: Date;
  
  // OCR & AI Processing
  extractedText?: string; // Text extracted from images via Gemini Vision
  ocrStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  ocrErrorMessage?: string;
  imageQualityCheck?: {
    isBlurry: boolean;
    isLegible: boolean;
    confidenceScore: number; // 0-100
    suggestions?: string[]; // e.g., "Please upload a clearer image"
  }[];
  
  // Auto-Grading Results
  autoGrade?: {
    score: number;
    maxScore: number;
    percentage: number;
    
    // Detailed Feedback
    detailedFeedback: string; // Overall feedback from AI
    questionWiseAnalysis: {
      questionNumber: number;
      questionText: string;
      studentAnswer: string;
      correctAnswer: string;
      pointsAwarded: number;
      maxPoints: number;
      isCorrect: boolean;
      partialCredit: boolean;
      feedback: string;
    }[];
    
    // Error Analysis
    errorAnalysis: {
      errorType: string; // e.g., "Formula Error", "Calculation Error", "Conceptual Misunderstanding"
      description: string;
      relatedConcept: string; // e.g., "Ohm's Law"
      severity: 'minor' | 'major' | 'critical';
    }[];
    
    // Strengths Identified
    strengthsIdentified: string[]; // Positive aspects of the answer
    
    // Areas for Improvement
    areasForImprovement: {
      concept: string;
      suggestion: string;
      studyMaterialReference?: string; // Link to textbook chapter
    }[];
    
    // AI Confidence
    aiConfidence: number; // 0-100, how confident the AI is in the grading
    requiresReview: boolean; // Flag for teacher review if confidence is low
    
    gradedBy: 'AI' | string; // "AI" or teacher ID
    gradedAt: Date;
  };
  
  // Teacher Override
  teacherOverride?: {
    originalScore: number;
    newScore: number;
    reason: string;
    adjustedBy: string; // Teacher ID
    adjustedAt: Date;
  };
  
  // Grade Visibility
  grade?: {
    score: number;
    maxScore: number;
    feedback: string;
    errors: string[];
    gradedBy: string;
    gradedAt: Date;
    isPublished: boolean; // Whether grade is visible to student
  };
  
  // Status & Processing
  status: 'submitted' | 'processing' | 'graded' | 'returned' | 'failed';
  processingStatus?: 'pending' | 'ocr_in_progress' | 'grading_in_progress' | 'completed' | 'error';
  processed: boolean;
  errorLogs?: string[]; // Any errors during processing
  
  // Performance Impact (calculated after grading)
  performanceImpact?: {
    masteryScoreChange: Record<string, number>; // topic → score change
    newWeaknessesIdentified: string[];
    weaknessesImproved: string[];
  };
  
  // Metadata
  hintUsage?: number;
  chainLink?: string;
  timeSpent?: number;
  isLateSubmission?: boolean;
  
  teacherComments?: {
    content: string;
    isPrivate: boolean; // Private comments not shown to student
    timestamp: Date;
  }[];
}

export interface Progress {
  _id?: ObjectId;
  studentMockId: string;
  classId: string;
  schoolId?: string;
  metrics: {
    mastery: Record<string, number>;
    weaknesses: string[];
    timeSaved: number;
    strengths?: string[];
    averageScore?: number;
    completionRate?: number;
    totalSubmissions?: number;
  };
  updates: {
    timestamp: Date;
    change: string;
  }[];
  heatmapData: {
    weaknesses: {
      topic: string;
      percentage: number;
    }[];
  };
  advancedMetrics?: {
    scoreUplift: number;
    parentSummary: string;
    learningVelocity: number;
    conceptMastery: Record<string, number>;
  };
  reportExports?: {
    format: 'PDF' | 'Excel';
    url: string;
    generatedAt: Date;
    type: 'progress' | 'analytics' | 'parent_summary';
  }[];
  gamificationData?: {
    badges: string[];
    progressBars: Record<string, number>;
    achievements: {
      name: string;
      earnedAt: Date;
      description: string;
    }[];
  };
  recentActivity?: {
    type: 'submission' | 'badge_earned' | 'mastery_achieved';
    description: string;
    timestamp: Date;
  }[];
}

// Chat interfaces
export interface ChatMessage {
  _id?: ObjectId;
  senderId: string;
  senderRole: 'teacher' | 'admin' | 'system';
  messageType: 'text' | 'image' | 'document' | 'assignment_created';
  content: string;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    fileName: string;
    fileSize: number;
  }[];
  metadata?: {
    assignmentId?: string;
    studentCount?: number;
    [key: string]: any;
  };
  timestamp: Date;
  isRead: boolean;
}

export interface ChatConversation {
  _id?: ObjectId;
  teacherId: string;
  classId: string;
  title: string;
  description?: string;
  lastMessage?: ChatMessage;
  lastActivity: Date;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Class Chat interfaces
export interface ClassChatMessage {
  _id?: ObjectId;
  senderId: string;
  senderRole: 'teacher' | 'student';
  senderName: string;
  messageType: 'text' | 'image' | 'document' | 'announcement';
  content: string;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    fileName: string;
    fileSize: number;
  }[];
  timestamp: Date;
  isRead: boolean;
  reactions?: {
    userId: string;
    type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
    timestamp: Date;
  }[];
}

export interface ClassChat {
  _id?: ObjectId;
  classId: string;
  teacherId: string;
  className: string;
  description?: string;
  participants: {
    userId: string;
    role: 'teacher' | 'student';
    name: string;
    joinedAt: Date;
    isActive: boolean;
  }[];
  messages: ClassChatMessage[];
  lastActivity: Date;
  settings: {
    allowStudentMessages: boolean;
    allowFileSharing: boolean;
    moderationEnabled: boolean;
    allowReactions: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Study Materials Collection (for NCERT textbooks, etc.)
export interface StudyMaterial {
  _id?: ObjectId;
  classId: string;
  schoolId: string;
  subject: string; // Science, Math, etc.
  grade: string; // 9, 10
  bookTitle: string; // e.g., "NCERT Science Class 10"
  publisher: string; // e.g., "NCERT"
  fileUrl: string; // PDF URL
  uploadedBy: string; // Teacher ID
  uploadedAt: Date;
  
  // AI Indexing
  indexingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  indexingProgress?: number; // 0-100
  indexingErrorMessage?: string;
  
  chapters: {
    number: number;
    title: string;
    pageRange?: string; // e.g., "10-25"
    
    // AI-extracted content
    topics: string[]; // Main topics covered
    keyConceptsExtracted: {
      concept: string;
      definition: string;
      importance: 'high' | 'medium' | 'low';
    }[];
    formulas: {
      name: string;
      formula: string;
      explanation: string;
      applicableScenarios: string[];
    }[];
    exampleProblems: {
      problemText: string;
      solution: string;
      difficulty: 'basic' | 'intermediate' | 'advanced';
    }[];
    
    // Difficulty progression
    difficultyLevel: 'basic' | 'intermediate' | 'advanced';
    prerequisites?: string[]; // Topics that should be learned first
    
    indexed: boolean;
    indexedAt?: Date;
  }[];
  
  // Searchable index (for quick reference during personalization)
  searchableContent?: {
    allTopics: string[];
    allConcepts: string[];
    allFormulas: string[];
  };
  
  totalPages?: number;
  fileSize?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Collection (Class-level analytics)
export interface ClassAnalytics {
  _id?: ObjectId;
  classId: string;
  schoolId: string;
  subject: string;
  grade: string;
  teacherId: string;
  
  // Period for this analytics snapshot
  periodStart: Date;
  periodEnd: Date;
  periodType: 'daily' | 'weekly' | 'monthly' | 'all_time';
  
  // Topic-wise Performance
  topicWisePerformance: {
    topic: string;
    assignmentsGiven: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    studentsStruggling: number; // Students with score < 60%
    studentsExcelling: number; // Students with score > 85%
    percentageStruggling: number;
    percentageExcelling: number;
    mostCommonErrors: string[];
  }[];
  
  // Class-wide Weaknesses
  classWeaknesses: {
    concept: string;
    topic: string;
    affectedStudents: number;
    percentageAffected: number;
    severity: 'critical' | 'moderate' | 'minor'; // >60%, 30-60%, <30%
    suggestedAction: string;
  }[];
  
  // Assignment Metrics
  assignmentMetrics: {
    totalAssignments: number;
    assignmentsCompleted: number;
    averageCompletionTime: number; // hours
    onTimeSubmissions: number;
    lateSubmissions: number;
    averageScore: number;
    scoreDistribution: {
      excellent: number; // 90-100%
      good: number; // 75-89%
      average: number; // 60-74%
      needsImprovement: number; // <60%
    };
  };
  
  // Grading Efficiency
  gradingEfficiency: {
    totalSubmissionsGraded: number;
    aiGradedCount: number;
    teacherGradedCount: number;
    averageGradingTime: number; // seconds
    teacherTimeSaved: number; // hours
    aiAccuracyRate?: number; // Percentage of AI grades accepted without modification
  };
  
  // Student Rankings (optional, privacy-conscious)
  studentRankings?: {
    studentMockId: string;
    studentName: string;
    averageScore: number;
    rank: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
  }[];
  
  // Progress Trends
  progressTrends: {
    weekNumber: number;
    weekStart: Date;
    averageScore: number;
    completionRate: number;
    engagementScore: number; // 0-100 based on activity
    change: number; // Percentage change from previous week
  }[];
  
  // AI-Powered Insights
  aiInsights?: {
    generatedAt: Date;
    insights: {
      type: 'warning' | 'suggestion' | 'positive';
      title: string;
      description: string;
      actionable: boolean;
      suggestedAction?: string;
      priority: 'high' | 'medium' | 'low';
    }[];
    predictedChallenges?: string[]; // Topics likely to be challenging
    recommendedTopics?: string[]; // Topics to cover next
    studentsNeedingAttention?: string[]; // Student IDs
  };
  
  generatedAt: Date;
  lastUpdated: Date;
}

// Academic Plans Collection
export interface AcademicPlan {
  _id?: ObjectId;
  teacherId: string;
  classId: string;
  subject: string;
  grade: string;
  academicYear: string;
  
  // Uploaded files
  syllabusFile: {
    originalName: string;
    url: string;
    publicId: string;
    size: number;
    type: string;
  };
  calendarFile?: {
    originalName: string;
    url: string;
    publicId: string;
    size: number;
    type: string;
  };
  
  // Extracted content
  extractedContent: {
    syllabusText: string;
    calendarText?: string;
  };
  
  // AI-generated plan
  generatedPlan: {
    overview: {
      subject: string;
      grade: string;
      academicYear: string;
      totalWeeks: number;
      totalHours: number;
      description: string;
      mainGoals: string[];
    };
    topics: {
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
      scheduledDate?: Date;
      completed: boolean;
      completedDate?: Date;
      notes?: string;
      weekNumber: number;
      monthNumber: number;
    }[];
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
  };
  
  // Progress tracking
  progress: {
    totalTopics: number;
    completedTopics: number;
    completionPercentage: number;
    lastUpdated: Date;
  };
  
  status: 'active' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

// Curriculum Progress Tracking Collection
export interface CurriculumProgress {
  _id?: ObjectId;
  academicPlanId: ObjectId;
  classId: string;
  teacherId: string;
  
  // Overall progress metrics
  overallProgress: {
    totalTopics: number;
    completedTopics: number;
    inProgressTopics: number;
    notStartedTopics: number;
    completionPercentage: number;
    averageTopicCompletionTime: number; // in hours
    projectedCompletionDate: Date;
    onSchedule: boolean;
    daysAheadBehind: number; // positive = ahead, negative = behind
  };
  
  // Topic-wise progress
  topicProgress: {
    topicId: string;
    topicTitle: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
    startedDate?: Date;
    completedDate?: Date;
    actualHoursSpent?: number;
    estimatedHours: number;
    completionPercentage: number;
    teacherNotes?: string;
    studentFeedback?: {
      difficulty: 'too_easy' | 'just_right' | 'too_hard';
      engagement: 'low' | 'medium' | 'high';
      understanding: 'poor' | 'fair' | 'good' | 'excellent';
      comments?: string;
    };
    assessmentResults?: {
      formativeScores: number[];
      summativeScore?: number;
      averageScore: number;
    };
  }[];
  
  // Weekly/Monthly tracking
  weeklyProgress: {
    weekNumber: number;
    startDate: Date;
    endDate: Date;
    plannedTopics: string[];
    completedTopics: string[];
    hoursSpent: number;
    onSchedule: boolean;
  }[];
  
  monthlyProgress: {
    month: number;
    year: number;
    plannedTopics: string[];
    completedTopics: string[];
    totalHours: number;
    completionRate: number;
    majorMilestones: string[];
  }[];
  
  // Integration with homework system
  homeworkIntegration: {
    topicBasedAssignments: {
      topicId: string;
      assignmentIds: ObjectId[];
      averageScore: number;
      completionRate: number;
    }[];
    adaptiveDifficulty: {
      topicId: string;
      currentDifficultyLevel: 'basic' | 'intermediate' | 'advanced';
      adjustmentHistory: {
        date: Date;
        fromLevel: string;
        toLevel: string;
        reason: string;
      }[];
    }[];
  };
  
  // AI insights and recommendations
  aiInsights: {
    strugglingTopics: string[];
    strongTopics: string[];
    recommendedPacing: 'slower' | 'current' | 'faster';
    suggestedInterventions: string[];
    nextTopicRecommendations: string[];
    remedialContentSuggestions: {
      topicId: string;
      suggestions: string[];
    }[];
    enrichmentActivities: {
      topicId: string;
      activities: string[];
    }[];
    lastAnalyzed: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ADAPTIVE LEARNING ASSESSMENT SYSTEM
// ============================================

/**
 * Student Learning Profile - Research-backed metrics for personalized learning
 * Based on: Bloom's Taxonomy, Zone of Proximal Development, Self-Determination Theory
 */
export interface StudentLearningProfile {
  _id?: ObjectId;
  studentId: string;
  classId: string;
  grade: string;
  subjects: string[];
  
  // ===== ONBOARDING METRICS (Initial Assessment) =====
  onboardingMetrics: {
    // Cognitive Depth Preference (1-5)
    // Based on Bloom's Taxonomy (Remembering → Creating)
    cognitive_depth_preference: number;
    
    // Challenge Resilience (1-5)
    // Measures persistence and self-regulation
    challenge_resilience: number;
    
    // Subject Affinity Map (0-10 per subject)
    // Interest and engagement per subject area
    subject_affinity_map: {
      math: number;
      science: number;
      language: number;
      social_studies: number;
      arts: number;
      technology: number;
      other?: Record<string, number>;
    };
    
    // Learning Pace Self-Assessment (1-5)
    // Metacognitive awareness of learning speed
    learning_pace_self_assessment: number;
    
    // Help-Seeking Tendency (1-5)
    // Willingness to ask for clarification
    help_seeking_tendency: number;
    
    // Assessment Date
    assessed_at: Date;
  };
  
  // ===== DYNAMIC METRICS (Evolving over time) =====
  dynamicMetrics: {
    // Actual Learning Pace (1-10)
    // Calculated from time taken vs. average
    actual_learning_pace: number;
    
    // Concept Mastery Rate (0-100%)
    // Percentage of concepts mastered
    concept_mastery_rate: number;
    
    // Error Recovery Rate (0-100%)
    // Success rate when retrying failed questions
    error_recovery_rate: number;
    
    // Question Attempt Ratio (0-1)
    // Ratio of questions attempted to questions presented
    question_attempt_ratio: number;
    
    // Time per Difficulty Level (minutes)
    time_per_difficulty_level: {
      easy: number;
      medium: number;
      hard: number;
    };
    
    // Skip Patterns
    skip_patterns: {
      topicId: string;
      topicName: string;
      difficulty: 'easy' | 'medium' | 'hard';
      timestamp: Date;
      reason?: string;
    }[];
    
    // Strength Topics (Topics with >80% accuracy)
    strength_topics: {
      topicId: string;
      topicName: string;
      subject: string;
      accuracyRate: number;
      lastAttempt: Date;
    }[];
    
    // Weakness Topics (Topics with <50% accuracy)
    weakness_topics: {
      topicId: string;
      topicName: string;
      subject: string;
      accuracyRate: number;
      attemptsCount: number;
      lastAttempt: Date;
    }[];
    
    // Topic Avoidance Patterns (NEW)
    topicAvoidancePatterns?: {
      topicId: string;
      topicName: string;
      timesAvoided: number;
      possibleAnxiety: boolean;
      needsIntervention: boolean;
    }[];
  };
  
  // ===== ENGAGEMENT METRICS =====
  engagementMetrics: {
    // Session Frequency (sessions per week)
    session_frequency: number;
    
    // Average Session Duration (minutes)
    avg_session_duration: number;
    
    // Consecutive Days Active
    consecutive_days: number;
    
    // Progress Velocity (concepts mastered per week)
    progress_velocity: number;
    
    // Last Activity
    last_activity: Date;
  };
  
  // ===== BEHAVIORAL PATTERNS =====
  behavioralPatterns: {
    // Peak Performance Time (hour of day 0-23)
    peak_performance_time?: number;
    
    // Preferred Question Types
    preferred_question_types: ('mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank' | 'numerical' | 'essay')[];
    
    // Hint Usage Frequency (hints per question on average)
    hint_usage_frequency: number;
    
    // Confidence vs Accuracy Correlation (-1 to 1)
    // Measures if student can accurately judge their knowledge
    confidence_accuracy_correlation: number;
    
    // Growth Trajectory
    growth_trajectory: 'rapid' | 'steady' | 'slow' | 'stagnant' | 'declining';
    
    // Question Selection Patterns (NEW)
    questionSelectionPatterns?: {
      difficultyPreference: 'easy' | 'medium' | 'hard' | 'mixed';
      bloomsLevelComfort: number; // Average Bloom's level chosen
      avoidsAbstractConcepts: boolean;
      challengeAcceptance: number; // 0-100
      strategicSelection: number; // 0-100 (chooses well)
      decisionMakingSpeed: number; // seconds to choose
      choiceConfidence: number; // 0-100
    };
  };
  
  // ===== SUBJECT-SPECIFIC PERFORMANCE =====
  subjectPerformance: {
    subject: string;
    
    // Current Bloom's Level (1-6)
    // 1=Remember, 2=Understand, 3=Apply, 4=Analyze, 5=Evaluate, 6=Create
    current_blooms_level: number;
    
    // Topic Mastery
    topicMastery: {
      topicId: string;
      topicName: string;
      masteryLevel: 'not_started' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
      accuracy: number;
      timeSpent: number; // minutes
      questionsAttempted: number;
      lastPracticed: Date;
    }[];
    
    // Concept Dependencies
    conceptDependencies: {
      conceptId: string;
      conceptName: string;
      prerequisites: string[];
      masteryScore: number; // 0-100
      blockedConcepts?: string[]; // Concepts that can't be learned without this
    }[];
  }[];
  
  // ===== ZONE OF PROXIMAL DEVELOPMENT (ZPD) =====
  zpdMetrics: {
    // Current Difficulty Level
    current_difficulty_level: 'below_zpd' | 'in_zpd' | 'above_zpd';
    
    // Optimal Challenge Level (based on 80% success rate target)
    optimal_challenge_level: 'easy' | 'medium' | 'hard';
    
    // Scaffolding Needed
    scaffolding_needed: boolean;
    
    // Last Adjustment
    last_zpd_adjustment: Date;
  };
  
  // ===== QUESTION HISTORY =====
  questionHistory: {
    questionId: string;
    topicId: string;
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    bloomsLevel: number;
    isCorrect: boolean;
    timeSpent: number; // seconds
    hintsUsed: number;
    confidence: 'low' | 'medium' | 'high';
    attemptedAt: Date;
    skipReason?: string;
  }[];
  
  // ===== AI RECOMMENDATIONS =====
  aiRecommendations: {
    nextQuestions: {
      questionId: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }[];
    
    remedialTopics: {
      topicId: string;
      topicName: string;
      reason: string;
    }[];
    
    enrichmentActivities: {
      activityId: string;
      activityName: string;
      description: string;
    }[];
    
    lastGenerated: Date;
  };
  
  // ===== METADATA =====
  status: 'onboarding' | 'active' | 'inactive';
  onboardingCompleted: boolean;
  lastAssessment: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Question Bank - Adaptive question repository
 */
export interface QuestionBank {
  _id?: ObjectId;
  subject: string;
  topicId: string;
  topicName: string;
  grade: string;
  
  // Question Content
  questionText: string;
  questionType: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
  options?: string[]; // For MCQ
  correctAnswer: string | string[];
  explanation: string;
  
  // Learning Classification
  difficulty: 'easy' | 'medium' | 'hard';
  bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6; // Remember, Understand, Apply, Analyze, Evaluate, Create
  estimatedTime: number; // seconds
  
  // Prerequisites
  prerequisites: string[]; // Topic IDs that should be mastered first
  
  // Metadata
  tags: string[];
  language: string;
  createdBy: string;
  isActive: boolean;
  
  // Performance Stats
  stats: {
    totalAttempts: number;
    correctAttempts: number;
    averageTime: number;
    skipRate: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Question Attempts - Track individual question attempts
 */
export interface QuestionAttempt {
  _id?: ObjectId;
  studentId: string;
  questionId: ObjectId;
  classId: string;
  subject: string;
  topicId: string;
  
  // Attempt Details
  studentAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number; // seconds
  hintsUsed: number;
  attemptNumber: number; // 1st attempt, 2nd attempt, etc.
  
  // Student State
  confidence: 'low' | 'medium' | 'high';
  wasSkipped: boolean;
  skipReason?: string;
  
  // Context
  sessionId: string;
  previousQuestionId?: ObjectId;
  nextQuestionId?: ObjectId;
  
  // Metric Updates Triggered
  metricsUpdated: {
    learning_pace_updated: boolean;
    concept_mastery_updated: boolean;
    zpd_adjusted: boolean;
  };
  
  attemptedAt: Date;
}

/**
 * Teacher Performance Metrics
 * Evaluates teaching effectiveness based on student outcomes
 */
export interface TeacherPerformance {
  _id?: ObjectId;
  teacherId: string;
  classId: string;
  subject: string;
  grade: string;
  
  // Time Period
  periodStart: Date;
  periodEnd: Date;
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  
  // Effectiveness Indicators
  effectiveness: {
    // Average Concept Mastery Rate across all students (0-100%)
    avg_concept_mastery_rate: number;
    
    // Class Growth Velocity (concepts mastered per week per student)
    class_growth_velocity: number;
    
    // Engagement Index (0-100)
    // Based on session frequency, duration, and participation
    engagement_index: number;
    
    // Student Distribution
    mastery_distribution: {
      expert: number; // Percentage of students at expert level
      advanced: number;
      intermediate: number;
      beginner: number;
      not_started: number;
    };
    
    // Learning Pace Variance
    // Low variance = consistent teaching, high variance = some students left behind
    learning_pace_variance: number;
  };
  
  // Intervention Success
  interventionSuccess: {
    // Students who were struggling but improved
    struggling_students_improved: number;
    total_struggling_students: number;
    improvement_rate: number; // Percentage
    
    // Average time to mastery
    avg_time_to_mastery_days: number;
  };
  
  // Topic-Specific Teaching Effectiveness
  topicEffectiveness: {
    topicId: string;
    topicName: string;
    avg_mastery_score: number;
    student_success_rate: number; // % of students who mastered it
    teaching_quality_score: number; // 0-100
    needs_reteaching: boolean;
  }[];
  
  // Comparative Performance
  comparativeMetrics: {
    // Performance vs. grade average
    performance_vs_grade_avg: number; // Percentage difference
    
    // Performance vs. school average
    performance_vs_school_avg: number;
    
    // Improvement rate vs. expected
    improvement_rate: 'above_expected' | 'as_expected' | 'below_expected';
  };
  
  // AI Insights
  aiInsights: {
    strengths: string[];
    areas_for_improvement: string[];
    recommended_strategies: string[];
    students_needing_attention: {
      studentId: string;
      studentName: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }[];
  };
  
  generatedAt: Date;
  lastUpdated: Date;
}

// ============================================
// TEACHER-PROVIDED QUESTIONS WITH AI PERSONALIZATION
// ============================================

/**
 * Teacher Question Set - Questions uploaded by teacher with AI analysis
 */
export interface TeacherQuestionSet {
  _id?: ObjectId;
  assignmentId: ObjectId;
  teacherId: string;
  classId: string;
  subject: string;
  topic: string;
  
  // Original questions from teacher
  masterQuestions: {
    id: string; // q1, q2, q3...
    questionText: string;
    questionType: 'mcq' | 'short_answer' | 'long_answer' | 'numerical' | 'essay' | 'true_false';
    options?: string[]; // For MCQ
    correctAnswer?: string | string[];
    points: number;
    attachments?: string[]; // Image URLs
    
    // AI-generated metadata
    aiAnalysis: {
      difficulty: 'easy' | 'medium' | 'hard';
      bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6;
      cognitiveComplexity: number; // 1-10
      identifiedTopics: string[];
      keyConcepts: string[];
      prerequisites: string[];
      estimatedTime: number; // seconds
      cognitiveLoad: 'low' | 'medium' | 'high';
      requiredSkills: string[];
      abstractionLevel: number; // 1-5 (concrete to abstract)
      analyzedAt: Date;
    };
  }[];
  
  // Assignment rules
  assignmentRules: {
    totalQuestions: number; // e.g., 10
    questionsToAttempt: number; // e.g., 5
    allowStudentChoice: boolean; // true
    choiceDeadline?: Date; // When they must choose
    submissionDeadline: Date;
  };
  
  // Personalization settings
  personalizationEnabled: boolean;
  personalizationLevel: 'light' | 'moderate' | 'aggressive';
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Student Question Variant - Personalized version of master question
 */
export interface StudentQuestionVariant {
  _id?: ObjectId;
  questionSetId: ObjectId;
  assignmentId: ObjectId;
  studentId: string;
  masterQuestionId: string; // Reference to master question
  
  // Personalized variant
  personalizedQuestion: {
    questionText: string; // Modified based on learning profile
    questionType: 'mcq' | 'short_answer' | 'long_answer' | 'numerical' | 'essay' | 'true_false';
    options?: string[]; // Modified options
    hints?: string[]; // Added based on help-seeking tendency
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
  };
  
  // Personalization reasoning
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
    expectedAccuracy: number; // 0-100 (AI prediction)
    personalizationReason: string;
  };
  
  // Student interaction
  wasPresented: boolean;
  wasChosen: boolean;
  chosenAt?: Date;
  timeSpentViewing: number; // seconds before choosing
  viewCount: number; // How many times they viewed this question
  
  // If attempted
  attempt?: {
    studentAnswer: string | string[];
    isCorrect: boolean;
    timeSpent: number; // seconds
    hintsUsed: number;
    hintsViewed: string[]; // Which hints were used
    confidence: 'low' | 'medium' | 'high';
    submittedAt: Date;
    score: number;
    maxScore: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Student Question Choice - Tracks which questions student chose
 */
export interface StudentQuestionChoice {
  _id?: ObjectId;
  questionSetId: ObjectId;
  assignmentId: ObjectId;
  studentId: string;
  
  // Questions presented vs chosen
  presentedQuestions: string[]; // 10 question IDs
  chosenQuestions: string[]; // 5 question IDs
  
  // Choice timeline
  choiceTimeline: {
    questionId: string;
    action: 'viewed' | 'selected' | 'deselected' | 'finalized';
    timestamp: Date;
  }[];
  
  // Choice analysis
  choiceAnalysis: {
    // Which difficulties were chosen
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    
    // Bloom's levels chosen
    bloomsDistribution: Record<number, number>;
    
    // Avoided questions
    avoidedQuestions: {
      questionId: string;
      difficulty: string;
      bloomsLevel: number;
      topics: string[];
      possibleReason: 'too_hard' | 'too_easy' | 'unfamiliar_topic' | 'time_consuming' | 'uncertain' | 'abstract_concepts';
      viewCount: number;
      timeSpentViewing: number;
    }[];
    
    // Choice patterns
    patterns: {
      avoidsHighBloomsLevel: boolean; // Avoids analysis/evaluation questions
      prefersConcrete: boolean; // Chooses lower abstraction
      riskAverse: boolean; // Always chooses easy/medium
      challengeSeeker: boolean; // Chooses mostly hard
      balancedApproach: boolean; // Good mix
      strategicDiversity: boolean; // Good topic coverage
    };
    
    // Time analysis
    timeToMakeChoice: number; // seconds
    hesitationIndicators: string[]; // "Viewed Q3 5 times before skipping"
    decisionConfidence: 'low' | 'medium' | 'high';
  };
  
  // Metric impact
  metricUpdates: {
    confidenceScore: number; // 0-100, based on choice boldness
    strategicThinking: number; // 0-100, quality of selection
    selfAwareness: number; // 0-100, choosing appropriate difficulty
  };
  
  // Status
  status: 'choosing' | 'finalized' | 'submitted';
  finalizedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export default clientPromise;
