import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  SolutionState, 
  SolutionData, 
  SolutionUserPreferences,
  SolutionReport,
  SolutionFilters,
  SolutionQuestion
} from '../types';
import { SolutionService } from '../services/solutionService';

/**
 * Solution Store
 * Manages state for solution viewing and user interactions
 */
interface SolutionStore extends SolutionState {
  // Additional store-specific state
  attemptId: string | null;
  
  // Async actions
  fetchSolutionData: (attemptId: string) => Promise<void>;
  loadUserPreferences: (attemptId: string) => Promise<void>;
  
  // Navigation actions
  goToPreviousQuestion: () => void;
  goToNextQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  
  // Filter actions
  applyFilter: (filter: SolutionFilters['type']) => void;
  
  // Modal actions
  openNoteEditor: () => void;
  closeNoteEditor: () => void;
  openReportModal: () => void;
  closeReportModal: () => void;
  openSimilarQuestions: () => void;
  closeSimilarQuestions: () => void;
  
  // Utility actions
  exportSolutionData: () => void;
  printSolutionData: () => void;
}

export const useSolutionStore = create<SolutionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        solutionData: null,
        loading: false,
        error: null,
        attemptId: null,
        
        // UI State
        currentQuestionIndex: 0,
        filter: 'all',
        userPreferences: {
          darkMode: false,
          readingMode: false,
          bookmarkedQuestions: [],
          notes: {},
          confidenceLevels: {}
        },
        
        // Modal states
        showNoteEditor: false,
        showReportModal: false,
        showSimilarQuestions: false,

        // Data actions
        setSolutionData: (data: SolutionData) => {
          set({ solutionData: data }, false, 'setSolutionData');
        },

        setLoading: (loading: boolean) => {
          set({ loading }, false, 'setLoading');
        },

        setError: (error: string | null) => {
          set({ error }, false, 'setError');
        },

        setCurrentQuestionIndex: (index: number) => {
          set({ currentQuestionIndex: index }, false, 'setCurrentQuestionIndex');
        },

        setFilter: (filter: SolutionFilters['type']) => {
          set({ filter, currentQuestionIndex: 0 }, false, 'setFilter');
        },

        updateUserPreferences: (preferences: Partial<SolutionUserPreferences>) => {
          const current = get().userPreferences;
          const updated = { ...current, ...preferences };
          set({ userPreferences: updated }, false, 'updateUserPreferences');
          
          // Save to localStorage if we have an attemptId
          const attemptId = get().attemptId;
          if (attemptId) {
            if (preferences.darkMode !== undefined || preferences.readingMode !== undefined) {
              SolutionService.savePreferences({
                darkMode: updated.darkMode,
                readingMode: updated.readingMode
              }).catch(console.error);
            }
          }
        },

        toggleBookmark: (questionId: string) => {
          const state = get();
          const { bookmarkedQuestions } = state.userPreferences;
          
          const newBookmarkedQuestions = bookmarkedQuestions.includes(questionId)
            ? bookmarkedQuestions.filter(id => id !== questionId)
            : [...bookmarkedQuestions, questionId];
          
          state.updateUserPreferences({ bookmarkedQuestions: newBookmarkedQuestions });
          
          // Save to localStorage
          const attemptId = state.attemptId;
          if (attemptId) {
            SolutionService.saveBookmarks(attemptId, newBookmarkedQuestions)
              .catch(console.error);
          }
        },

        saveNote: async (questionId: string, note: string) => {
          const state = get();
          const { notes } = state.userPreferences;
          const newNotes = { ...notes, [questionId]: note };
          
          state.updateUserPreferences({ notes: newNotes });
          
          // Save to localStorage
          const attemptId = state.attemptId;
          if (attemptId) {
            try {
              await SolutionService.saveNote(attemptId, questionId, note);
            } catch (error) {
              console.error('Error saving note:', error);
            }
          }
        },

        setConfidenceLevel: (questionId: string, level: 'guessed' | 'unsure' | 'confident') => {
          const state = get();
          const { confidenceLevels } = state.userPreferences;
          const newConfidenceLevels = { ...confidenceLevels, [questionId]: level };
          
          state.updateUserPreferences({ confidenceLevels: newConfidenceLevels });
        },

        submitReport: async (report: SolutionReport) => {
          try {
            await SolutionService.submitReport(report);
            console.log('Report submitted successfully');
          } catch (error) {
            console.error('Error submitting report:', error);
            throw error;
          }
        },

        resetState: () => {
          set({
            solutionData: null,
            loading: false,
            error: null,
            attemptId: null,
            currentQuestionIndex: 0,
            filter: 'all',
            userPreferences: {
              darkMode: false,
              readingMode: false,
              bookmarkedQuestions: [],
              notes: {},
              confidenceLevels: {}
            },
            showNoteEditor: false,
            showReportModal: false,
            showSimilarQuestions: false
          }, false, 'resetState');
        },

        // Async actions
        fetchSolutionData: async (attemptId: string) => {
          const state = get();
          state.setLoading(true);
          state.setError(null);
          set({ attemptId }, false, 'fetchSolutionData/setAttemptId');

          try {
            const solutionData = await SolutionService.fetchSolutionData(attemptId);
            state.setSolutionData(solutionData);
            
            // Load user preferences after fetching data
            await state.loadUserPreferences(attemptId);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch solution data';
            state.setError(errorMessage);
          } finally {
            state.setLoading(false);
          }
        },

        loadUserPreferences: async (attemptId: string) => {
          try {
            // Load preferences
            const preferences = await SolutionService.getPreferences();
            
            // Load bookmarks
            const bookmarkedQuestions = await SolutionService.getBookmarks(attemptId);
            
            // Load notes
            const notes = await SolutionService.getNotes(attemptId);
            
            // Update preferences in store
            const state = get();
            state.updateUserPreferences({
              ...preferences,
              bookmarkedQuestions,
              notes
            });
            
          } catch (error) {
            console.error('Error loading user preferences:', error);
          }
        },

        // Navigation actions
        goToPreviousQuestion: () => {
          const state = get();
          const { currentQuestionIndex } = state;
          if (currentQuestionIndex > 0) {
            state.setCurrentQuestionIndex(currentQuestionIndex - 1);
          }
        },

        goToNextQuestion: () => {
          const state = get();
          const { currentQuestionIndex, solutionData, filter, userPreferences } = state;
          if (!solutionData) return;
          
          // Get filtered questions to check bounds
          const questions = solutionData.questions;
          let filteredQuestions: SolutionQuestion[] = [];
          
          switch (filter) {
            case 'correct':
              filteredQuestions = questions.filter(q => q.isCorrect);
              break;
            case 'incorrect':
              filteredQuestions = questions.filter(q => !q.isCorrect && q.userAnswer !== undefined);
              break;
            case 'skipped':
              filteredQuestions = questions.filter(q => q.userAnswer === undefined);
              break;
            case 'bookmarked':
              filteredQuestions = questions.filter(q => userPreferences.bookmarkedQuestions.includes(q.id));
              break;
            default:
              filteredQuestions = questions;
          }
          
          if (currentQuestionIndex < filteredQuestions.length - 1) {
            state.setCurrentQuestionIndex(currentQuestionIndex + 1);
          }
        },

        jumpToQuestion: (index: number) => {
          const state = get();
          const { solutionData, filter, userPreferences } = state;
          if (!solutionData) return;
          
          // Get filtered questions to check bounds
          const questions = solutionData.questions;
          let filteredQuestions: SolutionQuestion[] = [];
          
          switch (filter) {
            case 'correct':
              filteredQuestions = questions.filter(q => q.isCorrect);
              break;
            case 'incorrect':
              filteredQuestions = questions.filter(q => !q.isCorrect && q.userAnswer !== undefined);
              break;
            case 'skipped':
              filteredQuestions = questions.filter(q => q.userAnswer === undefined);
              break;
            case 'bookmarked':
              filteredQuestions = questions.filter(q => userPreferences.bookmarkedQuestions.includes(q.id));
              break;
            default:
              filteredQuestions = questions;
          }
          
          if (index >= 0 && index < filteredQuestions.length) {
            state.setCurrentQuestionIndex(index);
          }
        },

        // Filter actions
        applyFilter: (filter: SolutionFilters['type']) => {
          const state = get();
          state.setFilter(filter);
          
          // Reset to first question when filter changes
          state.setCurrentQuestionIndex(0);
        },

        // Modal actions
        openNoteEditor: () => {
          set({ showNoteEditor: true }, false, 'openNoteEditor');
        },

        closeNoteEditor: () => {
          set({ showNoteEditor: false }, false, 'closeNoteEditor');
        },

        openReportModal: () => {
          set({ showReportModal: true }, false, 'openReportModal');
        },

        closeReportModal: () => {
          set({ showReportModal: false }, false, 'closeReportModal');
        },

        openSimilarQuestions: () => {
          set({ showSimilarQuestions: true }, false, 'openSimilarQuestions');
        },

        closeSimilarQuestions: () => {
          set({ showSimilarQuestions: false }, false, 'closeSimilarQuestions');
        },

        // Utility actions
        exportSolutionData: () => {
          const state = get();
          const { solutionData, userPreferences } = state;
          
          if (!solutionData) return;
          
          const summary = SolutionService.generateSolutionSummary(
            solutionData,
            userPreferences.bookmarkedQuestions,
            userPreferences.notes
          );
          
          // Create and download JSON file
          const dataStr = JSON.stringify(summary, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `solution-summary-${solutionData.testInfo.attemptId}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },

        printSolutionData: () => {
          // This would trigger the browser's print dialog
          // The actual printing would be handled by CSS media queries
          window.print();
        }
      }),
      {
        name: 'solution-store',
        partialize: (state) => ({
          userPreferences: state.userPreferences
        })
      }
    ),
    {
      name: 'solution-store'
    }
  )
);

// Selectors for common use cases
export const useSolutionData = () => useSolutionStore(state => state.solutionData);
export const useSolutionLoading = () => useSolutionStore(state => state.loading);
export const useSolutionError = () => useSolutionStore(state => state.error);
export const useCurrentQuestion = () => useSolutionStore(state => {
  const { solutionData, currentQuestionIndex, filter, userPreferences } = state;
  if (!solutionData) return null;
  
  // Get filtered questions first
  const questions = solutionData.questions;
  let filteredQuestions: SolutionQuestion[] = [];
  
  switch (filter) {
    case 'correct':
      filteredQuestions = questions.filter(q => q.isCorrect);
      break;
    case 'incorrect':
      filteredQuestions = questions.filter(q => !q.isCorrect && q.userAnswer !== undefined && q.userAnswer !== null);
      break;
    case 'skipped':
      filteredQuestions = questions.filter(q => q.userAnswer === undefined || q.userAnswer === null);
      break;
    case 'bookmarked':
      filteredQuestions = questions.filter(q => userPreferences.bookmarkedQuestions.includes(q.id));
      break;
    default:
      filteredQuestions = questions;
  }
  
  return filteredQuestions[currentQuestionIndex] || null;
});
export const useUserPreferences = () => useSolutionStore(state => state.userPreferences);
export const useFilter = () => useSolutionStore(state => state.filter);

// Memoized selectors to prevent infinite loops
export const useFilteredQuestions = (): SolutionQuestion[] => {
  const { solutionData, filter, userPreferences } = useSolutionStore();
  if (!solutionData) return [];
  
  // Simple filtering logic to avoid external service calls
  const questions = solutionData.questions;
  switch (filter) {
    case 'correct':
      return questions.filter(q => q.isCorrect);
    case 'incorrect':
      return questions.filter(q => !q.isCorrect && q.userAnswer !== undefined && q.userAnswer !== null);
    case 'skipped':
      return questions.filter(q => q.userAnswer === undefined || q.userAnswer === null);
    case 'bookmarked':
      return questions.filter(q => userPreferences.bookmarkedQuestions.includes(q.id));
    default:
      return questions;
  }
};

export const useNavigationData = () => {
  const { solutionData, currentQuestionIndex } = useSolutionStore();
  if (!solutionData) return null;
  
  const total = solutionData.questions.length;
  const current = currentQuestionIndex + 1;
  const hasPrevious = currentQuestionIndex > 0;
  const hasNext = currentQuestionIndex < total - 1;

  return {
    current,
    total,
    hasPrevious,
    hasNext,
    progress: (current / total) * 100
  };
};
