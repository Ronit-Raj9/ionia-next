import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import * as QuestionAPI from '../api/questionApi';
import { QuestionService } from '../services/questionService';
import type { Question, PaginatedQuestions, CreateQuestionData, UpdateQuestionData } from '../types';

interface QuestionFilters {
  subject: string[];
  examType: string[];
  difficulty: string[];
  chapter: string[];
  language: string[];
  languageLevel: string[];
  questionType: string[];
  isVerified: boolean | null;
  isActive: boolean | null;
  year: string[];
  conceptualDifficulty: {
    min: number;
    max: number;
  } | null;
  marks: number | null;
  tags: string[];
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  section: string[];
  questionCategory: string[];
  questionSource: string[];
  solutionMode: string;
  dateRange: string;
  hasOptions: boolean | null;
  class: string[];
}

interface QuestionState {
  // Questions data
  questions: Question[];
  selectedQuestion: Question | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  questionsPerPage: number;
  
  // Search and filters
  searchQuery: string;
  filters: QuestionFilters;
  
  // UI state
  loading: boolean;
  error: string | null;
  expandedQuestions: { [key: string]: boolean };
  globalExpanded: boolean;
  showFilters: boolean;
  activeFilterTab: string;
  
  // Modal states
  showDeleteModal: boolean;
  selectedQuestionId: string | null;
  deletingId: string | null;
  togglingStatus: string | null;
}

interface QuestionActions {
  // Data actions
  fetchQuestions: () => Promise<void>;
  fetchQuestionById: (id: string) => Promise<void>;
  createQuestion: (data: CreateQuestionData) => Promise<void>;
  updateQuestion: (id: string, data: UpdateQuestionData) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  toggleQuestionStatus: (id: string, isActive: boolean) => Promise<void>;
  
  // Filter actions
  setFilters: (filters: Partial<QuestionFilters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  
  // UI actions
  setSelectedQuestion: (question: Question | null) => void;
  toggleQuestionExpanded: (id: string) => void;
  setGlobalExpanded: (expanded: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setActiveFilterTab: (tab: string) => void;
  
  // Modal actions
  setShowDeleteModal: (show: boolean) => void;
  setSelectedQuestionId: (id: string | null) => void;
  
  // Utility actions
  clearError: () => void;
}

const defaultFilters: QuestionFilters = {
  subject: [],
  examType: [],
  difficulty: [],
  chapter: [],
  language: [],
  languageLevel: [],
  questionType: [],
  isVerified: null,
  isActive: null,
  year: [],
  conceptualDifficulty: null,
  marks: null,
  tags: [],
  page: 1,
  limit: 30,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  section: [],
  questionCategory: [],
  questionSource: [],
  solutionMode: '',
  dateRange: 'all',
  hasOptions: null,
  class: []
};

export const useQuestionStore = create<QuestionState & QuestionActions>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      questions: [],
      selectedQuestion: null,
      currentPage: 1,
      totalPages: 0,
      totalQuestions: 0,
      questionsPerPage: 30,
      searchQuery: '',
      filters: defaultFilters,
      loading: false,
      error: null,
      expandedQuestions: {},
      globalExpanded: false,
      showFilters: true,
      activeFilterTab: 'basic',
      showDeleteModal: false,
      selectedQuestionId: null,
      deletingId: null,
      togglingStatus: null,

      // Data actions
      fetchQuestions: async () => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const { filters, currentPage, questionsPerPage, searchQuery } = get();
          const data = await QuestionService.getQuestions({
            ...filters,
            page: currentPage,
            limit: questionsPerPage,
            searchQuery
          });

          set((state) => {
            state.questions = data.questions;
            state.totalQuestions = data.totalQuestions;
            state.totalPages = data.totalPages;
            state.loading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to fetch questions';
            state.loading = false;
          });
        }
      },

      fetchQuestionById: async (id: string) => {
        // Check if already loading or if we already have this question
        const currentState = get();
        if (currentState.loading || (currentState.selectedQuestion && currentState.selectedQuestion._id === id)) {
          return;
        }
        
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const question = await QuestionService.getQuestionById(id);
          set((state) => {
            state.selectedQuestion = question;
            state.loading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to fetch question';
            state.loading = false;
          });
        }
      },

      createQuestion: async (data: CreateQuestionData) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          await QuestionService.createQuestion(data);
          set((state) => {
            state.loading = false;
          });
          // Refresh questions list
          get().fetchQuestions();
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to create question';
            state.loading = false;
          });
          throw error;
        }
      },

      updateQuestion: async (id: string, data: UpdateQuestionData) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const updatedQuestion = await QuestionService.updateQuestion(id, data);
          set((state) => {
            state.loading = false;
            // Update question in list if it exists
            const index = state.questions.findIndex(q => q._id === id);
            if (index !== -1) {
              state.questions[index] = updatedQuestion;
            }
            // Update selected question if it's the same
            if (state.selectedQuestion?._id === id) {
              state.selectedQuestion = updatedQuestion;
            }
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to update question';
            state.loading = false;
          });
          throw error;
        }
      },

      deleteQuestion: async (id: string) => {
        set((state) => {
          state.deletingId = id;
          state.error = null;
        });

        try {
          await QuestionService.deleteQuestion(id);
          set((state) => {
            state.deletingId = null;
            state.showDeleteModal = false;
            state.selectedQuestionId = null;
            // Remove question from list
            state.questions = state.questions.filter(q => q._id !== id);
            // Clear selected question if it was deleted
            if (state.selectedQuestion?._id === id) {
              state.selectedQuestion = null;
            }
          });
          // Refresh questions list to get updated totals
          get().fetchQuestions();
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to delete question';
            state.deletingId = null;
          });
          throw error;
        }
      },

      toggleQuestionStatus: async (id: string, isActive: boolean) => {
        set((state) => {
          state.togglingStatus = id;
          state.error = null;
        });

        try {
          const updatedQuestion = await QuestionService.toggleQuestionStatus(id, isActive);
          set((state) => {
            state.togglingStatus = null;
            // Update question in list
            const index = state.questions.findIndex(q => q._id === id);
            if (index !== -1) {
              state.questions[index] = updatedQuestion;
            }
            // Update selected question if it's the same
            if (state.selectedQuestion?._id === id) {
              state.selectedQuestion = updatedQuestion;
            }
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.message || 'Failed to toggle question status';
            state.togglingStatus = null;
          });
          throw error;
        }
      },

      // Filter actions
      setFilters: (newFilters: Partial<QuestionFilters>) => {
        set((state) => {
          state.filters = { ...state.filters, ...newFilters };
          state.currentPage = 1; // Reset to first page when filters change
        });
        // Auto-fetch when filters change
        setTimeout(() => get().fetchQuestions(), 0);
      },

      resetFilters: () => {
        set((state) => {
          state.filters = { ...defaultFilters };
          state.searchQuery = '';
          state.currentPage = 1;
        });
        // Auto-fetch when filters reset
        setTimeout(() => get().fetchQuestions(), 0);
      },

      setSearchQuery: (query: string) => {
        set((state) => {
          state.searchQuery = query;
          state.currentPage = 1; // Reset to first page when search changes
        });
        // Auto-fetch when search changes (with debounce would be better)
        setTimeout(() => get().fetchQuestions(), 300);
      },

      setCurrentPage: (page: number) => {
        set((state) => {
          state.currentPage = page;
        });
        // Auto-fetch when page changes
        setTimeout(() => get().fetchQuestions(), 0);
      },

      // UI actions
      setSelectedQuestion: (question: Question | null) => {
        set((state) => {
          state.selectedQuestion = question;
        });
      },

      toggleQuestionExpanded: (id: string) => {
        set((state) => {
          state.expandedQuestions[id] = !state.expandedQuestions[id];
        });
      },

      setGlobalExpanded: (expanded: boolean) => {
        set((state) => {
          state.globalExpanded = expanded;
          // Update all questions expanded state
          state.questions.forEach(question => {
            state.expandedQuestions[question._id] = expanded;
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

      // Modal actions
      setShowDeleteModal: (show: boolean) => {
        set((state) => {
          state.showDeleteModal = show;
        });
      },

      setSelectedQuestionId: (id: string | null) => {
        set((state) => {
          state.selectedQuestionId = id;
        });
      },

      // Utility actions
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    {
      name: 'question-store',
    }
  )
);
