import { useQuestionActions } from '@/stores/questionStore';

export function useQuestionCleanup() {
  const { resetForm } = useQuestionActions();

  const clearQuestionState = () => {
    resetForm();
  };

  return {
    clearQuestionState,
  };
}