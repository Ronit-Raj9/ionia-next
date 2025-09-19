import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

// Define interfaces based on the backend model
interface QuestionImage {
  url: string;
  publicId: string;
}

interface Option {
  text: string;
  image: QuestionImage;
}

interface NumericalAnswer {
  exactValue: number;
  range: {
    min: number;
    max: number;
  };
  unit: string;
}

interface Hint {
  text: string;
  image: QuestionImage;
}

interface CommonMistake {
  description: string;
  explanation: string;
}

interface Statistics {
  timesAttempted: number;
  successRate: number;
  averageTimeTaken: number;
}

interface Feedback {
  studentReports: Array<{
    type: 'error' | 'clarity' | 'difficulty' | 'other';
    description: {
      text: string;
      image: QuestionImage;
    };
    reportedBy: string;
    timestamp: {
      created: Date;
      lastModified: Date;
    };
    status: 'pending' | 'reviewed' | 'resolved';
  }>;
  teacherNotes: Array<{
    note: {
      text: string;
      image: QuestionImage;
    };
    addedBy: string;
    timestamp: {
      created: Date;
      lastModified: Date;
    };
  }>;
}

interface RevisionHistory {
  version: number;
  modifiedBy: string;
  changes: string;
  timestamp: Date;
}

export interface Question {
  _id: string;
  author: string;
  lastModifiedBy?: string;
  revisionHistory: RevisionHistory[];
  question: {
    text: string;
    image: QuestionImage;
  };
  questionType: 'single' | 'multiple' | 'numerical';
  options: Option[];
  correctOptions: number[];
  numericalAnswer?: NumericalAnswer;
  examType: string;
  class: string;
  subject: string;
  chapter: string;
  section: string;
  questionCategory: 'theoretical' | 'numerical';
  questionSource: 'custom' | 'india_book' | 'foreign_book' | 'pyq';
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  conceptualDifficulty: number;
  year: string;
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  language: 'english' | 'hindi';
  solution: {
    text: string;
    image: QuestionImage;
  };
  hints: Hint[];
  marks: number;
  negativeMarks: number;
  expectedTime: number;
  isActive: boolean;
  isVerified: boolean;
  verifiedBy?: string;
  statistics: Statistics;
  feedback: Feedback;
  tags: string[];
  relatedTopics: string[];
  commonMistakes: CommonMistake[];
  createdAt: string;
  updatedAt: string;
}

export interface ImageFiles {
  questionImage?: File;
  solutionImage?: File;
  optionImages: (File | null)[];
  hintImages: (File | null)[];
}

export interface QuestionFormState {
  question: {
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  };
  questionType: 'single' | 'multiple' | 'numerical';
  examType: string;
  class: string;
  subject: string;
  chapter: string;
  section: string;
  questionCategory: 'theoretical' | 'numerical';
  questionSource: 'custom' | 'india_book' | 'foreign_book' | 'pyq';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  expectedTime: number;
  language: 'english' | 'hindi';
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  year: string;
  solution: {
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  };
  options: Array<{
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  }>;
  correctOptions: number[];
  numericalAnswer?: {
    exactValue: number;
    range: {
      min: number;
      max: number;
    };
    unit: string;
  };
  hints: Hint[];
  tags: string[];
  relatedTopics: string[];
  prerequisites: string[];
  commonMistakes: CommonMistake[];
  conceptualDifficulty: number;
  isVerified: boolean;
  feedback: {
    studentReports: any[];
    teacherNotes: any[];
  };
  isActive: boolean;
}

interface QuestionState {
  // Current question data
  questionData: Question | null;
  tempQuestionData: QuestionFormState | null;
  imageFiles: ImageFiles;
  
  // UI state
  expandedSections: {
    question: boolean;
    options: boolean;
    solution: boolean;
    hints: boolean;
    commonMistakes: boolean;
    history: boolean;
  };
  
  // Form state
  unsavedChanges: boolean;
  isLoading: boolean;
  isSaving: boolean;
  success: string | null;
  error: string | null;
  
  // Data for dropdowns
  sections: { [key: string]: string[] };
  chapters: { [key: string]: string[] };
  
  // Actions
  setQuestionData: (question: Question | null) => void;
  setTempQuestionData: (data: QuestionFormState | null) => void;
  updateTempQuestionData: (field: keyof QuestionFormState | 'all', value: any, nestedField?: string, index?: number) => void;
  setImageFiles: (files: ImageFiles) => void;
  updateImageFile: (type: keyof ImageFiles, file: File | null, index?: number) => void;
  setExpandedSection: (section: keyof QuestionState['expandedSections'], expanded: boolean) => void;
  toggleExpandedSection: (section: keyof QuestionState['expandedSections']) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSuccess: (message: string | null) => void;
  setError: (error: string | null) => void;
  setSections: (subject: string, sections: string[]) => void;
  setChapters: (subject: string, chapters: string[]) => void;
  
  // Form management
  initializeForm: (question?: Question) => void;
  resetForm: () => void;
  clearDraft: () => void;
  saveDraft: () => void;
  loadDraft: () => void;
  
  // Validation
  validateForm: () => { isValid: boolean; errors: string[] };
  
  // Utility actions
  convertQuestionToFormState: (question: Question) => QuestionFormState;
  getEmptyFormState: () => QuestionFormState;
}

// Default values
const getEmptyImageFiles = (): ImageFiles => ({
  questionImage: undefined,
  solutionImage: undefined,
  optionImages: [null, null, null, null],
  hintImages: [],
});

const getDefaultExpandedSections = () => ({
  question: true,
  options: true,
  solution: false,
  hints: false,
  commonMistakes: false,
  history: false,
});

const getEmptyFormState = (): QuestionFormState => ({
  question: {
    text: '',
    image: { url: '', publicId: '' }
  },
  questionType: 'single',
  examType: 'none',
  class: 'none',
  subject: 'general_test',
  chapter: '',
  section: 'none',
  questionCategory: 'theoretical',
  questionSource: 'custom',
  difficulty: 'medium',
  marks: 1,
  negativeMarks: 0,
  expectedTime: 120,
  language: 'english',
  languageLevel: 'basic',
  year: 'not applicable',
  solution: {
    text: '',
    image: { url: '', publicId: '' }
  },
  options: [
    { text: '', image: { url: '', publicId: '' } },
    { text: '', image: { url: '', publicId: '' } },
    { text: '', image: { url: '', publicId: '' } },
    { text: '', image: { url: '', publicId: '' } }
  ],
  correctOptions: [],
  numericalAnswer: {
    exactValue: 0,
    range: { min: 0, max: 0 },
    unit: ''
  },
  hints: [],
  tags: [],
  relatedTopics: [],
  prerequisites: [],
  commonMistakes: [],
  conceptualDifficulty: 5,
  isVerified: false,
  feedback: {
    studentReports: [],
    teacherNotes: []
  },
  isActive: true,
});

const convertQuestionToFormState = (question: Question): QuestionFormState => ({
  question: question.question,
  questionType: question.questionType,
  examType: question.examType,
  class: question.class,
  subject: question.subject,
  chapter: question.chapter,
  section: question.section,
  questionCategory: question.questionCategory,
  questionSource: question.questionSource,
  difficulty: question.difficulty,
  marks: question.marks,
  negativeMarks: question.negativeMarks,
  expectedTime: question.expectedTime,
  language: question.language,
  languageLevel: question.languageLevel,
  year: question.year,
  solution: question.solution,
  options: question.options,
  correctOptions: question.correctOptions,
  numericalAnswer: question.numericalAnswer,
  hints: question.hints,
  tags: question.tags,
  relatedTopics: question.relatedTopics,
  prerequisites: question.prerequisites,
  commonMistakes: question.commonMistakes,
  conceptualDifficulty: question.conceptualDifficulty,
  isVerified: question.isVerified,
  feedback: question.feedback,
  isActive: question.isActive,
});

// Local storage helpers
const DRAFT_KEY = 'question-form-draft';

const saveDraftToStorage = (formData: QuestionFormState) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  } catch (error) {
    console.warn('Failed to save draft to localStorage:', error);
  }
};

const loadDraftFromStorage = (): QuestionFormState | null => {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (error) {
    console.warn('Failed to load draft from localStorage:', error);
    return null;
  }
};

const clearDraftFromStorage = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.warn('Failed to clear draft from localStorage:', error);
  }
};

export const useQuestionStore = create<QuestionState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      questionData: null,
      tempQuestionData: null,
      imageFiles: getEmptyImageFiles(),
      expandedSections: getDefaultExpandedSections(),
      unsavedChanges: false,
      isLoading: false,
      isSaving: false,
      success: null,
      error: null,
      sections: {},
      chapters: {},

      // Basic setters
      setQuestionData: (question) =>
        set((state) => {
          state.questionData = question;
        }),

      setTempQuestionData: (data) =>
        set((state) => {
          state.tempQuestionData = data;
          state.unsavedChanges = !!data;
        }),

      updateTempQuestionData: (field, value, nestedField, index) =>
        set((state) => {
          if (!state.tempQuestionData) {
            state.tempQuestionData = getEmptyFormState();
          }

          if (field === 'all') {
            state.tempQuestionData = value;
          } else if (nestedField !== undefined) {
            // Handle nested field updates
            if (index !== undefined && Array.isArray((state.tempQuestionData as any)[field])) {
              ((state.tempQuestionData as any)[field] as any[])[index][nestedField] = value;
            } else {
              ((state.tempQuestionData as any)[field] as any)[nestedField] = value;
            }
          } else if (index !== undefined && Array.isArray((state.tempQuestionData as any)[field])) {
            // Handle array updates
            ((state.tempQuestionData as any)[field] as any[])[index] = value;
          } else {
            // Handle direct field updates
            (state.tempQuestionData as any)[field] = value;
          }

          state.unsavedChanges = true;
        }),

      setImageFiles: (files) =>
        set((state) => {
          state.imageFiles = files;
        }),

      updateImageFile: (type, file, index) =>
        set((state) => {
          if (type === 'optionImages' && index !== undefined) {
            state.imageFiles.optionImages[index] = file;
          } else if (type === 'hintImages' && index !== undefined) {
            state.imageFiles.hintImages[index] = file;
          } else {
            (state.imageFiles as any)[type] = file;
          }
        }),

      setExpandedSection: (section, expanded) =>
        set((state) => {
          state.expandedSections[section] = expanded;
        }),

      toggleExpandedSection: (section) =>
        set((state) => {
          state.expandedSections[section] = !state.expandedSections[section];
        }),

      setUnsavedChanges: (hasChanges) =>
        set((state) => {
          state.unsavedChanges = hasChanges;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
          if (loading) {
            state.error = null;
          }
        }),

      setSaving: (saving) =>
        set((state) => {
          state.isSaving = saving;
          if (saving) {
            state.error = null;
            state.success = null;
          }
        }),

      setSuccess: (message) =>
        set((state) => {
          state.success = message;
          state.error = null;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
          state.success = null;
          state.isLoading = false;
          state.isSaving = false;
        }),

      setSections: (subject, sections) =>
        set((state) => {
          state.sections[subject] = sections;
        }),

      setChapters: (subject, chapters) =>
        set((state) => {
          state.chapters[subject] = chapters;
        }),

      // Form management
      initializeForm: (question) =>
        set((state) => {
          if (question) {
            state.questionData = question;
            state.tempQuestionData = convertQuestionToFormState(question);
          } else {
            state.tempQuestionData = getEmptyFormState();
          }
          state.imageFiles = getEmptyImageFiles();
          state.unsavedChanges = false;
          state.error = null;
          state.success = null;
        }),

      resetForm: () =>
        set((state) => {
          state.tempQuestionData = null;
          state.imageFiles = getEmptyImageFiles();
          state.unsavedChanges = false;
          state.error = null;
          state.success = null;
          state.expandedSections = getDefaultExpandedSections();
        }),

      clearDraft: () =>
        set((state) => {
          clearDraftFromStorage();
          state.tempQuestionData = null;
          state.unsavedChanges = false;
        }),

      saveDraft: () => {
        const state = get();
        if (state.tempQuestionData) {
          saveDraftToStorage(state.tempQuestionData);
        }
      },

      loadDraft: () =>
        set((state) => {
          const draft = loadDraftFromStorage();
          if (draft) {
            state.tempQuestionData = draft;
            state.unsavedChanges = true;
          }
        }),

      // Validation
      validateForm: () => {
        const state = get();
        const errors: string[] = [];
        
        if (!state.tempQuestionData) {
          errors.push('No form data available');
          return { isValid: false, errors };
        }

        const data = state.tempQuestionData;

        // Validate question content
        if (!data.question.text.trim() && !data.question.image.url) {
          errors.push('Question must have either text or image content');
        }

        // Validate options for non-numerical questions
        if (data.questionType !== 'numerical') {
          if (data.options.length !== 4) {
            errors.push('Question must have exactly 4 options');
          }
          
          data.options.forEach((option, index) => {
            if (!option.text.trim() && !option.image.url) {
              errors.push(`Option ${index + 1} must have either text or image content`);
            }
          });

          // Validate correct options
          if (data.correctOptions.length === 0) {
            errors.push('At least one correct option must be selected');
          }

          if (data.questionType === 'single' && data.correctOptions.length > 1) {
            errors.push('Single choice questions can only have one correct answer');
          }
        }

        // Validate numerical answer
        if (data.questionType === 'numerical') {
          if (!data.numericalAnswer?.exactValue && data.numericalAnswer?.exactValue !== 0) {
            errors.push('Numerical questions must have an exact value');
          }
        }

        // Validate required fields
        if (!data.subject) errors.push('Subject is required');
        if (!data.chapter.trim()) errors.push('Chapter is required');
        if (data.marks <= 0) errors.push('Marks must be positive');

        return { isValid: errors.length === 0, errors };
      },

      // Utility actions
      convertQuestionToFormState,
      getEmptyFormState,
    })),
    {
      name: 'question-store',
      partialize: (state) => ({
        sections: state.sections,
        chapters: state.chapters,
      }),
    }
  )
);

// Convenience hooks
export const useQuestionForm = () => {
  return useQuestionStore((state) => ({
    tempQuestionData: state.tempQuestionData,
    imageFiles: state.imageFiles,
    expandedSections: state.expandedSections,
    unsavedChanges: state.unsavedChanges,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    success: state.success,
    error: state.error,
    updateTempQuestionData: state.updateTempQuestionData,
    setExpandedSection: state.setExpandedSection,
    toggleExpandedSection: state.toggleExpandedSection,
    validateForm: state.validateForm,
  }));
};

export const useQuestionActions = () => {
  return useQuestionStore((state) => ({
    initializeForm: state.initializeForm,
    resetForm: state.resetForm,
    saveDraft: state.saveDraft,
    loadDraft: state.loadDraft,
    clearDraft: state.clearDraft,
    setLoading: state.setLoading,
    setSaving: state.setSaving,
    setSuccess: state.setSuccess,
    setError: state.setError,
  }));
};

export const useQuestionData = () => {
  return useQuestionStore((state) => ({
    questionData: state.questionData,
    sections: state.sections,
    chapters: state.chapters,
    setSections: state.setSections,
    setChapters: state.setChapters,
  }));
}; 