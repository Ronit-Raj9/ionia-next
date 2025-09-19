import { useSolutionStore, useSolutionData, useSolutionLoading, useSolutionError, useFilteredQuestions, useCurrentQuestion, useUserPreferences, useFilter } from '../store/solutionStore';
import { useEffect } from 'react';

/**
 * Custom hook for solution functionality
 * Provides a clean interface to the solution store
 */
export const useSolution = (attemptId?: string) => {
  // Use individual hooks to avoid infinite loops
  const solutionData = useSolutionData();
  const loading = useSolutionLoading();
  const error = useSolutionError();
  const filteredQuestions = useFilteredQuestions();
  const currentQuestion = useCurrentQuestion();
  const userPreferences = useUserPreferences();
  const filter = useFilter();
  
  // Get store actions
  const store = useSolutionStore();

  // Auto-fetch solution data when attemptId is provided
  useEffect(() => {
    if (attemptId && !solutionData && !loading) {
      store.fetchSolutionData(attemptId);
    }
  }, [attemptId, solutionData, loading, store.fetchSolutionData]);

  return {
    // Data
    solutionData,
    loading,
    error,
    filteredQuestions,
    currentQuestion,
    
    // UI State
    currentQuestionIndex: store.currentQuestionIndex,
    filter,
    userPreferences,
    
    // Modal states
    showNoteEditor: store.showNoteEditor,
    showReportModal: store.showReportModal,
    showSimilarQuestions: store.showSimilarQuestions,
    
    // Actions
    fetchSolutionData: store.fetchSolutionData,
    setFilter: store.setFilter,
    setCurrentQuestionIndex: store.setCurrentQuestionIndex,
    updateUserPreferences: store.updateUserPreferences,
    toggleBookmark: store.toggleBookmark,
    saveNote: store.saveNote,
    setConfidenceLevel: store.setConfidenceLevel,
    submitReport: store.submitReport,
    resetState: store.resetState,
    
    // Navigation
    goToPreviousQuestion: store.goToPreviousQuestion,
    goToNextQuestion: store.goToNextQuestion,
    jumpToQuestion: store.jumpToQuestion,
    
    // Modals
    openNoteEditor: store.openNoteEditor,
    closeNoteEditor: store.closeNoteEditor,
    openReportModal: store.openReportModal,
    closeReportModal: store.closeReportModal,
    openSimilarQuestions: store.openSimilarQuestions,
    closeSimilarQuestions: store.closeSimilarQuestions,
    
    // Utilities
    exportSolutionData: store.exportSolutionData,
    printSolutionData: store.printSolutionData
  };
};

