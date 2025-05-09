// Interfaces for type safety
export interface Option {
  text: string;
  image?: {
    url: string;
    publicId: string;
    file?: File | null;
  };
}

export interface Hint {
  text: string;
  image?: {
    url: string;
    publicId: string;
    file?: File | null;
  };
}

export interface CommonMistake {
  description: string;
  explanation: string;
}

export interface NumericalAnswer {
  exactValue: number;
  range: {
    min: number;
    max: number;
  };
  unit: string;
}

export interface StudentReport {
  type: 'error' | 'clarity' | 'difficulty' | 'other';
  description: {
    text: string;
    image: File | null;
  };
  reportedBy?: string;
  timestamp?: {
    created: Date;
    lastModified: Date;
  };
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface TeacherNote {
  note: {
    text: string;
    image: File | null;
  };
  addedBy?: string;
  timestamp?: {
    created: Date;
    lastModified: Date;
  };
}

export interface QuestionFormData {
  // Basic question info
  question: {
    text: string;
    image?: {
      url: string;
      publicId: string;
      file?: File | null;
    }
  };
  questionType: 'single' | 'multiple' | 'numerical';
  
  // Classification
  examType: 'jee_main' | 'jee_adv' | 'cuet' | 'neet' | 'cbse_11' | 'cbse_12' | 'none';
  class: 'class_9' | 'class_10' | 'class_11' | 'class_12' | 'none';
  subject: string;
  chapter: string;
  section: string;
  
  // Metadata
  questionCategory: 'theoretical' | 'numerical';
  questionSource: 'custom' | 'india_book' | 'foreign_book' | 'pyq';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  expectedTime: number;
  language: 'english' | 'hindi';
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  year?: string;
  
  // Solution
  solution: {
    text: string;
    image?: {
      url: string;
      publicId: string;
      file?: File | null;
    }
  };
  
  // For MCQ questions
  options: Array<{
    text: string;
    image?: {
      url: string;
      publicId: string;
      file?: File | null;
    }
  }>;
  correctOptions: number[];
  
  // For numerical questions
  numericalAnswer?: {
    exactValue: number;
    range: {
      min: number;
      max: number;
    };
    unit?: string;
  };
  
  // Additional content
  hints: Array<{
    text: string;
    image?: {
      url: string;
      publicId: string;
      file?: File | null;
    }
  }>;
  
  // Tags and topics
  tags: string[];
  relatedTopics: string[];
  prerequisites: string[];
  
  // Additional fields from model
  commonMistakes: Array<{
    description: string;
    explanation: string;
  }>;
  conceptualDifficulty: number;
  isVerified?: boolean;
  feedback?: {
    studentReports: any[];
    teacherNotes: any[];
  };
  isActive: boolean;
}

// Form validation
export interface ValidationErrors {
  [key: string]: string;
}

// Props for component communication
export interface StepProps {
  formData: QuestionFormData;
  errors: ValidationErrors;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field?: string,
    nestedField?: string,
    index?: number
  ) => void;
  handleFileUpload: (file: File | null, field: string, index?: number) => void;
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors>>;
}

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  label: string;
  initialFile?: File | null;
  initialUrl?: string;
}

export interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
}

export interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  errors: ValidationErrors;
}

export interface FormStepperProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    title: string;
    icon: JSX.Element;
    isValid: boolean;
  }>;
  onStepClick: (step: number) => void;
} 