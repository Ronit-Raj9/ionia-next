import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { TestService } from '../services/testService';
import type { 
  Test, 
  PaginatedTests, 
  CreateTestData, 
  UpdateTestData 
} from '../types';

// ==========================================
// 📊 TEST STORE TYPES
// ==========================================

interface TestFilters {
  testCategory: ('PYQ' | 'Platform' | 'UserCustom')[];
  status: ('draft' | 'published' | 'archived')[];
  subject: string[];
  examType: string[];
  class: string[];
  difficulty: ('easy' | 'medium' | 'hard')[];
  platformTestType: string[];
  year: number[];
  isPremium: boolean | null;
  createdBy: string[];
  tag: string[];
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface TestState {
  // Tests data
  tests: Test[];
  selectedTest: Test | null;
  currentTestForAttempt: any | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalTests: number;
  testsPerPage: number;
  
  // Search and filters
  searchQuery: string;
  filters: TestFilters;
  
  // UI state
  loading: boolean;
  error: string | null;
  expandedTests: { [key: string]: boolean };
  globalExpanded: boolean;
  showFilters: boolean;
  activeFilterTab: string;
  
  // Modal states
  showDeleteModal: boolean;
  selectedTestId: string | null;
  deletingId: string | null;
  togglingStatus: string | null;
  
  // Form states
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isFetching: boolean;
}

interface TestActions {
  // Data actions
  fetchTests: (params?: Partial<TestFilters>) => Promise<void>;
  fetchAllTests: () => Promise<void>;
  fetchTestById: (id: string) => Promise<void>;
  createTest: (data: CreateTestData) => Promise<void>;
  updateTest: (id: string, data: UpdateTestData) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  getTestForAttempt: (id: string) => Promise<void>;
  
  // Mock test actions (public)
  fetchMockTests: (examType: string, params?: any) => Promise<void>;
  fetchMockTestById: (examType: string, id: string) => Promise<void>;
  getMockTestForAttempt: (examType: string, id: string) => Promise<void>;
  
  // Filter actions
  setFilters: (filters: Partial<TestFilters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  
  // UI actions
  setSelectedTest: (test: Test | null) => void;
  toggleTestExpanded: (id: string) => void;
  setGlobalExpanded: (expanded: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setActiveFilterTab: (tab: string) => void;
  
  // Modal actions
  setShowDeleteModal: (show: boolean) => void;
  setSelectedTestId: (id: string | null) => void;
  
  // Utility actions
  clearError: () => void;
  clearCurrentTestForAttempt: () => void;
}

// ==========================================
// 📊 DEFAULT VALUES
// ==========================================

const defaultFilters: TestFilters = {
  testCategory: [],
  status: [],
  subject: [],
  examType: [],
  class: [],
  difficulty: [],
  platformTestType: [],
  year: [],
  isPremium: null,
  createdBy: [],
  tag: [],
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

// ==========================================
// 📊 TEST STORE
// ==========================================

export const useTestStore = create<TestState & TestActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      tests: [],
      selectedTest: null,
      currentTestForAttempt: null,
      currentPage: 1,
      totalPages: 0,
      totalTests: 0,
      testsPerPage: 20,
      searchQuery: '',
      filters: defaultFilters,
      loading: false,
      error: null,
      expandedTests: {},
      globalExpanded: false,
      showFilters: false,
      activeFilterTab: 'general',
      showDeleteModal: false,
      selectedTestId: null,
      deletingId: null,
      togglingStatus: null,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isFetching: false,

      // ==========================================
      // 📊 DATA ACTIONS
      // ==========================================

      fetchTests: async (params?: Partial<TestFilters>) => {
        set((state) => {
          state.loading = true;
          state.error = null;
          state.isFetching = true;
        });

        try {
          const currentFilters = get().filters;
          const mergedParams = { ...currentFilters, ...params };
          
          // Convert array filters to single values for API
          const apiParams = {
            page: mergedParams.page,
            limit: mergedParams.limit,
            sortBy: mergedParams.sortBy,
            sortOrder: mergedParams.sortOrder,
            testCategory: mergedParams.testCategory[0], // Take first value
            status: mergedParams.status[0], // Take first value
            subject: mergedParams.subject[0], // Take first value
            examType: mergedParams.examType[0], // Take first value
            class: mergedParams.class[0], // Take first value
            difficulty: mergedParams.difficulty[0], // Take first value
            platformTestType: mergedParams.platformTestType[0], // Take first value
            year: mergedParams.year[0], // Take first value
            isPremium: mergedParams.isPremium === null ? undefined : mergedParams.isPremium,
            createdBy: mergedParams.createdBy[0], // Take first value
            tag: mergedParams.tag[0], // Take first value
          };
          
          const result = await TestService.getTests(apiParams);
          
          set((state) => {
            state.tests = result.docs;
            state.currentPage = result.page;
            state.totalPages = result.totalPages;
            state.totalTests = result.totalDocs;
            state.testsPerPage = result.limit;
            state.loading = false;
            state.isFetching = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch tests';
            state.loading = false;
            state.isFetching = false;
          });
        }
      },

      fetchAllTests: async () => {
        set((state) => {
          state.loading = true;
          state.error = null;
          state.isFetching = true;
        });

        try {
          const result = await TestService.getAllTests();
          
          set((state) => {
            state.tests = result.docs;
            state.currentPage = result.page;
            state.totalPages = result.totalPages;
            state.totalTests = result.totalDocs;
            state.testsPerPage = result.limit;
            state.loading = false;
            state.isFetching = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch all tests';
            state.loading = false;
            state.isFetching = false;
          });
        }
      },

      fetchTestById: async (id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          console.log('Fetching test with ID:', id);
          const test = await TestService.getTestById(id);
          console.log('Test fetched successfully:', test);
          
          set((state) => {
            state.selectedTest = test;
            state.loading = false;
          });
        } catch (error) {
          console.error('Error fetching test:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch test';
            state.loading = false;
          });
        }
      },

      createTest: async (data: CreateTestData) => {
        set((state) => {
          state.isCreating = true;
          state.error = null;
        });

        try {
          // Validate data (only for CreateTestData)
          const errors = TestService.validateTestData(data);
          if (errors.length > 0) {
            throw new Error(errors.join(', '));
          }

          // Format data
          const formattedData = TestService.formatTestData(data);
          
          const newTest = await TestService.createTest(formattedData as CreateTestData);
          
          set((state) => {
            state.tests.unshift(newTest);
            state.totalTests += 1;
            state.isCreating = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to create test';
            state.isCreating = false;
          });
        }
      },

      updateTest: async (id: string, data: UpdateTestData) => {
        set((state) => {
          state.isUpdating = true;
          state.error = null;
        });

        try {
          // Format data
          const formattedData = TestService.formatTestData(data);
          
          const updatedTest = await TestService.updateTest(id, formattedData);
          
          set((state) => {
            // Update in tests array
            const index = state.tests.findIndex(test => test._id === id);
            if (index !== -1) {
              state.tests[index] = updatedTest;
            }
            
            // Update selected test if it's the same
            if (state.selectedTest?._id === id) {
              state.selectedTest = updatedTest;
            }
            
            state.isUpdating = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to update test';
            state.isUpdating = false;
          });
        }
      },

      deleteTest: async (id: string) => {
        set((state) => {
          state.isDeleting = true;
          state.error = null;
          state.deletingId = id;
        });

        try {
          await TestService.deleteTest(id);
          
          set((state) => {
            // Remove from tests array
            state.tests = state.tests.filter(test => test._id !== id);
            state.totalTests -= 1;
            
            // Clear selected test if it's the same
            if (state.selectedTest?._id === id) {
              state.selectedTest = null;
            }
            
            state.isDeleting = false;
            state.deletingId = null;
            state.showDeleteModal = false;
            state.selectedTestId = null;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to delete test';
            state.isDeleting = false;
            state.deletingId = null;
          });
        }
      },

      getTestForAttempt: async (id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const test = await TestService.getTestForAttempt(id);
          
          set((state) => {
            state.currentTestForAttempt = test;
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch test for attempt';
            state.loading = false;
          });
        }
      },

      // ==========================================
      // 🎯 MOCK TEST ACTIONS (Public)
      // ==========================================

      fetchMockTests: async (examType: string, params?: any) => {
        set((state) => {
          state.loading = true;
          state.error = null;
          state.isFetching = true;
        });

        try {
          const result = await TestService.getMockTests(examType, params);
          
          set((state) => {
            state.tests = result.docs;
            state.currentPage = result.page;
            state.totalPages = result.totalPages;
            state.totalTests = result.totalDocs;
            state.testsPerPage = result.limit;
            state.loading = false;
            state.isFetching = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch mock tests';
            state.loading = false;
            state.isFetching = false;
          });
        }
      },

      fetchMockTestById: async (examType: string, id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const test = await TestService.getMockTestById(examType, id);
          
          set((state) => {
            state.selectedTest = test;
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch mock test';
            state.loading = false;
          });
        }
      },

      getMockTestForAttempt: async (examType: string, id: string) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const test = await TestService.getMockTestForAttempt(examType, id);
          
          set((state) => {
            state.currentTestForAttempt = test;
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to fetch mock test for attempt';
            state.loading = false;
          });
        }
      },

      // ==========================================
      // 🔍 FILTER ACTIONS
      // ==========================================

      setFilters: (filters: Partial<TestFilters>) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      resetFilters: () => {
        set((state) => {
          state.filters = defaultFilters;
        });
      },

      setSearchQuery: (query: string) => {
        set((state) => {
          state.searchQuery = query;
        });
      },

      setCurrentPage: (page: number) => {
        set((state) => {
          state.currentPage = page;
          state.filters.page = page;
        });
      },

      // ==========================================
      // 🎨 UI ACTIONS
      // ==========================================

      setSelectedTest: (test: Test | null) => {
        set((state) => {
          state.selectedTest = test;
        });
      },

      toggleTestExpanded: (id: string) => {
        set((state) => {
          state.expandedTests[id] = !state.expandedTests[id];
        });
      },

      setGlobalExpanded: (expanded: boolean) => {
        set((state) => {
          state.globalExpanded = expanded;
          // Apply to all tests
          state.tests.forEach(test => {
            state.expandedTests[test._id] = expanded;
          });
        });
      },

      setShowFilters: (show: boolean) => {
        set((state) => {
          state.showFilters = show;
        });
      },

      setActiveFilterTab: (tab: string) => {
        set((state) => {
          state.activeFilterTab = tab;
        });
      },

      // ==========================================
      // 🪟 MODAL ACTIONS
      // ==========================================

      setShowDeleteModal: (show: boolean) => {
        set((state) => {
          state.showDeleteModal = show;
        });
      },

      setSelectedTestId: (id: string | null) => {
        set((state) => {
          state.selectedTestId = id;
        });
      },

      // ==========================================
      // 🛠️ UTILITY ACTIONS
      // ==========================================

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      clearCurrentTestForAttempt: () => {
        set((state) => {
          state.currentTestForAttempt = null;
        });
      },
    })),
    {
      name: 'test-store',
    }
  )
);
