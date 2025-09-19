// Solution-related types
export interface SolutionQuestion {
  id: string;
  question: string;
  options: SolutionOption[];
  subject: string;
  topic: string;
  difficulty: string;
  userAnswer?: number;
  correctAnswer: number | number[];
  isCorrect: boolean;
  timeSpent: number;
  explanation: string;
  averageTime?: number;
}

export interface SolutionOption {
  text: string;
  image?: string;
}

export interface SolutionTestInfo {
  testId: string;
  attemptId: string;
  testTitle: string;
  examType?: string;
  duration?: number;
  markingScheme?: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
}

export interface SolutionPerformance {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  accuracy: number;
  completion: number;
  score?: number;
}

export interface SolutionData {
  testInfo: SolutionTestInfo;
  questions: SolutionQuestion[];
  performance: SolutionPerformance;
}

export interface SolutionFilters {
  type: 'all' | 'correct' | 'incorrect' | 'skipped' | 'bookmarked';
}

export interface SolutionUserPreferences {
  darkMode: boolean;
  readingMode: boolean;
  bookmarkedQuestions: string[];
  notes: Record<string, string>;
  confidenceLevels: Record<string, 'guessed' | 'unsure' | 'confident'>;
}

export interface SolutionReport {
  questionId: string;
  issueType: 'incorrect_solution' | 'unclear_question' | 'technical_issue' | 'other';
  description: string;
  timestamp: Date;
}

export interface SimilarQuestion {
  id: string;
  question: string;
  topic: string;
  difficulty: string;
  accuracy?: number;
}

// API Response types
export interface SolutionApiResponse {
  success: boolean;
  data: {
    attemptId: string;
    testId: string;
    testTitle: string;
    solutions: Array<{
      questionId: string;
      content: string;
      options: Array<{ text: string; image?: string }>;
      userSelected: number;
      correctOptions: number | number[];
      isCorrect: boolean;
      explanation: string;
      subject: string;
      topic: string;
      difficulty: string;
      timeSpent?: number;
    }>;
  };
  message: string;
}

// Store state types
export interface SolutionState {
  // Data
  solutionData: SolutionData | null;
  loading: boolean;
  error: string | null;
  
  // UI State
  currentQuestionIndex: number;
  filter: SolutionFilters['type'];
  userPreferences: SolutionUserPreferences;
  
  // Modal states
  showNoteEditor: boolean;
  showReportModal: boolean;
  showSimilarQuestions: boolean;
  
  // Actions
  setSolutionData: (data: SolutionData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setFilter: (filter: SolutionFilters['type']) => void;
  updateUserPreferences: (preferences: Partial<SolutionUserPreferences>) => void;
  toggleBookmark: (questionId: string) => void;
  saveNote: (questionId: string, note: string) => void;
  setConfidenceLevel: (questionId: string, level: 'guessed' | 'unsure' | 'confident') => void;
  submitReport: (report: SolutionReport) => Promise<void>;
  resetState: () => void;
}
