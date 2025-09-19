import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import testsApi from '@/features/tests/api/testsApi';
import { useUIStore } from '../../../stores/uiStore';

// Define test question interface
export interface TestQuestion {
  _id: string;
  question: {
    text: string;
    image?: {
      url: string;
      publicId?: string;
    } | null;
  } | string;
  options: (
    | {
        text: string;
        image?: {
          url: string;
          publicId?: string;
        } | null;
      }
    | string
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

interface TestState {
  // Current test state
  currentTest: Test | null;
  activeQuestion: number;
  timeRemaining: number;
  isTestStarted: boolean;
  isTestCompleted: boolean;
  loading: boolean;
  error: string | null;
  
  // Results and history
  results: TestResults | null;
  testHistory: { [paperId: string]: TestResults };
  cachedTests: { [paperId: string]: Test };
  
  // Actions
  setCurrentTest: (test: Test | null) => void;
  setActiveQuestion: (questionIndex: number) => void;
  setTimeRemaining: (time: number) => void;
  setTestStarted: (started: boolean) => void;
  setTestCompleted: (completed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setResults: (results: TestResults | null) => void;
  updateTestHistory: (paperId: string, results: TestResults) => void;
  cacheTest: (paperId: string, test: Test) => void;
  
  // Question management
  updateQuestionAnswer: (questionIndex: number, answer: number | null) => void;
  toggleQuestionMark: (questionIndex: number) => void;
  updateQuestionTime: (questionIndex: number, timeTaken: number) => void;
  markQuestionVisited: (questionIndex: number) => void;
  
  // Async actions
  fetchTest: (paperId: string) => Promise<void>;
  submitTest: () => Promise<TestResults>;
  fetchTestHistory: () => Promise<void>;
  
  // Utility actions
  resetTest: () => void;
  resetState: () => void;
  getCurrentQuestionStats: () => {
    answered: number;
    marked: number;
    visited: number;
    notVisited: number;
  };

  // Utility actions from testSlice
  setPaperId: (paperId: string) => void;
  startTest: () => void;
  updateTimeRemaining: (time: number) => void;
  answerQuestion: ({ questionIndex, answerIndex, isMarked, isVisited }: { questionIndex: number; answerIndex: number | undefined; isMarked?: boolean; isVisited?: boolean; }) => void;
  toggleMarkQuestion: (questionIndex: number) => void;
  completeTest: () => void;
  clearError: () => void;
  clearTestCache: () => void;
  setRawTestData: (test: Test) => void;
  setTestId: (paperId: string) => void;
}

const initialState: TestState = {
  currentTest: null,
  activeQuestion: 0,
  timeRemaining: 7200, // Default 2 hours in seconds
  isTestStarted: false,
  isTestCompleted: false,
  loading: false,
  error: null,
  results: null,
  testHistory: {}, // { [paperId: string]: TestResults }
  cachedTests: {}, // { [paperId: string]: Test }
  setCurrentTest: () => {},
  setActiveQuestion: () => {},
  setTimeRemaining: () => {},
  setTestStarted: () => {},
  setTestCompleted: () => {},
  setLoading: () => {},
  setError: () => {},
  setResults: () => {},
  updateTestHistory: () => {},
  cacheTest: () => {},
  updateQuestionAnswer: () => {},
  toggleQuestionMark: () => {},
  updateQuestionTime: () => {},
  markQuestionVisited: () => {},
  fetchTest: async () => {},
  submitTest: async () => { return {
    paperId: '',
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    unattempted: 0,
    timeTaken: 0,
  }; },
  fetchTestHistory: async () => {},
  resetTest: () => {},
  resetState: () => {},
  getCurrentQuestionStats: () => ({ answered: 0, marked: 0, visited: 0, notVisited: 0 }),
  setPaperId: () => {},
  startTest: () => {},
  updateTimeRemaining: () => {},
  answerQuestion: () => {},
  toggleMarkQuestion: () => {},
  completeTest: () => {},
  clearError: () => {},
  clearTestCache: () => {},
  setRawTestData: () => {},
  setTestId: () => {},
};

export const useTestStore = create<TestState>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Basic setters
      setCurrentTest: (test) =>
        set((state) => {
          state.currentTest = test;
          if (test) {
            state.timeRemaining = test.time * 60; // Convert minutes to seconds
            state.activeQuestion = 0;
          }
        }),

      setActiveQuestion: (questionIndex) =>
        set((state) => {
          if (state.currentTest && questionIndex >= 0 && questionIndex < state.currentTest.questions.length) {
            state.activeQuestion = questionIndex;
            // Mark question as visited
            if (state.currentTest.questions[questionIndex]) {
              state.currentTest.questions[questionIndex].isVisited = true;
            }
          }
        }),

      setTimeRemaining: (time) =>
        set((state) => {
          state.timeRemaining = Math.max(0, time);
        }),

      setTestStarted: (started) =>
        set((state) => {
          state.isTestStarted = started;
        }),

      setTestCompleted: (completed) =>
        set((state) => {
          state.isTestCompleted = completed;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.loading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
          if (error) {
            state.loading = false;
          }
        }),

      setResults: (results) =>
        set((state) => {
          state.results = results;
        }),

      updateTestHistory: (paperId, results) =>
        set((state) => {
          state.testHistory[paperId] = results;
        }),

      cacheTest: (paperId, test) =>
        set((state) => {
          state.cachedTests[paperId] = test;
        }),

      // Question management
      updateQuestionAnswer: (questionIndex, answer) =>
        set((state) => {
          if (state.currentTest && state.currentTest.questions[questionIndex]) {
            state.currentTest.questions[questionIndex].userAnswer = answer ?? undefined;
          }
        }),

      toggleQuestionMark: (questionIndex) =>
        set((state) => {
          if (state.currentTest && state.currentTest.questions[questionIndex]) {
            const question = state.currentTest.questions[questionIndex];
            question.isMarked = !question.isMarked;
          }
        }),

      updateQuestionTime: (questionIndex, timeTaken) =>
        set((state) => {
          if (state.currentTest && state.currentTest.questions[questionIndex]) {
            const question = state.currentTest.questions[questionIndex];
            question.timeTaken = (question.timeTaken || 0) + timeTaken;
          }
        }),

      markQuestionVisited: (questionIndex) =>
        set((state) => {
          if (state.currentTest && state.currentTest.questions[questionIndex]) {
            state.currentTest.questions[questionIndex].isVisited = true;
          }
        }),

      // Async actions
      fetchTest: async (paperId: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });
        try {
          // Check cache first
          const cachedTest = get().cachedTests[paperId];
          if (cachedTest) {
            set((state) => {
              state.currentTest = cachedTest;
              state.timeRemaining = cachedTest.time * 60;
              state.loading = false;
            });
            return;
          }

          // Use the test service to fetch test data
          console.log('TestStore.fetchTest - Fetching test for paperId:', paperId);
          const testForAttempt = await testsApi.getTestForAttempt(paperId);
          console.log('TestStore.fetchTest - Received testForAttempt:', testForAttempt);
          
          // Convert TestForAttempt to Test format for the store
          const test: Test = {
            _id: testForAttempt._id,
            title: testForAttempt.title,
            examType: testForAttempt.examType,
            year: testForAttempt.year || 0,
            shift: testForAttempt.session || '',
            subject: testForAttempt.subject,
            difficulty: testForAttempt.difficulty,
            questions: testForAttempt.questions.map(q => ({
              _id: q._id,
              question: {
                text: q.question.text,
                image: q.question.image ? { url: q.question.image, publicId: undefined } : null
              },
              options: q.options.map(opt => ({
                text: opt.text,
                image: opt.image ? { url: opt.image, publicId: undefined } : null
              })),
              correctOption: undefined,
              subject: q.subject,
              examType: q.examType,
              difficulty: q.difficulty,
              userAnswer: q.userAnswer,
              isMarked: q.isMarked,
              timeTaken: q.timeTaken,
              isVisited: q.isVisited
            })),
            totalQuestions: testForAttempt.totalQuestions,
            time: testForAttempt.time,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          set((state) => {
            state.currentTest = test;
            state.timeRemaining = test.time * 60;
            state.cachedTests[paperId] = test;
            state.loading = false;
            state.error = null;
          });
        } catch (error: any) {
          set((state) => {
            state.loading = false;
            state.error = error.message || 'Error fetching test';
          });
          useUIStore.getState().addNotification({
            type: 'error',
            title: 'Test Fetch Error',
            message: error.message || 'Error fetching test',
            duration: 5000,
          });
          throw error;
        }
      },
      submitTest: async () => {
        const state = get();
        const { currentTest, timeRemaining } = state;
        if (!currentTest) {
          throw new Error('No active test to submit');
        }
        try {
          set((state) => {
            state.loading = true;
          });
          // Calculate results
          const answeredQuestions = currentTest.questions.filter(q => q.userAnswer !== undefined);
          const correctAnswers = answeredQuestions.filter(q => q.userAnswer === q.correctOption);
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
            // Note: submitResults method doesn't exist in testsApi, using submitTest instead
            await testsApi.submitTest({
              testId: currentTest._id,
              language: 'English',
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              totalTimeTaken: currentTest.time * 60 - timeRemaining,
              answers: []
            });
            useUIStore.getState().addNotification({
              type: 'success',
              title: 'Test Submitted',
              message: 'Test submitted successfully',
              duration: 5000,
            });
          } catch (submitError) {
            console.error('Error submitting test results:', submitError);
            useUIStore.getState().addNotification({
              type: 'warning',
              title: 'Test Submission Warning',
              message: 'Test completed, but there was an error saving your results',
              duration: 5000,
            });
          }
          set((state) => {
            state.results = results;
            state.testHistory[currentTest._id] = results;
            state.isTestCompleted = true;
            state.loading = false;
          });
          return results;
        } catch (error: any) {
          set((state) => {
            state.loading = false;
          });
          useUIStore.getState().addNotification({
            type: 'error',
            title: 'Test Submission Error',
            message: error.message || 'Failed to submit test',
            duration: 5000,
          });
          throw error;
        }
      },
      fetchTestHistory: async () => {
        try {
          set((state) => {
            state.loading = true;
          });
          // Note: getUserResults method doesn't exist in testsApi
          // For now, we'll use an empty history
          const historyMap: { [paperId: string]: TestResults } = {};
          set((state) => {
            state.testHistory = historyMap;
            state.loading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.loading = false;
            state.error = 'Failed to fetch test history';
          });
          useUIStore.getState().addNotification({
            type: 'error',
            title: 'Test History Error',
            message: error.message || 'Failed to fetch test history',
            duration: 5000,
          });
          throw error;
        }
      },

      // Utility actions
      resetTest: () =>
        set((state) => {
          state.currentTest = null;
          state.activeQuestion = 0;
          state.timeRemaining = 7200;
          state.isTestStarted = false;
          state.isTestCompleted = false;
          state.results = null;
          state.error = null;
        }),

      resetState: () =>
        set(() => ({ ...initialState })),

      getCurrentQuestionStats: () => {
        const state = get();
        if (!state.currentTest) {
          return { answered: 0, marked: 0, visited: 0, notVisited: 0 };
        }

        const questions = state.currentTest.questions;
        const answered = questions.filter(q => q.userAnswer !== undefined).length;
        const marked = questions.filter(q => q.isMarked).length;
        const visited = questions.filter(q => q.isVisited).length;
        const notVisited = questions.length - visited;

        return { answered, marked, visited, notVisited };
      },

      // Utility actions from testSlice
      setPaperId: (paperId: string) => {
        // No-op or store paperId if needed
      },
      startTest: () => {
        const state = get();
        if (state.currentTest) {
          set((state) => {
            state.isTestStarted = true;
            state.timeRemaining = state.currentTest!.time * 60;
          });
        }
      },
      updateTimeRemaining: (time: number) => {
        set((state) => {
          state.timeRemaining = time;
        });
      },
      answerQuestion: ({ questionIndex, answerIndex, isMarked, isVisited }: { questionIndex: number; answerIndex: number | undefined; isMarked?: boolean; isVisited?: boolean; }) => {
        set((state) => {
          if (state.currentTest && state.currentTest.questions[questionIndex]) {
            state.currentTest.questions[questionIndex].userAnswer = answerIndex;
            if (isMarked !== undefined) {
              state.currentTest.questions[questionIndex].isMarked = isMarked;
            }
            if (isVisited !== undefined) {
              state.currentTest.questions[questionIndex].isVisited = isVisited;
            }
          }
        });
      },
      toggleMarkQuestion: (questionIndex: number) => {
        set((state) => {
          if (state.currentTest && state.currentTest.questions[questionIndex]) {
            const question = state.currentTest.questions[questionIndex];
            question.isMarked = !question.isMarked;
          }
        });
      },
      completeTest: () => {
        set((state) => {
          state.isTestCompleted = true;
          state.isTestStarted = false;
        });
      },
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
      clearTestCache: () => {
        set((state) => {
          state.cachedTests = {};
        });
        // Optionally clear API cache if needed
      },
      setRawTestData: (test: Test) => {
        set((state) => {
          state.currentTest = test;
          state.loading = false;
          state.error = null;
        });
      },
      setTestId: (paperId: string) => {
        // No-op or store paperId if needed
      },
    })),
    {
      name: 'test-store',
      partialize: (state) => ({
        testHistory: state.testHistory,
        cachedTests: state.cachedTests,
      }),
    }
  )
);

// Convenience hooks
export const useCurrentTest = () => {
  return useTestStore((state) => ({
    currentTest: state.currentTest,
    activeQuestion: state.activeQuestion,
    timeRemaining: state.timeRemaining,
  }));
};

export const useTestActions = () => {
  return useTestStore((state) => ({
    setCurrentTest: state.setCurrentTest,
    setActiveQuestion: state.setActiveQuestion,
    setTimeRemaining: state.setTimeRemaining,
    answerQuestion: state.answerQuestion,
    toggleMarkQuestion: state.toggleMarkQuestion,
    completeTest: state.completeTest,
    resetTest: state.resetTest,
    fetchTest: state.fetchTest,
    submitTest: state.submitTest,
  }));
};

export const useTestResults = () => {
  return useTestStore((state) => ({
    testHistory: state.testHistory,
    fetchTestHistory: state.fetchTestHistory,
    results: state.results,
  }));
};

export const useCurrentQuestionStats = () => {
  return useTestStore((state) => ({
    getCurrentQuestionStats: state.getCurrentQuestionStats,
  }));
}; 