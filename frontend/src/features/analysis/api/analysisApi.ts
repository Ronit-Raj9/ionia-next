// ==========================================
// 🌐 ANALYSIS API LAYER - HTTP COMMUNICATION
// ==========================================

import AnalysisService, { TestAnalysisResponse } from '../services/analysisService';
import { AnalysisData } from '../store/analysisStore';

// ==========================================
// 📊 TEST ANALYSIS API
// ==========================================

/**
 * Get detailed test analysis by attempt ID
 */
export const getTestAnalysis = async (attemptId: string, paperId?: string): Promise<TestAnalysisResponse> => {
  try {
    if (!attemptId && !paperId) {
      throw new Error('Either attemptId or paperId must be provided');
    }
    
    return await AnalysisService.getTestAnalysis(attemptId, paperId);
  } catch (error) {
    console.error('API Error in getTestAnalysis:', error);
    throw error;
  }
};

/**
 * Get analysis data for a specific test
 */
export const getAnalysisData = async (testId: string): Promise<AnalysisData> => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getAnalysisData(testId);
  } catch (error) {
    console.error('API Error in getAnalysisData:', error);
    throw error;
  }
};

/**
 * Get user's analysis history
 */
export const getAnalysisHistory = async (): Promise<AnalysisData[]> => {
  try {
    return await AnalysisService.getAnalysisHistory();
  } catch (error) {
    console.error('API Error in getAnalysisHistory:', error);
    throw error;
  }
};

// ==========================================
// 📈 PERFORMANCE ANALYTICS API
// ==========================================

/**
 * Get performance trends
 */
export const getPerformanceTrends = async (testId?: string) => {
  try {
    return await AnalysisService.getPerformanceTrends(testId);
  } catch (error) {
    console.error('API Error in getPerformanceTrends:', error);
    throw error;
  }
};

/**
 * Get subject-wise analysis
 */
export const getSubjectAnalysis = async () => {
  try {
    return await AnalysisService.getSubjectAnalysis();
  } catch (error) {
    console.error('API Error in getSubjectAnalysis:', error);
    throw error;
  }
};

/**
 * Get difficulty analysis
 */
export const getDifficultyAnalysis = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getDifficultyAnalysis(testId);
  } catch (error) {
    console.error('API Error in getDifficultyAnalysis:', error);
    throw error;
  }
};

// ==========================================
// ⏱️ TIME ANALYTICS API
// ==========================================

/**
 * Get time analytics for a test
 */
export const getTimeAnalytics = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getTimeAnalytics(testId);
  } catch (error) {
    console.error('API Error in getTimeAnalytics:', error);
    throw error;
  }
};

/**
 * Get time efficiency metrics
 */
export const getTimeEfficiencyMetrics = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getTimeEfficiencyMetrics(testId);
  } catch (error) {
    console.error('API Error in getTimeEfficiencyMetrics:', error);
    throw error;
  }
};

// ==========================================
// 🔍 ERROR ANALYSIS API
// ==========================================

/**
 * Get error analysis for a test
 */
export const getErrorAnalysis = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getErrorAnalysis(testId);
  } catch (error) {
    console.error('API Error in getErrorAnalysis:', error);
    throw error;
  }
};

/**
 * Get mistake patterns
 */
export const getMistakePatterns = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getMistakePatterns(testId);
  } catch (error) {
    console.error('API Error in getMistakePatterns:', error);
    throw error;
  }
};

// ==========================================
// 🧭 BEHAVIORAL ANALYSIS API
// ==========================================

/**
 * Get navigation patterns
 */
export const getNavigationPatterns = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getNavigationPatterns(testId);
  } catch (error) {
    console.error('API Error in getNavigationPatterns:', error);
    throw error;
  }
};

/**
 * Get interaction metrics
 */
export const getInteractionMetrics = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getInteractionMetrics(testId);
  } catch (error) {
    console.error('API Error in getInteractionMetrics:', error);
    throw error;
  }
};

/**
 * Get behavioral insights
 */
export const getBehavioralInsights = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getBehavioralInsights(testId);
  } catch (error) {
    console.error('API Error in getBehavioralInsights:', error);
    throw error;
  }
};

// ==========================================
// 📋 COMPARATIVE ANALYSIS API
// ==========================================

/**
 * Get comparative analysis with other users
 */
export const getComparativeAnalysis = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getComparativeAnalysis(testId);
  } catch (error) {
    console.error('API Error in getComparativeAnalysis:', error);
    throw error;
  }
};

/**
 * Get percentile ranking
 */
export const getPercentileRanking = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getPercentileRanking(testId);
  } catch (error) {
    console.error('API Error in getPercentileRanking:', error);
    throw error;
  }
};

// ==========================================
// 🎯 RECOMMENDATIONS API
// ==========================================

/**
 * Get personalized recommendations
 */
export const getRecommendations = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getRecommendations(testId);
  } catch (error) {
    console.error('API Error in getRecommendations:', error);
    throw error;
  }
};

/**
 * Get study plan suggestions
 */
export const getStudyPlanSuggestions = async (testId: string) => {
  try {
    if (!testId) {
      throw new Error('Test ID is required');
    }
    
    return await AnalysisService.getStudyPlanSuggestions(testId);
  } catch (error) {
    console.error('API Error in getStudyPlanSuggestions:', error);
    throw error;
  }
};

// ==========================================
// 🔧 UTILITY API FUNCTIONS
// ==========================================

/**
 * Transform raw analysis data to AnalysisData format
 */
export const transformAnalysisData = (rawData: TestAnalysisResponse): AnalysisData => {
  try {
    return AnalysisService.transformAnalysisData(rawData);
  } catch (error) {
    console.error('Error transforming analysis data:', error);
    throw new Error('Failed to transform analysis data');
  }
};

/**
 * Calculate time efficiency score
 */
export const calculateTimeEfficiency = (timeAnalysis: any): number => {
  try {
    return AnalysisService.calculateTimeEfficiency(timeAnalysis);
  } catch (error) {
    console.error('Error calculating time efficiency:', error);
    return 0;
  }
};

/**
 * Generate recommendations based on analysis data
 */
export const generateRecommendations = (analysisData: AnalysisData) => {
  try {
    return AnalysisService.generateRecommendations(analysisData);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return {
      strengths: [],
      improvements: [],
      studyPlan: []
    };
  }
};

/**
 * Validate analysis data structure
 */
export const validateAnalysisData = (data: any): boolean => {
  return AnalysisService.validateAnalysisData(data);
};

// ==========================================
// 📤 EXPORTS
// ==========================================

export type {
  TestAnalysisResponse
};

export default {
  // Test Analysis
  getTestAnalysis,
  getAnalysisData,
  getAnalysisHistory,
  
  // Performance Analytics
  getPerformanceTrends,
  getSubjectAnalysis,
  getDifficultyAnalysis,
  
  // Time Analytics
  getTimeAnalytics,
  getTimeEfficiencyMetrics,
  
  // Error Analysis
  getErrorAnalysis,
  getMistakePatterns,
  
  // Behavioral Analysis
  getNavigationPatterns,
  getInteractionMetrics,
  getBehavioralInsights,
  
  // Comparative Analysis
  getComparativeAnalysis,
  getPercentileRanking,
  
  // Recommendations
  getRecommendations,
  getStudyPlanSuggestions,
  
  // Utilities
  transformAnalysisData,
  calculateTimeEfficiency,
  generateRecommendations,
  validateAnalysisData
};
