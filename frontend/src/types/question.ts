export interface Question {
  _id: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  lastModifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  question: {
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  };
  questionType: 'single' | 'multiple' | 'numerical';
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
  examType: string;
  class: string;
  subject: string;
  chapter: string;
  questionCategory: 'theoretical' | 'numerical';
  questionSource: 'custom' | 'india_book' | 'foreign_book' | 'pyq';
  section: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  conceptualDifficulty: number;
  year: string;
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  language: 'english' | 'hindi';
  solution: {
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  };
  hints: Array<{
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  }>;
  marks: number;
  negativeMarks: number;
  isActive: boolean;
  isVerified: boolean;
  verifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  statistics: {
    timesAttempted: number;
    successRate: number;
    averageTimeTaken: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QuestionUpdateData {
  question: {
    text: string;
    image?: {
      url: string;
      publicId: string;
    };
  };
  solution: {
    text: string;
    image?: {
      url: string;
      publicId: string;
    };
  };
  subject: string;
  chapter: string;
  examType: string;
  class: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  language: string;
  languageLevel: string;
  questionType: string;
  questionCategory: string;
  questionSource: string;
  section: string;
  year: string;
  options?: Array<{
    text: string;
    image?: {
      url: string;
      publicId: string;
    };
  }>;
  correctOptions?: number[];
  numericalAnswer?: {
    exactValue: number;
    range: {
      min: number;
      max: number;
    };
    unit: string;
  };
  isActive: boolean;
}

export interface ImageFiles {
  questionImage?: File;
  solutionImage?: File;
  optionImages: (File | null)[];
  hintImages: (File | null)[];
}
