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
  examType: 'jee_main' | 'jee_adv' | 'cuet' | 'neet' | 'cbse_11' | 'cbse_12' | 'none';
  class: 'class_9' | 'class_10' | 'class_11' | 'class_12' | 'none';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  expectedTime: number;
  language: 'english' | 'hindi';
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  questionType: 'single' | 'multiple' | 'numerical';
  questionCategory: 'theoretical' | 'numerical';
  questionSource: 'custom' | 'india_book' | 'foreign_book' | 'pyq';
  section: string;
  year: string;
  options: Array<{
    text: string;
    image?: {
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
  hints: Array<{
    text: string;
    image?: {
      url: string;
      publicId: string;
    };
  }>;
  tags: string[];
  relatedTopics: string[];
  prerequisites: string[];
  commonMistakes: Array<{
    description: string;
    explanation: string;
  }>;
  conceptualDifficulty: number;
  isVerified: boolean;
  feedback: {
    studentReports: any[];
    teacherNotes: any[];
  };
  isActive: boolean;
}

export interface ImageFiles {
  questionImage?: File;
  solutionImage?: File;
  optionImages: (File | null)[];
  hintImages: (File | null)[];
}
