import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Analysis data interfaces
export interface QuestionAnalysis {
  questionId: string;
  isCorrect: boolean;
  userAnswer?: number;
  correctAnswer: number;
  timeTaken: number;
  difficulty: string;
  subject: string;
  chapter: string;
  topic: string;
}

export interface SubjectPerformance {
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  accuracy: number;
  averageTime: number;
  strongTopics: string[];
  weakTopics: string[];
}

export interface TimeAnalysis {
  totalTime: number;
  averageTimePerQuestion: number;
  timeDistribution: {
    fast: number; // < 30 seconds
    moderate: number; // 30-120 seconds
    slow: number; // > 120 seconds
  };
  timeEfficiency: number; // percentage
}

export interface DifficultyAnalysis {
  easy: {
    attempted: number;
    correct: number;
    accuracy: number;
  };
  medium: {
    attempted: number;
    correct: number;
    accuracy: number;
  };
  hard: {
    attempted: number;
    correct: number;
    accuracy: number;
  };
}

export interface ComparisonData {
  userScore: number;
  averageScore: number;
  percentile: number;
  rank: number;
  totalParticipants: number;
}

export interface AnalysisData {
  testId: string;
  userId: string;
  overallScore: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  accuracy: number;
  timeTaken: number;
  
  // Detailed analysis
  questionAnalysis: QuestionAnalysis[];
  subjectPerformance: SubjectPerformance[];
  timeAnalysis: TimeAnalysis;
  difficultyAnalysis: DifficultyAnalysis;
  comparisonData?: ComparisonData;
  
  // Recommendations
  recommendations: {
    strengths: string[];
    improvements: string[];
    studyPlan: string[];
  };
  
  // Metadata
  generatedAt: string;
  version: string;
}

interface AnalysisState {
  // Current analysis data
  currentAnalysis: AnalysisData | null;
  isLoading: boolean;
  error: string | null;
  
  // Analysis history for performance tracking
  analysisHistory: { [testId: string]: AnalysisData };
  
  // UI state
  selectedSubject: string | null;
  selectedView: 'overview' | 'subject' | 'questions' | 'time' | 'comparison';
  showRecommendations: boolean;
  
  // Actions
  setAnalysisData: (data: AnalysisData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (testId: string, analysis: AnalysisData) => void;
  setSelectedSubject: (subject: string | null) => void;
  setSelectedView: (view: AnalysisState['selectedView']) => void;
  setShowRecommendations: (show: boolean) => void;
  clearAnalysis: () => void;
  clearError: () => void;
  
  // Computed getters
  getSubjectAnalysis: (subject: string) => SubjectPerformance | null;
  getQuestionsBySubject: (subject: string) => QuestionAnalysis[];
  getIncorrectQuestions: () => QuestionAnalysis[];
  getSlowQuestions: () => QuestionAnalysis[];
  getPerformanceTrend: () => Array<{ testId: string; score: number; date: string }>;
}

export const useAnalysisStore = create<AnalysisState>()(
  immer((set, get) => ({
    // Initial state
    currentAnalysis: null,
    isLoading: false,
    error: null,
    analysisHistory: {},
    selectedSubject: null,
    selectedView: 'overview',
    showRecommendations: true,

    // Basic actions
    setAnalysisData: (data) =>
      set((state) => {
        state.currentAnalysis = data;
        state.error = null;
        state.isLoading = false;
        // Add to history
        if (data) {
          state.analysisHistory[data.testId] = data;
        }
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
        if (loading) {
          state.error = null;
        }
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
        state.isLoading = false;
      }),

    addToHistory: (testId, analysis) =>
      set((state) => {
        state.analysisHistory[testId] = analysis;
      }),

    setSelectedSubject: (subject) =>
      set((state) => {
        state.selectedSubject = subject;
      }),

    setSelectedView: (view) =>
      set((state) => {
        state.selectedView = view;
      }),

    setShowRecommendations: (show) =>
      set((state) => {
        state.showRecommendations = show;
      }),

    clearAnalysis: () =>
      set((state) => {
        state.currentAnalysis = null;
        state.selectedSubject = null;
        state.selectedView = 'overview';
        state.error = null;
      }),

    clearError: () =>
      set((state) => {
        state.error = null;
      }),

    // Computed getters
    getSubjectAnalysis: (subject) => {
      const state = get();
      if (!state.currentAnalysis) return null;
      
      return state.currentAnalysis.subjectPerformance.find(
        (perf) => perf.subject === subject
      ) || null;
    },

    getQuestionsBySubject: (subject) => {
      const state = get();
      if (!state.currentAnalysis) return [];
      
      return state.currentAnalysis.questionAnalysis.filter(
        (q) => q.subject === subject
      );
    },

    getIncorrectQuestions: () => {
      const state = get();
      if (!state.currentAnalysis) return [];
      
      return state.currentAnalysis.questionAnalysis.filter(
        (q) => !q.isCorrect && q.userAnswer !== undefined
      );
    },

    getSlowQuestions: () => {
      const state = get();
      if (!state.currentAnalysis) return [];
      
      const avgTime = state.currentAnalysis.timeAnalysis.averageTimePerQuestion;
      return state.currentAnalysis.questionAnalysis.filter(
        (q) => q.timeTaken > avgTime * 1.5 // 50% slower than average
      );
    },

    getPerformanceTrend: () => {
      const state = get();
      const history = Object.values(state.analysisHistory);
      
      return history
        .map((analysis) => ({
          testId: analysis.testId,
          score: analysis.overallScore,
          date: analysis.generatedAt,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
  }))
);

// Convenience hooks
export const useCurrentAnalysis = () => {
  return useAnalysisStore((state) => ({
    currentAnalysis: state.currentAnalysis,
    isLoading: state.isLoading,
    error: state.error,
    selectedView: state.selectedView,
    selectedSubject: state.selectedSubject,
    showRecommendations: state.showRecommendations,
  }));
};

export const useAnalysisActions = () => {
  return useAnalysisStore((state) => ({
    setAnalysisData: state.setAnalysisData,
    setLoading: state.setLoading,
    setError: state.setError,
    setSelectedSubject: state.setSelectedSubject,
    setSelectedView: state.setSelectedView,
    setShowRecommendations: state.setShowRecommendations,
    clearAnalysis: state.clearAnalysis,
    clearError: state.clearError,
  }));
};

export const useAnalysisComputed = () => {
  return useAnalysisStore((state) => ({
    getSubjectAnalysis: state.getSubjectAnalysis,
    getQuestionsBySubject: state.getQuestionsBySubject,
    getIncorrectQuestions: state.getIncorrectQuestions,
    getSlowQuestions: state.getSlowQuestions,
    getPerformanceTrend: state.getPerformanceTrend,
  }));
};

export const useAnalysisHistory = () => {
  return useAnalysisStore((state) => ({
    analysisHistory: state.analysisHistory,
    addToHistory: state.addToHistory,
    getPerformanceTrend: state.getPerformanceTrend,
  }));
}; 