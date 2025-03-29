export interface QuestionData {
  _id: string;
  author: {
    _id: string;
    email: string;
  };
  lastModifiedBy?: {
    _id: string;
    email: string;
  };
  revisionHistory: Array<{
    version: number;
    modifiedBy?: {
      _id: string;
      email: string;
    };
    changes: string;
    timestamp: string;
  }>;
  tags: string[];
  isVerified: boolean;
  verifiedBy?: {
    _id: string;
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
  commonMistakes: Array<{
    description: string;
    explanation: string;
  }>;
  statistics: {
    timesAttempted: number;
    successRate: number;
    averageTimeTaken: number;
  };
  examType: 'jee_main' | 'jee_adv' | 'cuet' | 'neet' | 'cbse_10' | 'cbse_12' | 'none';
  subject: string;
  chapter: string;
  sectionPhysics?: string;
  sectionChemistry?: string;
  sectionMathematics?: string;
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
  relatedTopics: string[];
  marks: number;
  negativeMarks: number;
  expectedTime: number;
  isActive: boolean;
  feedback: {
    studentReports: Array<{
      type: 'error' | 'clarity' | 'difficulty' | 'other';
      description: string;
      reportedBy: {
        _id: string;
        email: string;
      };
      timestamp: string;
      status: 'pending' | 'reviewed' | 'resolved';
    }>;
    teacherNotes: Array<{
      note: string;
      addedBy: {
        _id: string;
        email: string;
      };
      timestamp: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ImageFiles {
  questionImage?: File;
  solutionImage?: File;
  optionImages: (File | null)[];
  hintImages: (File | null)[];
}
