import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QuestionData, ImageFiles } from '@/types/question';

interface QuestionState {
  questionData: QuestionData | null;
  tempQuestionData: QuestionData | null;
  imageFiles: ImageFiles;
  expandedSections: {
    question: boolean;
    options: boolean;
    solution: boolean;
    hints: boolean;
    commonMistakes: boolean;
    history: boolean;
  };
  unsavedChanges: boolean;
  success: string | null;
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
}

const initialState: QuestionState = {
  questionData: null,
  tempQuestionData: null,
  imageFiles: {
    questionImage: undefined,
    solutionImage: undefined,
    optionImages: [],
    hintImages: []
  },
  expandedSections: {
    question: true,
    options: false,
    solution: false,
    hints: false,
    commonMistakes: false,
    history: false
  },
  unsavedChanges: false,
  success: null,
  error: null,
  isLoading: false,
  isSaving: false
};

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    startLoading: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    stopLoading: (state) => {
      state.isLoading = false;
    },
    startSaving: (state) => {
      state.isSaving = true;
      state.error = null;
    },
    stopSaving: (state) => {
      state.isSaving = false;
    },
    setQuestionData: (state, action: PayloadAction<QuestionData>) => {
      state.questionData = action.payload;
      state.tempQuestionData = action.payload;
      state.isLoading = false;
      state.error = null;
      // Initialize image arrays based on the data
      state.imageFiles = {
        questionImage: undefined,
        solutionImage: undefined,
        optionImages: new Array(action.payload.options.length).fill(null),
        hintImages: new Array(action.payload.hints.length).fill(null)
      };
    },
    updateTempQuestionData: (state, action: PayloadAction<{
      field: keyof QuestionData;
      value: any;
      nestedField?: string;
      index?: number;
    }>) => {
      if (!state.tempQuestionData) return;

      const { field, value, nestedField, index } = action.payload;
      state.unsavedChanges = true;

      const newTempData = { ...state.tempQuestionData };

      if (index !== undefined && nestedField) {
        const newArray = [...(newTempData[field] as any[])];
        if (nestedField) {
          newArray[index] = { ...newArray[index], [nestedField]: value };
        } else {
          newArray[index] = value;
        }
        (newTempData[field] as any[]) = newArray;
      } else if (nestedField) {
        (newTempData[field] as any) = {
          ...(newTempData[field] as object),
          [nestedField]: value
        };
      } else {
        (newTempData[field] as any) = value;
      }

      state.tempQuestionData = newTempData;
    },
    updateImageFiles: (state, action: PayloadAction<{
      type: string;
      file: File | null;
      index?: number;
    }>) => {
      const { type, file, index } = action.payload;
      state.unsavedChanges = true;

      if (type === 'question') {
        state.imageFiles.questionImage = file || undefined;
      } else if (type === 'solution') {
        state.imageFiles.solutionImage = file || undefined;
      } else if (type === 'option' && typeof index === 'number') {
        const newOptionImages = [...state.imageFiles.optionImages];
        newOptionImages[index] = file;
        state.imageFiles.optionImages = newOptionImages;
      } else if (type === 'hint' && typeof index === 'number') {
        const newHintImages = [...state.imageFiles.hintImages];
        newHintImages[index] = file;
        state.imageFiles.hintImages = newHintImages;
      }
    },
    toggleSection: (state, action: PayloadAction<keyof typeof state.expandedSections>) => {
      const section = action.payload;
      state.expandedSections[section] = !state.expandedSections[section];
    },
    setSuccess: (state, action: PayloadAction<string | null>) => {
      state.success = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.success = null;
      }
      state.isLoading = false;
      state.isSaving = false;
    },
    resetChanges: (state) => {
      state.tempQuestionData = state.questionData;
      state.unsavedChanges = false;
      state.imageFiles = {
        questionImage: undefined,
        solutionImage: undefined,
        optionImages: state.questionData?.options.map(() => null) || [],
        hintImages: state.questionData?.hints.map(() => null) || []
      };
    },
    clearNotifications: (state) => {
      state.success = null;
      state.error = null;
    }
  }
});

export const {
  startLoading,
  stopLoading,
  startSaving,
  stopSaving,
  setQuestionData,
  updateTempQuestionData,
  updateImageFiles,
  toggleSection,
  setSuccess,
  setError,
  resetChanges,
  clearNotifications
} = questionSlice.actions;

export default questionSlice.reducer; 