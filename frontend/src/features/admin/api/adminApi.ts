import { AdminService } from '../services/adminService';

// ==========================================
// 📊 ANALYTICS API ENDPOINTS
// ==========================================

/**
 * Fetches the main analytics data for the admin dashboard.
 * Includes: totalQuestions, activeUsers, totalStudents, questionsBySubject, recentQuestions
 * Uses smart caching to avoid unnecessary API calls.
 */
export const getAdminAnalytics = AdminService.getAnalytics;

/**
 * Forces a refresh of analytics data, bypassing cache
 */
export const refreshAdminAnalytics = AdminService.refreshAnalytics;

/**
 * Clears the analytics cache
 */
export const clearAnalyticsCache = AdminService.clearAnalyticsCache;

/**
 * Marks analytics cache as stale (useful when data might be outdated)
 */
export const markAnalyticsStale = AdminService.markAnalyticsStale;



// ==========================================
// 📝 TEST MANAGEMENT API ENDPOINTS
// ==========================================

/**
 * Fetches paginated tests with filters
 */
export const getTests = AdminService.getTests;

/**
 * Fetches all tests without pagination (admin only)
 */
export const getAllTests = AdminService.getAllTests;

/**
 * Creates a new test
 */
export const createTest = AdminService.createTest;

/**
 * Updates an existing test
 */
export const updateTest = AdminService.updateTest;

/**
 * Deletes a test
 */
export const deleteTest = AdminService.deleteTest;

/**
 * Gets a single test by ID
 */
export const getTestById = AdminService.getTestById;

/**
 * Gets a test prepared for attempting (without answers)
 */
export const getTestForAttempt = AdminService.getTestForAttempt;

/**
 * Gets mock tests by exam type (public endpoint)
 */
export const getMockTestsByExamType = AdminService.getMockTestsByExamType;

/**
 * Gets a specific mock test by exam type and ID (public endpoint)
 */
export const getMockTestById = AdminService.getMockTestById;

/**
 * Gets a mock test prepared for attempting (public endpoint)
 */
export const getMockTestForAttempt = AdminService.getMockTestForAttempt;