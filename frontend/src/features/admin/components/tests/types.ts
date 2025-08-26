export interface TestDetails {
  // Core Info
  title: string;
  description: string;
  tags: string[]; // Represent as comma-separated string in input, parse on submit
  testCategory: 'PYQ' | 'Platform' | 'UserCustom' | ''; // Allow empty for initial state
  status: 'draft' | 'published' | 'archived';
  
  // Configuration
  instructions: string;
  solutionsVisibility: 'immediate' | 'after_submission' | 'after_deadline' | 'manual';
  attemptsAllowed: number | null; // Use null for unlimited
  duration: number; // In minutes
  markingScheme?: { // Optional
    correct?: number;
    incorrect?: number;
    unattempted?: number;
  };

  // Context & Classification
  subject: string; // Use enum values + 'Mixed', 'Full Syllabus'
  examType: string; // Use enum values
  class: string; // Use enum values
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed' | ''; // Allow empty for initial state

  // Category Specific Fields
  // PYQ
  year?: number;
  month?: number;
  day?: number;
  session?: string;
  
  // Platform
  platformTestType?: 'Mock' | 'Practice' | 'Chapter' | 'FullSyllabus' | 'TopicWise' | 'Diagnostic' | 'Sectional' | '';
  isPremium?: boolean;
  syllabus?: string;
}

export const testCategories = ['PYQ', 'Platform', 'UserCustom'];
export const statuses = ['draft', 'published', 'archived'];
export const solutionsVisibilities = ['immediate', 'after_submission', 'after_deadline', 'manual'];
export const subjects = [
  'general_test', 'english', 'biology', 'physics', 'chemistry', 
  'mathematics', 'social_science', 'computer_science', 'information_practice', 
  'history', 'civics', 'geography', 'general_knowledge', 
  'Mixed', 'Full Syllabus' 
];
export const examTypes = ['jee_main', 'jee_adv', 'cuet', 'neet', 'cbse_11', 'cbse_12', 'none'];
export const classes = ['class_9', 'class_10', 'class_11', 'class_12', 'none'];
export const difficulties = ['easy', 'medium', 'hard', 'mixed'];
export const platformTestTypes = ['Mock', 'Practice', 'Chapter', 'FullSyllabus', 'TopicWise', 'Diagnostic', 'Sectional']; 