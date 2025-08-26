// Form validation types
export interface StepValidationResult {
  hasErrors: boolean;
  hasCriticalErrors: boolean;
  errors: Record<string, string>;
}

// Question form data types
export interface NumericalRange {
  min: number;
  max: number;
}

export interface OptionType {
  id?: string;
  text: string;
  image: File | null;
}

export interface HintType {
  id?: string;
  text: string;
  image: File | null;
}

export interface CommonMistakeType {
  description: string;
  explanation: string;
}

export interface QuestionFormData {
  // Basic question info
  questionText: string;
  questionImage: File | null;
  questionType: 'single' | 'multiple' | 'numerical';
  
  // Classification
  examType: 'jee_main' | 'jee_adv' | 'cuet' | 'neet' | 'cbse_11' | 'cbse_12' | 'none';
  class: 'class_9' | 'class_10' | 'class_11' | 'class_12' | 'none';
  subject: string;
  chapter: string;
  section: string;
  year?: string | number;
  
  // Metadata
  questionCategory: 'theoretical' | 'numerical';
  questionSource: 'custom' | 'india_book' | 'foreign_book' | 'pyq';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  expectedTime: number;
  language: 'english' | 'hindi';
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  
  // Solution
  solutionText: string;
  solutionImage: File | null;
  
  // For MCQ questions
  options: OptionType[];
  correctOptions: number[];
  
  // For numerical questions
  numericalAnswer: string;
  numericalType: 'exact' | 'range';
  numericalRange: NumericalRange;
  
  // Hints and tags
  hints: HintType[];
  tags: string[];
  relatedTopics: string[];
  prerequisites: string[];
  commonMistakes: CommonMistakeType[];
}

export type ValidationErrors = Record<string, string>; 