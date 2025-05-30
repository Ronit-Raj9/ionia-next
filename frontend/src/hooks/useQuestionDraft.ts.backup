import { useQuestionForm, useQuestionActions } from '@/stores/questionStore';

export function useQuestionDraft() {
  const { tempQuestionData, unsavedChanges } = useQuestionForm();
  const { saveDraft, loadDraft, clearDraft } = useQuestionActions();

  const saveDraftToStorage = () => {
    if (tempQuestionData) {
      saveDraft();
    }
  };

  const loadDraftFromStorage = () => {
    loadDraft();
  };

  const clearDraftFromStorage = () => {
    clearDraft();
  };

  const hasDraft = () => {
    try {
      const draft = localStorage.getItem('question-form-draft');
      return !!draft;
    } catch {
      return false;
    }
  };

  return {
    tempQuestionData,
    unsavedChanges,
    saveDraftToStorage,
    loadDraftFromStorage,
    clearDraftFromStorage,
    hasDraft,
  };
} 