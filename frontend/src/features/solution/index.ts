// Solution feature exports
export { default as SolutionViewer } from './components/index';
export { default as SolutionNavigationBar } from './components/NavigationBar';
export { default as QuestionNavigator } from './components/QuestionNavigator';
export { default as SolutionCard } from './components/SolutionCard';
export { default as SummarySidebar } from './components/Summary';

// Store and services
export { useSolutionStore, useSolutionData, useSolutionLoading, useSolutionError, useCurrentQuestion, useFilteredQuestions, useUserPreferences, useNavigationData, useFilter } from './store/solutionStore';
export { SolutionService } from './services/solutionService';
export { SolutionApi } from './api/solutionApi';

// Hooks
export { useSolution } from './hooks/useSolution';

// Types
export type {
  SolutionQuestion,
  SolutionOption,
  SolutionTestInfo,
  SolutionPerformance,
  SolutionData,
  SolutionFilters,
  SolutionUserPreferences,
  SolutionReport,
  SimilarQuestion,
  SolutionApiResponse,
  SolutionState
} from './types';

// Utils
export { calculatePerformanceMetrics } from './utils/util';
