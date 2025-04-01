import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { updateTempQuestionData, clearDraft } from '@/redux/slices/questionSlice';

export const useQuestionDraft = (isEditMode: boolean = false) => {
  const dispatch = useDispatch();
  const { tempQuestionData, unsavedChanges } = useSelector((state: RootState) => state.question);

  // Load draft when component mounts
  useEffect(() => {
    const savedDraft = localStorage.getItem('questionDraft');
    if (savedDraft && !isEditMode) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        dispatch(updateTempQuestionData({ field: 'all', value: parsedDraft }));
      } catch (error) {
        console.error('Error loading draft:', error);
        localStorage.removeItem('questionDraft');
      }
    }
  }, [dispatch, isEditMode]);

  // Save draft when changes are made
  useEffect(() => {
    if (unsavedChanges && tempQuestionData) {
      localStorage.setItem('questionDraft', JSON.stringify(tempQuestionData));
    }
  }, [tempQuestionData, unsavedChanges]);

  // Clear draft when component unmounts
  useEffect(() => {
    return () => {
      if (!unsavedChanges) {
        dispatch(clearDraft());
      }
    };
  }, [dispatch, unsavedChanges]);

  const clearCurrentDraft = () => {
    dispatch(clearDraft());
  };

  return { clearCurrentDraft };
}; 