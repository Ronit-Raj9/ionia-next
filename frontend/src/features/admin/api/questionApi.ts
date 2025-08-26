import { QuestionService } from '../services/questionService';

// ==========================================
// ❓ QUESTION MANAGEMENT API ENDPOINTS
// ==========================================

/**
 * Fetches paginated questions with filters
 */
export const getQuestions = QuestionService.getQuestions;

/**
 * Gets a single question by ID
 */
export const getQuestionById = QuestionService.getQuestionById;

/**
 * Creates a new question
 */
export const createQuestion = QuestionService.createQuestion;

/**
 * Updates an existing question
 */
export const updateQuestion = QuestionService.updateQuestion;

/**
 * Deletes a question permanently
 */
export const deleteQuestion = QuestionService.deleteQuestion;

/**
 * Toggles question active status
 */
export const toggleQuestionStatus = QuestionService.toggleQuestionStatus;

/**
 * Verifies a question (admin only)
 */
export const verifyQuestion = QuestionService.verifyQuestion;

/**
 * Duplicates a question
 */
export const duplicateQuestion = QuestionService.duplicateQuestion;

/**
 * Gets question statistics
 */
export const getQuestionStatistics = QuestionService.getQuestionStatistics;

/**
 * Bulk uploads questions
 */
export const bulkUploadQuestions = QuestionService.bulkUploadQuestions;

/**
 * Bulk deletes questions
 */
export const bulkDeleteQuestions = QuestionService.bulkDeleteQuestions;

/**
 * Gets question revision history
 */
export const getQuestionRevisionHistory = QuestionService.getQuestionRevisionHistory;

/**
 * Gets detailed change history
 */
export const getDetailedChangeHistory = QuestionService.getDetailedChangeHistory;

/**
 * Reverts question to a specific version
 */
export const revertToVersion = QuestionService.revertToVersion;
