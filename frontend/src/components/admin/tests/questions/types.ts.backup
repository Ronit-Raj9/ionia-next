export interface Question {
  _id: string;
  question: {
    text: string;
    image?: { url?: string; publicId?: string };
  };
  questionType: 'single' | 'multiple' | 'numerical';
  options: Array<{ text?: string; image?: { url?: string; publicId?: string } }>;
  correctOptions: number[];
  examType: string;
  subject: string;
  chapter: string;
  class: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks?: number;
  isVerified?: boolean;
  isActive?: boolean;
  year?: string;
  languageLevel?: string;
  questionCategory?: string;
  questionSource?: string;
  section?: string;
  numericalAnswer?: {
    exactValue: number;
    range: {
      min: number;
      max: number;
    };
    unit: string;
  };
}

export interface FilterState {
  examType: string[];
  year: string[];
  subject: string[];
  difficulty: string[];
  chapter: string[];
  questionType: string[];
  questionCategory: string[];
  questionSource: string[];
  section: string[];
  languageLevel: string[];
  isVerified: boolean | null;
  isActive: boolean | null;
  marks: { min: number | null; max: number | null };
  negativeMarks: { min: number | null; max: number | null };
  class: string[];
  searchTerm: string;
}

export interface AvailableOptions {
  subjects: Set<string>;
  examTypes: Set<string>;
  years: Set<string>;
  chapters: Set<string>;
  difficulties: Set<string>;
  questionTypes: Set<string>;
  questionCategories: Set<string>;
  questionSources: Set<string>;
  sections: Set<string>;
  languageLevels: Set<string>;
  classes: Set<string>;
  marks: { min: number; max: number };
  negativeMarks: { min: number; max: number };
}

export interface SelectedQuestionsMetrics {
  count: number;
  totalMarks: number;
  subjectCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
} 