import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import * as AdminAPI from '../api/adminApi';
import { createErrorState } from '../utils/errorHandling';
import type { 
  AdminAnalytics, 
  Test,
  PaginatedTests,
  CreateTestData,
  UpdateTestData
} from '../types';

interface AdminState {
  // Analytics
  analytics: AdminAnalytics | null;
  
  // Tests
  tests: Test[];
  testsPagination: Omit<PaginatedTests, 'docs'> | null;
  selectedTest: Test | null;
  
  // Loading states
  loading: Set<string>; // To track multiple loading states
  
  // Error states
  error: { [key: string]: string | null };
}

interface AdminActions {
  // ==========================================
  // 📊 ANALYTICS ACTIONS
  // ==========================================
  fetchAdminAnalytics: () => Promise<void>;
  
  // ==========================================
  // 📝 TEST MANAGEMENT ACTIONS
  // ==========================================
  fetchTests: (queryParams?: string) => Promise<void>;
  fetchAllTests: (queryParams?: string) => Promise<void>;
  fetchTestById: (testId: string) => Promise<void>;
  createTest: (testData: CreateTestData) => Promise<void>;
  updateTest: (testId: string, testData: UpdateTestData) => Promise<void>;
  deleteTest: (testId: string) => Promise<void>;
  getTestForAttempt: (testId: string) => Promise<any>;
  getMockTestsByExamType: (examType: string, queryParams?: string) => Promise<void>;
  getMockTestById: (examType: string, testId: string) => Promise<void>;
  getMockTestForAttempt: (examType: string, testId: string) => Promise<any>;
  
  // ==========================================
  // 🧹 UTILITY ACTIONS
  // ==========================================
  clearError: (key: string) => void;
  setSelectedTest: (test: Test | null) => void;
}

export const useAdminStore = create<AdminState & AdminActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      analytics: null,
      tests: [],
      testsPagination: null,
      selectedTest: null,
      loading: new Set(),
      error: {},

      // ==========================================
      // 📊 ANALYTICS ACTIONS IMPLEMENTATION
      // ==========================================

      fetchAdminAnalytics: async () => {
        set((state) => {
          state.loading.add('analytics');
          state.error['analytics'] = null;
        });
        try {
          const data = await AdminAPI.getAdminAnalytics();
          set((state) => {
            state.analytics = data;
          });
        } catch (err: any) {
          set((state) => {
            Object.assign(state.error, createErrorState('analytics', err));
          });
        } finally {
          set((state) => {
            state.loading.delete('analytics');
          });
        }
      },

      // ==========================================
      // 📝 TEST MANAGEMENT ACTIONS IMPLEMENTATION
      // ==========================================

      fetchTests: async (queryParams: string = '') => {
        set((state) => {
          state.loading.add('tests');
          state.error['tests'] = null;
        });
        try {
          const data = await AdminAPI.getTests(queryParams);
          set((state) => {
            state.tests = data.docs;
            const { docs, ...paginationInfo } = data;
            state.testsPagination = paginationInfo;
          });
        } catch (err: any) {
          set((state) => {
            state.error['tests'] = err.message || 'Failed to load tests.';
          });
        } finally {
          set((state) => {
            state.loading.delete('tests');
          });
        }
      },

      fetchAllTests: async (queryParams: string = '') => {
        set((state) => {
          state.loading.add('allTests');
          state.error['allTests'] = null;
        });
        try {
          const data = await AdminAPI.getAllTests(queryParams);
          set((state) => {
            state.tests = data;
          });
        } catch (err: any) {
          set((state) => {
            state.error['allTests'] = err.message || 'Failed to load all tests.';
          });
        } finally {
          set((state) => {
            state.loading.delete('allTests');
          });
        }
      },

      fetchTestById: async (testId: string) => {
        set((state) => {
          state.loading.add('testDetails');
          state.error['testDetails'] = null;
        });
        try {
          const data = await AdminAPI.getTestById(testId);
          set((state) => {
            state.selectedTest = data;
          });
        } catch (err: any) {
          set((state) => {
            state.error['testDetails'] = err.message || 'Failed to load test details.';
          });
        } finally {
          set((state) => {
            state.loading.delete('testDetails');
          });
        }
      },

      createTest: async (testData: CreateTestData) => {
        set((state) => {
          state.loading.add('createTest');
          state.error['createTest'] = null;
        });
        try {
          const newTest = await AdminAPI.createTest(testData);
          set((state) => {
            state.tests.unshift(newTest);
          });
        } catch (err: any) {
          set((state) => {
            state.error['createTest'] = err.message || 'Failed to create test.';
          });
          throw err;
        } finally {
          set((state) => {
            state.loading.delete('createTest');
          });
        }
      },

      updateTest: async (testId: string, testData: UpdateTestData) => {
        set((state) => {
          state.loading.add('updateTest');
          state.error['updateTest'] = null;
        });
        try {
          const updatedTest = await AdminAPI.updateTest(testId, testData);
          set((state) => {
            // Update test in the list
            const testIndex = state.tests.findIndex(t => t._id === testId);
            if (testIndex !== -1) {
              state.tests[testIndex] = updatedTest;
            }
            // Update selected test if it's the same
            if (state.selectedTest?._id === testId) {
              state.selectedTest = updatedTest;
            }
          });
        } catch (err: any) {
          set((state) => {
            state.error['updateTest'] = err.message || 'Failed to update test.';
          });
          throw err;
        } finally {
          set((state) => {
            state.loading.delete('updateTest');
          });
        }
      },

      deleteTest: async (testId: string) => {
        set((state) => {
          state.loading.add('deleteTest');
          state.error['deleteTest'] = null;
        });
        try {
          await AdminAPI.deleteTest(testId);
          set((state) => {
            // Remove test from the list
            state.tests = state.tests.filter(t => t._id !== testId);
            // Clear selected test if it's the deleted one
            if (state.selectedTest?._id === testId) {
              state.selectedTest = null;
            }
          });
        } catch (err: any) {
          set((state) => {
            state.error['deleteTest'] = err.message || 'Failed to delete test.';
          });
          throw err;
        } finally {
          set((state) => {
            state.loading.delete('deleteTest');
          });
        }
      },

      getTestForAttempt: async (testId: string): Promise<any> => {
        set((state) => {
          state.loading.add('testAttempt');
          state.error['testAttempt'] = null;
        });
        try {
          const data = await AdminAPI.getTestForAttempt(testId);
          return data;
        } catch (err: any) {
          set((state) => {
            state.error['testAttempt'] = err.message || 'Failed to load test for attempt.';
          });
          throw err;
        } finally {
          set((state) => {
            state.loading.delete('testAttempt');
          });
        }
      },

      getMockTestsByExamType: async (examType: string, queryParams: string = '') => {
        set((state) => {
          state.loading.add('mockTests');
          state.error['mockTests'] = null;
        });
        try {
          const data = await AdminAPI.getMockTestsByExamType(examType, queryParams);
          set((state) => {
            state.tests = data;
          });
        } catch (err: any) {
          set((state) => {
            state.error['mockTests'] = err.message || 'Failed to load mock tests.';
          });
        } finally {
          set((state) => {
            state.loading.delete('mockTests');
          });
        }
      },

      getMockTestById: async (examType: string, testId: string) => {
        set((state) => {
          state.loading.add('mockTestDetails');
          state.error['mockTestDetails'] = null;
        });
        try {
          const data = await AdminAPI.getMockTestById(examType, testId);
          set((state) => {
            state.selectedTest = data;
          });
        } catch (err: any) {
          set((state) => {
            state.error['mockTestDetails'] = err.message || 'Failed to load mock test details.';
          });
        } finally {
          set((state) => {
            state.loading.delete('mockTestDetails');
          });
        }
      },

      getMockTestForAttempt: async (examType: string, testId: string): Promise<any> => {
        set((state) => {
          state.loading.add('mockTestAttempt');
          state.error['mockTestAttempt'] = null;
        });
        try {
          const data = await AdminAPI.getMockTestForAttempt(examType, testId);
          return data;
        } catch (err: any) {
          set((state) => {
            state.error['mockTestAttempt'] = err.message || 'Failed to load mock test for attempt.';
          });
          throw err;
        } finally {
          set((state) => {
            state.loading.delete('mockTestAttempt');
          });
        }
      },

      // ==========================================
      // 🧹 UTILITY ACTIONS IMPLEMENTATION
      // ==========================================
      
      clearError: (key: string) => {
        set((state) => {
            state.error[key] = null;
        });
      },



      setSelectedTest: (test: Test | null) => {
        set((state) => {
          state.selectedTest = test;
        });
      },
    })),
    {
      name: 'admin-store',
    }
  )
);