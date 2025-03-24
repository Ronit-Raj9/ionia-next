import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QuestionMetadata {
  questionNumber: number;
  subject: string;
  topic: string;
  difficulty: string;
  correctOption: number;
  timeSpent: number;
  status: 'correct' | 'incorrect' | 'unattempted';
  userAnswer: string | null;
  correctAnswer: string;
}

interface AnalysisState {
  activeTab: string;
  testInfo: {
    paperId: string;
    testName: string;
    attemptNumber: number;
    language: string;
    duration: number;
    startTime: string;
    endTime: string;
  } | null;
  answers: Array<{
    questionId: string;
    selectedOption: number;
    timeSpent: number;
    isCorrect: boolean;
  }>;
  metadata: {
    totalQuestions: number;
    questions: QuestionMetadata[];
    answeredQuestions: string[];
    visitedQuestions: string[];
    markedForReview: string[];
  };
  performance: {
    totalQuestions: number;
    totalCorrectAnswers: number;
    totalWrongAnswers: number;
    totalVisitedQuestions: number;
    accuracy: number;
  };
  subjectWise: {
    [subject: string]: {
      total: number;
      attempted: number;
      correct: number;
      timeSpent: number;
    };
  };
  loading: boolean;
  error: string | null;
}

const initialState: AnalysisState = {
  activeTab: 'summary',
  testInfo: null,
  answers: [],
  metadata: {
    totalQuestions: 0,
    questions: [],
    answeredQuestions: [],
    visitedQuestions: [],
    markedForReview: [],
  },
  performance: {
    totalQuestions: 0,
    totalCorrectAnswers: 0,
    totalWrongAnswers: 0,
    totalVisitedQuestions: 0,
    accuracy: 0,
  },
  subjectWise: {},
  loading: false,
  error: null,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setAnalysisData: (state, action: PayloadAction<any>) => {
      const { testInfo, answers, metadata, performance, subjectWise } = action.payload;
      state.testInfo = testInfo;
      state.answers = answers;
      state.metadata = metadata;
      state.performance = performance;
      state.subjectWise = subjectWise;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetAnalysis: () => initialState,
  },
});

export const {
  setActiveTab,
  setAnalysisData,
  setLoading,
  setError,
  resetAnalysis,
} = analysisSlice.actions;

export default analysisSlice.reducer;
