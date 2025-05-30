/**
 * Utility to calculate correct, incorrect, and skipped questions consistently
 * across all solution components
 */
interface PerformanceMetrics {
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
}

/**
 * Calculates performance metrics consistently 
 * @param questions The question array with isCorrect and userAnswer properties
 * @returns Object containing calculated metrics
 */
export const calculatePerformanceMetrics = (questions: any[]): PerformanceMetrics => {
  const totalQuestions = questions.length;
  
  // Count correct answers directly
  const totalCorrect = questions.filter(q => q.isCorrect).length;
  
  // Count attempted questions (has a user answer)
  const totalAttempted = questions.filter(q => 
    q.userAnswer !== undefined && q.userAnswer !== null
  ).length;
  
  // Calculate incorrect as attempted minus correct
  const totalIncorrect = totalAttempted - totalCorrect;
  
  // Calculate skipped as total minus attempted
  const totalSkipped = totalQuestions - totalAttempted;
  
  return {
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    totalSkipped
  };
}; 