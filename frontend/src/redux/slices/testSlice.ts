import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';
import { API, clearCache } from '@/lib/api';
import { addNotification } from './uiSlice';

// Define test question interface
export interface TestQuestion {
  _id: string;
  question: string;
  options: string[];
  correctOption: number;
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
  'test/fetchTest',
  async (paperId: string, { rejectWithValue, getState, dispatch }) => {
    try {
      // Check if test is already in cache
      const state = getState() as { test: TestState };
      if (state.test.cachedTests[paperId]) {
        return state.test.cachedTests[paperId];
      }
      
      dispatch(addNotification({
        message: "Loading test data...",
        type: "info"
      }));
      
      const result = await API.tests.getById(paperId);
      if (!result.data) {
        throw new Error('Test not found');
      }
      
      dispatch(addNotification({
        message: "Test loaded successfully",
        type: "success"
      }));
      
      return result.data as Test;
    } catch (error) {
      dispatch(addNotification({
        message: error instanceof Error ? error.message : 'Failed to load test',
        type: "error"
      }));
      
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
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
        // Process the payload first before assigning to state
        const testData = action.payload as Test;
        const processedTest = {
          ...testData,
          questions: testData.questions.map((q: TestQuestion) => ({
            ...q,
            userAnswer: undefined,
            isMarked: false,
            timeTaken: 0,
            isVisited: false,
          }))
        };
        
        // Now assign the processed data to state
        state.currentTest = processedTest;
        state.loading = false;
        
        // Cache the processed test
        state.cachedTests[processedTest._id] = processedTest;
        
        // Set time remaining
        state.timeRemaining = testData.time * 60 || 7200; // Convert minutes to seconds or use default
      })
      .addCase(fetchTest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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