import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

// Add new interface for form state
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
    studentReports: any[]; // Allow any array type for form state
    teacherNotes: any[]; // Allow any array type for form state
  };
  isActive: boolean;
}

interface QuestionState {
  questionData: Question | null;
  tempQuestionData: QuestionFormState | null;
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
  sections: {
    [key: string]: string[];
  };
  chapters: {
    [key: string]: string[];
  };
}

// Helper function to get empty image files state
const getEmptyImageFiles = (): ImageFiles => ({
    questionImage: undefined,
    solutionImage: undefined,
    optionImages: [],
    hintImages: []
});

// Helper function to get default expanded sections state
const getDefaultExpandedSections = () => ({
    question: true,
    options: false,
    solution: false,
    hints: false,
    commonMistakes: false,
    history: false
});

// Helper function to clear localStorage drafts
const clearLocalStorageDrafts = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('questionDraft');
    localStorage.removeItem('tempQuestionData');
    localStorage.removeItem('questionFormState');
    localStorage.removeItem('selectedChapter');
    localStorage.removeItem('selectedSection');
  }
};

// Helper function to save form state to localStorage
const saveFormStateToLocalStorage = (formData: QuestionFormState) => {
  if (typeof window !== 'undefined') {
    try {
      const stateToSave = {
        ...formData,
        subject: formData.subject,
        section: formData.section,
        chapter: formData.chapter
      };
      localStorage.setItem('questionFormState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving form state:', error);
    }
  }
};

// Helper function to load form state from localStorage
const loadFormStateFromLocalStorage = (): QuestionFormState | null => {
  if (typeof window !== 'undefined') {
    try {
      const savedState = localStorage.getItem('questionFormState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        return {
          ...defaultFormState,
          ...parsedState,
          subject: parsedState.subject || '',
          section: parsedState.section || '',
          chapter: parsedState.chapter || '',
          // Ensure other fields are preserved
          examType: parsedState.examType || defaultFormState.examType,
          class: parsedState.class || defaultFormState.class,
          difficulty: parsedState.difficulty || defaultFormState.difficulty,
          languageLevel: parsedState.languageLevel || defaultFormState.languageLevel
        };
      }
    } catch (error) {
      console.error('Error loading form state:', error);
    }
  }
  return null;
};

// Helper function to reset state to default
const resetStateToDefault = (state: QuestionState) => {
  const savedState = loadFormStateFromLocalStorage();
  state.questionData = null;
  state.tempQuestionData = savedState || defaultFormState;
  state.imageFiles = getEmptyImageFiles();
  state.expandedSections = getDefaultExpandedSections();
  state.unsavedChanges = false;
  state.success = null;
  state.error = null;
  state.isLoading = false;
  state.isSaving = false;
  clearLocalStorageDrafts();
};

const defaultFormState: QuestionFormState = {
  question: { text: '', image: { url: '', publicId: '' } },
  questionType: 'single',
  examType: 'none',
  class: 'none',
  subject: '',
  chapter: '',
  section: '',
  questionCategory: 'theoretical',
  questionSource: 'custom',
  difficulty: 'medium',
  marks: 1,
  negativeMarks: 0,
  expectedTime: 120,
  language: 'english',
  languageLevel: 'basic',
  year: 'not applicable',
  solution: { text: '', image: { url: '', publicId: '' } },
  options: Array(4).fill({ text: '', image: { url: '', publicId: '' } }),
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
  feedback: { studentReports: [], teacherNotes: [] },
  isActive: true
};

// Helper function to convert Question to QuestionFormState
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
  commonMistakes: question.commonMistakes || [],
  conceptualDifficulty: question.conceptualDifficulty,
  isVerified: question.isVerified,
  feedback: {
    studentReports: [],
    teacherNotes: []
  },
  isActive: question.isActive
});

const initialState: QuestionState = {
  questionData: null,
  tempQuestionData: defaultFormState,
  imageFiles: getEmptyImageFiles(),
  expandedSections: getDefaultExpandedSections(),
  unsavedChanges: false,
  success: null,
  error: null,
  isLoading: false,
  isSaving: false,
  sections: {
    physics: ['mechanics', 'electromagnetism', 'thermodynamics', 'optics', 'modern_physics', 'none'],
    chemistry: ['organic', 'inorganic', 'physical', 'analytical', 'none'],
    mathematics: ['algebra', 'calculus', 'geometry', 'statistics', 'trigonometry', 'none'],
    biology: ['botany', 'zoology', 'human_physiology', 'ecology', 'genetics', 'none'],
    english: ['reading_comprehension', 'vocabulary', 'grammar', 'writing', 'none'],
    general_test: ['gk', 'current_affairs', 'general_science', 'mathematical_reasoning', 'logical_reasoning', 'none']
  },
  chapters: {
    physics: [
      'mechanics_basics',
      'kinematics',
      'dynamics',
      'work_energy_power',
      'rotational_motion',
      'gravitation',
      'properties_of_matter',
      'thermodynamics',
      'kinetic_theory',
      'oscillations',
      'waves',
      'electrostatics',
      'current_electricity',
      'magnetic_effects',
      'electromagnetic_induction',
      'alternating_current',
      'electromagnetic_waves',
      'ray_optics',
      'wave_optics',
      'modern_physics',
      'semiconductor_electronics',
      'communication_systems'
    ],
    chemistry: [
      'atomic_structure',
      'chemical_bonding',
      'states_of_matter',
      'thermodynamics',
      'equilibrium',
      'redox_reactions',
      'hydrogen',
      's_block_elements',
      'p_block_elements',
      'd_and_f_block_elements',
      'coordination_compounds',
      'organic_chemistry_basics',
      'hydrocarbons',
      'organic_compounds_with_functional_groups',
      'biomolecules',
      'polymers',
      'chemistry_in_everyday_life'
    ],
    mathematics: [
      'sets_relations_functions',
      'complex_numbers',
      'matrices_determinants',
      'permutations_combinations',
      'mathematical_induction',
      'binomial_theorem',
      'sequences_series',
      'limit_continuity_differentiability',
      'integral_calculus',
      'differential_equations',
      'coordinate_geometry',
      'vectors_3d',
      'statistics_probability'
    ],
    biology: [
      'diversity_in_living_world',
      'structural_organization',
      'cell_structure_function',
      'plant_physiology',
      'human_physiology',
      'reproduction',
      'genetics_evolution',
      'biology_human_welfare',
      'biotechnology',
      'ecology_environment'
    ]
  }
};

// Update the UpdateQuestionPayload type
type UpdateQuestionPayload = {
  field: keyof QuestionFormState | 'all';
  value: any;
  nestedField?: string;
  index?: number;
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
    setQuestionData: (state, action: PayloadAction<Question>) => {
      state.questionData = action.payload;
      state.tempQuestionData = convertQuestionToFormState(action.payload);
      state.isLoading = false;
      state.error = null;
      state.imageFiles = {
        questionImage: undefined,
        solutionImage: undefined,
        optionImages: new Array(action.payload.options.length).fill(null),
        hintImages: new Array(action.payload.hints.length).fill(null)
      };
    },
    updateTempQuestionData: (state, action: PayloadAction<UpdateQuestionPayload>) => {
      if (!state.tempQuestionData) return;

      const { field, value, nestedField, index } = action.payload;
      state.unsavedChanges = true;

      if (field === 'all') {
        state.tempQuestionData = value as QuestionFormState;
        saveFormStateToLocalStorage(value as QuestionFormState);
        return;
      }

      const newTempData = { ...state.tempQuestionData };

      if (index !== undefined && nestedField && Array.isArray(newTempData[field])) {
        const newArray = [...(newTempData[field] as any[])];
        newArray[index] = nestedField 
          ? { ...newArray[index], [nestedField]: value }
          : value;
        (newTempData[field] as any[]) = newArray;
      } else if (nestedField && typeof newTempData[field] === 'object') {
        (newTempData[field] as any) = {
          ...(newTempData[field] as object),
          [nestedField]: value
        };
      } else {
        (newTempData[field] as any) = value;
      }

      state.tempQuestionData = newTempData;
      saveFormStateToLocalStorage(newTempData);
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
    clearNotifications: (state) => {
      state.success = null;
      state.error = null;
    },
    clearQuestionState: (state) => {
      resetStateToDefault(state);
    },
    clearDraft: (state) => {
      state.tempQuestionData = defaultFormState;
      state.unsavedChanges = false;
      state.imageFiles = getEmptyImageFiles();
      clearLocalStorageDrafts();
    },
    resetToDefault: (state) => {
      resetStateToDefault(state);
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
  clearNotifications,
  clearQuestionState,
  clearDraft,
  resetToDefault
} = questionSlice.actions;

export default questionSlice.reducer; 