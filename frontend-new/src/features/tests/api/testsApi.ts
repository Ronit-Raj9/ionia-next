// ==========================================
// 🌐 TEST API LAYER - HTTP COMMUNICATION
// ==========================================

import TestService, {
  Test,
  TestForAttempt,
  TestSubmission,
  TestAnalysis,
  TestFilters,
  CreateTestData,
  TestAnalytics
} from '../services/testServices';

// ==========================================
// 📋 TEST MANAGEMENT API
// ==========================================

/**
 * Get all tests with filtering and pagination
 */
export const getTests = async (filters: TestFilters = {}) => {
  return await TestService.getTests(filters);
};

/**
 * Get a single test by ID
 */
export const getTestById = async (testId: string): Promise<Test> => {
  return await TestService.getTestById(testId);
};

/**
 * Create a new test
 */
export const createTest = async (testData: CreateTestData): Promise<Test> => {
  return await TestService.createTest(testData);
};

/**
 * Update an existing test
 */
export const updateTest = async (testId: string, updateData: Partial<CreateTestData>): Promise<Test> => {
  return await TestService.updateTest(testId, updateData);
};

/**
 * Delete a test
 */
export const deleteTest = async (testId: string): Promise<void> => {
  return await TestService.deleteTest(testId);
};

// ==========================================
// 🎯 TEST ATTEMPTS API
// ==========================================

/**
 * Get a test prepared for attempting (without answers)
 */
export const getTestForAttempt = async (testId: string): Promise<TestForAttempt> => {
  return await TestService.getTestForAttempt(testId);
};

/**
 * Submit test answers and get analysis
 */
export const submitTest = async (submission: TestSubmission): Promise<{
  attemptId: string;
  analysisUrl: string;
}> => {
  return await TestService.submitTest(submission);
};

// ==========================================
// 📊 TEST ANALYSIS API
// ==========================================

/**
 * Get detailed test analysis
 */
export const getTestAnalysis = async (attemptId: string, paperId?: string): Promise<TestAnalysis> => {
  return await TestService.getTestAnalysis(attemptId, paperId);
};

/**
 * Get time analytics for a test
 */
export const getTimeAnalytics = async (testId: string) => {
  return await TestService.getTimeAnalytics(testId);
};

/**
 * Get error analysis for a test
 */
export const getErrorAnalysis = async (testId: string) => {
  return await TestService.getErrorAnalysis(testId);
};

/**
 * Get navigation patterns for a test
 */
export const getNavigationPatterns = async (testId: string) => {
  return await TestService.getNavigationPatterns(testId);
};

/**
 * Get difficulty analysis for a test
 */
export const getDifficultyAnalysis = async (testId: string) => {
  return await TestService.getDifficultyAnalysis(testId);
};

/**
 * Get interaction metrics for a test
 */
export const getInteractionMetrics = async (testId: string) => {
  return await TestService.getInteractionMetrics(testId);
};

/**
 * Get performance trends across multiple attempts
 */
export const getPerformanceTrends = async (testId?: string) => {
  return await TestService.getPerformanceTrends(testId);
};

/**
 * Get subject-wise analysis
 */
export const getSubjectAnalysis = async () => {
  return await TestService.getSubjectAnalysis();
};

/**
 * Get solutions for a test attempt
 */
export const getSolutions = async (attemptId: string) => {
  return await TestService.getSolutions(attemptId);
};

/**
 * Delete a test attempt
 */
export const deleteTestAttempt = async (attemptId: string) => {
  return await TestService.deleteTestAttempt(attemptId);
};

// ==========================================
// 📈 ANALYTICS API
// ==========================================

/**
 * Get test analytics for admin dashboard
 */
export const getTestAnalytics = async (): Promise<TestAnalytics> => {
  return await TestService.getTestAnalytics();
};

// ==========================================
// 🔧 UTILITY API FUNCTIONS
// ==========================================

/**
 * Calculate test score based on answers and marking scheme
 */
export const calculateScore = TestService.calculateScore;

/**
 * Calculate percentage score
 */
export const calculatePercentage = TestService.calculatePercentage;

/**
 * Format time duration
 */
export const formatTime = TestService.formatTime;

/**
 * Validate test submission data
 */
export const validateSubmission = TestService.validateSubmission;

// ==========================================
// 📤 EXPORTS
// ==========================================

export {
  Test,
  TestForAttempt,
  TestSubmission,
  TestAnalysis,
  TestFilters,
  CreateTestData,
  TestAnalytics
};

export default {
  // Test Management
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  
  // Test Attempts
  getTestForAttempt,
  submitTest,
  
  // Test Analysis
  getTestAnalysis,
  getTimeAnalytics,
  getErrorAnalysis,
  getNavigationPatterns,
  getDifficultyAnalysis,
  getInteractionMetrics,
  getPerformanceTrends,
  getSubjectAnalysis,
  getSolutions,
  deleteTestAttempt,
  
  // Analytics
  getTestAnalytics,
  
  // Utilities
  calculateScore,
  calculatePercentage,
  formatTime,
  validateSubmission
};
