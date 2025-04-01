import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { clearQuestionState } from '@/redux/slices/questionSlice';

export const useQuestionCleanup = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      dispatch(clearQuestionState());
    };
  }, [dispatch]);
}; 