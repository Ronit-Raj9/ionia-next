import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { API, clearCache } from '@/lib/api';
import { addNotification } from './uiSlice';
import { toast } from 'react-hot-toast';

// Define test question interface
export interface TestQuestion {
  _id: string;
  question: {
    text: string;
    image?: {
      url: string;
      publicId?: string;
    } | null;
  } | string;  // Allow both object and string formats
  options: (
    | {
        text: string;
        image?: {
          url: string;
          publicId?: string;
        } | null;
      }
    | string  // Allow both object and string formats
  )[];
  correctOption?: number;
  subject: string;
  examType: string;
  difficulty: string;
  userAnswer?: number;
  isMarked?: boolean;
  timeTaken?: number;
  isVisited?: boolean;
}

// Define test interface
export interface Test {
  _id: string;
  title: string;
  examType: string;
  year: number;
  shift: string;
  subject: string;
  difficulty: string;
  questions: TestQuestion[];
  totalQuestions: number;
  time: number;
  createdAt: string;
  updatedAt: string;
  candidateName?: string;
}

// Define test results interface
export interface TestResults {
  paperId: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  timeTaken: number;
}

// Define test state interface
interface TestState {
  currentTest: Test | null;
  activeQuestion: number;
  timeRemaining: number;
  isTestStarted: boolean;
  isTestCompleted: boolean;
  loading: boolean;
  error: string | null;
  results: TestResults | null;
  testHistory: {
    [paperId: string]: TestResults;
  };
  cachedTests: {
    [paperId: string]: Test;
  };
}

// Initial state
const initialState: TestState = {
  currentTest: null,
  activeQuestion: 0,
  timeRemaining: 7200, // Default 2 hours in seconds, adjust as needed
  isTestStarted: false,
  isTestCompleted: false,
  loading: false,
  error: null,
  results: null,
  testHistory: {},
  cachedTests: {},
};

// Async thunks for test management
export const fetchTest = createAsyncThunk(
  "test/fetchTest",
  async (paperId: string, { rejectWithValue }) => {
    try {
      // Direct API call with minimal code
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const apiUrl = `${API_BASE_URL}/tests/${paperId}/attempt`;
      
      const accessToken = localStorage.getItem('accessToken');
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(apiUrl, { credentials: 'include', headers });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Return raw data with absolutely no processing
      const data = await response.json();
      return data.data || data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Error fetching test");
    }
  }
);

export const submitTest = createAsyncThunk(
  'test/submitTest',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as { test: TestState };
      const { currentTest, timeRemaining } = state.test;
      
      if (!currentTest) {
        throw new Error('No active test to submit');
      }
      
      // Calculate results
      const answeredQuestions = currentTest.questions.filter(q => q.userAnswer !== undefined);
      const correctAnswers = answeredQuestions.filter(q => q.userAnswer === q.correctOption);
      
      // Create question analysis
      const questionAnalysis = currentTest.questions.map(q => ({
        questionId: q._id,
        timeTaken: q.timeTaken || 0,
        isCorrect: q.userAnswer === q.correctOption,
        userAnswer: q.userAnswer,
      }));
      
      const results: TestResults = {
        paperId: currentTest._id,
        score: (correctAnswers.length / currentTest.totalQuestions) * 100,
        correctAnswers: correctAnswers.length,
        incorrectAnswers: answeredQuestions.length - correctAnswers.length,
        unattempted: currentTest.totalQuestions - answeredQuestions.length,
        timeTaken: currentTest.time * 60 - timeRemaining,
      };
      
      // Send results to backend
      try {
        await API.tests.submitResults(currentTest._id, results);
        dispatch(addNotification({
          message: "Test submitted successfully",
          type: "success"
        }));
      } catch (submitError) {
        console.error('Error submitting test results:', submitError);
        dispatch(addNotification({
          message: "Test completed, but there was an error saving your results",
          type: "warning"
        }));
      }
      
      return results;
    } catch (error) {
      dispatch(addNotification({
        message: error instanceof Error ? error.message : 'Failed to submit test',
        type: "error"
      }));
      
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchTestHistory = createAsyncThunk(
  'test/fetchTestHistory',
  async (_, { rejectWithValue }) => {
    try {
      const result = await API.tests.getUserResults();
      if (!result.data) {
        throw new Error('No test history found');
      }
      return result.data as TestResults[];
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

// Async thunk for setting test ID
export const setTestId = createAsyncThunk(
  'test/setTestId',
  async (paperId: string, { rejectWithValue }) => {
    try {
      return paperId;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Failed to set paper ID');
    }
  }
);

// Create the test slice
const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    setPaperId: (state, action: PayloadAction<string>) => {
      // For potential storage/reference of the current test's ID
      // This is used when we want to reference the test ID without loading the full test
      // Note: this exact reducer might not be needed, but included for completeness
    },
    startTest: (state) => {
      if (state.currentTest) {
        state.isTestStarted = true;
        state.timeRemaining = state.currentTest.time * 60; // Convert minutes to seconds
      }
    },
    setActiveQuestion: (state, action: PayloadAction<number>) => {
      // Record time spent on current question before changing
      if (state.currentTest && state.activeQuestion >= 0 && state.activeQuestion < state.currentTest.questions.length) {
        const currentQuestion = state.currentTest.questions[state.activeQuestion];
        currentQuestion.timeTaken = (currentQuestion.timeTaken || 0) + 1;
        currentQuestion.isVisited = true;
      }
      
      // Mark the new question as visited
      if (state.currentTest && action.payload >= 0 && action.payload < state.currentTest.questions.length) {
        state.currentTest.questions[action.payload].isVisited = true;
      }
      
      state.activeQuestion = action.payload;
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    answerQuestion: (state, action: PayloadAction<{ 
      questionIndex: number; 
      answerIndex: number | undefined;
      isMarked?: boolean;
      isVisited?: boolean;
    }>) => {
      const { questionIndex, answerIndex, isMarked, isVisited } = action.payload;
      
      if (state.currentTest && state.currentTest.questions[questionIndex]) {
        state.currentTest.questions[questionIndex].userAnswer = answerIndex;
        
        // If isMarked is provided, update the marked status
        if (isMarked !== undefined) {
          state.currentTest.questions[questionIndex].isMarked = isMarked;
        }

        // If isVisited is provided, update the visited status
        if (isVisited !== undefined) {
          state.currentTest.questions[questionIndex].isVisited = isVisited;
        }
      }
    },
    toggleMarkQuestion: (state, action: PayloadAction<number>) => {
      if (state.currentTest && state.currentTest.questions[action.payload]) {
        const question = state.currentTest.questions[action.payload];
        question.isMarked = !question.isMarked;
      }
    },
    completeTest: (state) => {
      state.isTestCompleted = true;
      state.isTestStarted = false;
    },
    resetTest: (state) => {
      state.currentTest = null;
      state.activeQuestion = 0;
      state.timeRemaining = 7200; // Reset to default 2 hours in seconds
      state.isTestStarted = false;
      state.isTestCompleted = false;
      state.results = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearTestCache: (state) => {
      state.cachedTests = {};
      // Also clear API cache for tests
      clearCache();
    },
    markQuestionVisited: (state, action: PayloadAction<number>) => {
      if (state.currentTest && action.payload >= 0 && action.payload < state.currentTest.questions.length) {
        state.currentTest.questions[action.payload].isVisited = true;
      }
    },
    setRawTestData: (state, action) => {
      state.currentTest = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle hydration from server
      .addCase(HYDRATE as any, (state, action: PayloadAction<any>) => {
        return {
          ...state,
          ...action.payload.test,
        };
      })
      // Fetch test cases
      .addCase(fetchTest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTest.fulfilled, (state, action) => {
        // Direct assignment without any validation or transformation
        state.currentTest = action.payload;
        state.loading = false;
        state.activeQuestion = 0;
        state.timeRemaining = action.payload.time * 60 || 7200;
        state.isTestStarted = true;
        state.error = null;
      })
      .addCase(fetchTest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to fetch test";
      })
      // Submit test cases
      .addCase(submitTest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitTest.fulfilled, (state, action) => {
        state.results = action.payload;
        state.isTestCompleted = true;
        state.isTestStarted = false;
        state.loading = false;
        // Add to test history
        if (state.currentTest) {
          state.testHistory[state.currentTest._id] = action.payload;
        }
      })
      .addCase(submitTest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch test history cases
      .addCase(fetchTestHistory.fulfilled, (state, action) => {
        const historyMap: { [paperId: string]: TestResults } = {};
        action.payload.forEach((result: any) => {
          historyMap[result.paperId] = result;
        });
        state.testHistory = historyMap;
      });
  },
});

export const {
  setPaperId,
  startTest,
  setActiveQuestion,
  updateTimeRemaining,
  answerQuestion,
  toggleMarkQuestion,
  completeTest,
  resetTest,
  clearError,
  clearTestCache,
  markQuestionVisited,
} = testSlice.actions;

export default testSlice.reducer; 