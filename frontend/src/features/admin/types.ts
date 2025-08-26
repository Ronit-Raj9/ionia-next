// ==========================================
// 📊 ANALYTICS TYPES
// ==========================================

export interface TestItem {
  id: string;
  title: string;
  questions: number;
  attempts: number;
  createdAt: string;
}

export interface QuestionItem {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
}

export interface AdminAnalytics {
  totalTests: number;
  totalQuestions: number;
  activeUsers: number;
  totalStudents: number;
  testsBySubject: Record<string, number>;
  completionRates: Record<string, number>;
  recentTests: TestItem[];
  recentQuestions: QuestionItem[];
}

// ==========================================
// 👥 USER TYPES
// ==========================================

export interface User {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  avatar?: string;
  analytics?: {
    totalTests: number;
    testsThisWeek: number;
    averageScore: number;
    accuracy: number;
  };
}

export interface UserAnalytics {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
}

export interface PaginatedUsers {
  docs: User[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

// ==========================================
// ❓ QUESTION TYPES
// ==========================================

export interface QuestionImage {
  url: string;
  publicId: string;
}

export interface QuestionOption {
  text: string;
  image?: QuestionImage;
}

export interface QuestionHint {
  text: string;
  image?: QuestionImage;
}

export interface NumericalAnswer {
  exactValue: number;
  range: {
    min: number;
    max: number;
  };
  unit?: string;
}

export interface QuestionStatistics {
  totalAttempts: number;
  correctAttempts: number;
  averageTime: number;
  difficultyRating: number;
}

export interface QuestionFeedback {
  studentReports: {
    type: 'error' | 'clarity' | 'difficulty' | 'other';
    description: {
      text: string;
      image?: QuestionImage;
    };
    reportedBy: string;
    timestamp: {
      created: Date;
      lastModified: Date;
    };
    status: 'pending' | 'reviewed' | 'resolved';
  }[];
  teacherNotes: {
    note: {
      text: string;
      image?: QuestionImage;
    };
    addedBy: string;
    timestamp: {
      created: Date;
      lastModified: Date;
    };
  }[];
}

export interface RevisionHistoryEntry {
  version: number;
  modifiedBy: string;
  changes: string;
  timestamp: Date;
}

export interface Question {
  _id: string;
  author: string | { username?: string; name?: string; email?: string };
  question: {
    text: string;
    image?: QuestionImage;
  };
  questionType: 'mcq' | 'numerical' | 'assertion';
  subject: string;
  chapter: string;
  examType: string;
  class: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks?: number;
  sectionPhysics?: string;
  sectionChemistry?: string;
  sectionMathematics?: string;
  solution: {
    text: string;
    image?: QuestionImage;
  };
  language: string;
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  questionCategory: 'theoretical' | 'numerical' | 'conceptual';
  questionSource: 'pyq' | 'custom' | 'platform';
  section?: string;
  commonMistakes: string[];
  prerequisites: string[];
  conceptualDifficulty: number;
  year?: string;
  options?: QuestionOption[];
  correctOptions?: number[];
  numericalAnswer?: NumericalAnswer;
  hints?: QuestionHint[];
  tags?: string[];
  isActive: boolean;
  isVerified: boolean;
  verifiedBy?: string;
  lastModifiedBy?: string;
  statistics: QuestionStatistics;
  feedback: QuestionFeedback;
  revisionHistory: RevisionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionData {
  questionText: string;
  questionType: 'mcq' | 'numerical' | 'assertion';
  subject: string;
  chapter: string;
  examType: string;
  class: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks?: number;
  solutionText: string;
  language: string;
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  questionCategory: 'theoretical' | 'numerical' | 'conceptual';
  questionSource: 'pyq' | 'custom' | 'platform';
  section?: string;
  year?: string;
  options?: string[];
  correctOptions?: number[];
  exactValue?: number;
  rangeMin?: number;
  rangeMax?: number;
  unit?: string;
  tags?: string[];
  prerequisites?: string[];
  commonMistakes?: string[];
  conceptualDifficulty?: number;
  questionImage?: File;
  solutionImage?: File;
  optionImages?: File[];
  hint0Text?: string;
  hint1Text?: string;
  hint2Text?: string;
  hint0Image?: File;
  hint1Image?: File;
  hint2Image?: File;
}

export interface UpdateQuestionData extends Partial<CreateQuestionData> {
  optionImageIndexes?: number[];
  hintImageIndexes?: number[];
}

export interface PaginatedQuestions {
  questions: Question[];
  totalQuestions: number;
  currentPage: number;
  totalPages: number;
}

// ==========================================
// 📝 TEST TYPES
// ==========================================

export interface MarkingScheme {
  correct: number;
  incorrect: number;
  unattempted: number;
}

export interface TestRevisionHistory {
  modifiedBy: string;
  changesDescription: string;
  timestamp: Date;
}

export interface Test {
  _id: string;
  title: string;
  description?: string;
  tags: string[];
  testCategory: 'PYQ' | 'Platform' | 'UserCustom';
  status: 'draft' | 'published' | 'archived';
  instructions?: string;
  solutionsVisibility: 'always' | 'after_completion' | 'never';
  attemptsAllowed: number;
  questions: string[];
  questionCount: number;
  duration: number;
  totalMarks: number;
  markingScheme: MarkingScheme;
  subject: string;
  examType: string;
  class: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdBy: string;
  lastModifiedBy?: string;
  revisionHistory: TestRevisionHistory[];
  // PYQ specific fields
  year?: number;
  month?: string;
  day?: number;
  session?: string;
  // Platform specific fields
  platformTestType?: string;
  isPremium?: boolean;
  syllabus?: string[];
  // UserCustom specific fields
  isPublic?: boolean;
  generationCriteria?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestData {
  title: string;
  description?: string;
  tags?: string[];
  testCategory: 'PYQ' | 'Platform' | 'UserCustom';
  status?: 'draft' | 'published' | 'archived';
  instructions?: string;
  solutionsVisibility?: 'always' | 'after_completion' | 'never';
  attemptsAllowed?: number;
  questions: string[];
  duration: number;
  markingScheme?: MarkingScheme;
  subject: string;
  examType: string;
  class: string;
  difficulty: 'easy' | 'medium' | 'hard';
  // PYQ specific fields
  year?: number;
  month?: string;
  day?: number;
  session?: string;
  // Platform specific fields
  platformTestType?: string;
  isPremium?: boolean;
  syllabus?: string[];
  // UserCustom specific fields
  isPublic?: boolean;
  generationCriteria?: any;
}

export interface UpdateTestData extends Partial<CreateTestData> {
  changesDescription?: string;
}

export interface PaginatedTests {
  docs: Test[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  pagingCounter: number;
  prevPage: number | null;
  nextPage: number | null;
}
