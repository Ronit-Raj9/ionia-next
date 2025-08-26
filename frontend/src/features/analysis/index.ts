// ==========================================
// 📊 ANALYSIS FEATURE - MAIN EXPORTS
// ==========================================

// Store
export { 
  useAnalysisStore, 
  useCurrentAnalysis, 
  useAnalysisActions, 
  useAnalysisComputed, 
  useAnalysisHistory 
} from './store/analysisStore';
export type { 
  AnalysisData, 
  QuestionAnalysis, 
  SubjectPerformance, 
  TimeAnalysis, 
  DifficultyAnalysis,
  ComparisonData 
} from './store/analysisStore';

// Services
export { default as AnalysisService } from './services/analysisService';
export type { TestAnalysisResponse } from './services/analysisService';

// API
export { 
  getTestAnalysis,
  getAnalysisData,
  getAnalysisHistory,
  getPerformanceTrends,
  getSubjectAnalysis,
  getDifficultyAnalysis,
  getTimeAnalytics,
  getTimeEfficiencyMetrics,
  getErrorAnalysis,
  getMistakePatterns,
  getNavigationPatterns,
  getInteractionMetrics,
  getBehavioralInsights,
  getComparativeAnalysis,
  getPercentileRanking,
  getRecommendations,
  getStudyPlanSuggestions,
  transformAnalysisData,
  calculateTimeEfficiency,
  generateRecommendations,
  validateAnalysisData
} from './api/analysisApi';

// Hooks
export { useAnalysisData } from './hooks/useAnalysisData';

// Components
export { default as AnalysisWindow } from './components/AnalysisWindow';
export { default as PerformanceAnalysis } from './components/AnalysisWindow/PerformanceAnalysis';
export { default as SubjectAnalysis } from './components/AnalysisWindow/SubjectAnalysis';
export { default as QuestionAnalysis } from './components/AnalysisWindow/QuestionAnalysis';
export { default as TimeAnalysis } from './components/AnalysisWindow/TimeAnalysis';
export { default as ErrorAnalysis } from './components/AnalysisWindow/ErrorAnalysis';
export { default as BehavioralAnalysis } from './components/AnalysisWindow/BehavioralAnalysis';
export { default as StrategyAnalysis } from './components/AnalysisWindow/StrategyAnalysis';
export { default as QualityTimeSpent } from './components/AnalysisWindow/QualityTimeSpent';
export { default as SubjectWiseTime } from './components/AnalysisWindow/SubjectWiseTime';
export { default as Header } from './components/AnalysisWindow/Header';
export { default as Summary } from './components/AnalysisWindow/Summary';
export { default as Tabs } from './components/AnalysisWindow/Tabs';
