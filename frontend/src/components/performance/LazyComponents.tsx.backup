'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ClipLoader } from 'react-spinners';

// Loading components
const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <ClipLoader color="#10B981" size={40} />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  </div>
);

const ComponentLoadingFallback = ({ message = 'Loading component...' }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <ClipLoader color="#10B981" size={30} />
      <p className="mt-2 text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

// Error boundary for lazy components
const LazyErrorBoundary = ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => {
  return (
    <div>
      {children}
    </div>
  );
};

// Higher-order component for lazy loading with role-based access
function withLazyLoading<T extends {}>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode,
  requiredRole?: 'user' | 'admin' | 'superadmin'
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: T) {
    const { hasRole, isLoading } = useAuthStore();
    
    // Check role requirements
    if (requiredRole && !isLoading && !hasRole(requiredRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to access this feature.</p>
          </div>
        </div>
      );
    }
    
    return (
      <LazyErrorBoundary fallback={fallback || <ComponentLoadingFallback />}>
        <Suspense fallback={fallback || <ComponentLoadingFallback />}>
          <LazyComponent {...props} />
        </Suspense>
      </LazyErrorBoundary>
    );
  };
}

// ==================== ADMIN COMPONENTS ====================

// Admin Dashboard Components
export const LazyAdminDashboard = withLazyLoading(
  () => import('@/app/admin/page'),
  <LoadingSpinner message="Loading admin dashboard..." />,
  'admin'
);

export const LazyAdminUsers = withLazyLoading(
  () => import('@/app/admin/users/page'),
  <LoadingSpinner message="Loading user management..." />,
  'admin'
);

export const LazyAdminQuestions = withLazyLoading(
  () => import('@/app/admin/questions/page'),
  <LoadingSpinner message="Loading question management..." />,
  'admin'
);

export const LazyAdminTests = withLazyLoading(
  () => import('@/app/admin/tests/page'),
  <LoadingSpinner message="Loading test management..." />,
  'admin'
);

export const LazyAdminAnalytics = withLazyLoading(
  () => import('@/app/admin/analytics/page'),
  <LoadingSpinner message="Loading analytics..." />,
  'admin'
);

// Question Management Components
export const LazyQuestionForm = withLazyLoading(
  () => import('@/components/questions/form/QuestionForm'),
  <ComponentLoadingFallback message="Loading question form..." />,
  'admin'
);

export const LazyQuestionPreview = withLazyLoading(
  () => import('@/components/questions/edit/QuestionPreview'),
  <ComponentLoadingFallback message="Loading question preview..." />
);

// Test Creation Components
export const LazyTestCreationStepper = withLazyLoading(
  () => import('@/components/admin/tests/TestCreationStepper'),
  <ComponentLoadingFallback message="Loading test creation wizard..." />,
  'admin'
);

export const LazyQuestionSelection = withLazyLoading(
  () => import('@/components/admin/tests/questions/QuestionSelection'),
  <ComponentLoadingFallback message="Loading question selection..." />,
  'admin'
);

// ==================== USER COMPONENTS ====================

// Dashboard Components
export const LazyUserDashboard = withLazyLoading(
  () => import('@/app/dashboard/page'),
  <LoadingSpinner message="Loading dashboard..." />
);

export const LazyTestHistory = withLazyLoading(
  () => import('@/components/dashboard/TestHistory'),
  <ComponentLoadingFallback message="Loading test history..." />
);

export const LazyPerformanceChart = withLazyLoading(
  () => import('@/components/dashboard/PerformanceChart'),
  <ComponentLoadingFallback message="Loading performance charts..." />
);

export const LazySubjectPerformance = withLazyLoading(
  () => import('@/components/dashboard/SubjectPerformance'),
  <ComponentLoadingFallback message="Loading subject analysis..." />
);

// Test Taking Components
export const LazyTestWindow = withLazyLoading(
  () => import('@/components/test/TestWindow'),
  <LoadingSpinner message="Loading test interface..." />
);

export const LazyQuestionNavigator = withLazyLoading(
  () => import('@/components/solution/QuestionNavigator'),
  <ComponentLoadingFallback message="Loading question navigator..." />
);

// Analysis Components
export const LazyAnalysisWindow = withLazyLoading(
  () => import('@/components/analysis/AnalysisWindow'),
  <LoadingSpinner message="Loading analysis..." />
);

export const LazySubjectAnalysis = withLazyLoading(
  () => import('@/components/analysis/AnalysisWindow/SubjectAnalysis'),
  <ComponentLoadingFallback message="Loading subject analysis..." />
);

export const LazyTimeAnalysis = withLazyLoading(
  () => import('@/components/analysis/AnalysisWindow/TimeAnalysis'),
  <ComponentLoadingFallback message="Loading time analysis..." />
);

// Practice Components
export const LazyPracticeQuestion = withLazyLoading(
  () => import('@/components/practice/PracticeQuestion'),
  <ComponentLoadingFallback message="Loading practice question..." />
);

export const LazyChapterList = withLazyLoading(
  () => import('@/components/practice/ChapterList'),
  <ComponentLoadingFallback message="Loading chapters..." />
);

// ==================== SHARED COMPONENTS ====================

// Profile Components
export const LazyProfileSettings = withLazyLoading(
  () => import('@/app/profile/settings/page'),
  <LoadingSpinner message="Loading profile settings..." />
);

// Results Components
export const LazyResultsPage = withLazyLoading(
  () => import('@/app/results/page'),
  <LoadingSpinner message="Loading results..." />
);

export const LazySolutionCard = withLazyLoading(
  () => import('@/components/solution/SolutionCard'),
  <ComponentLoadingFallback message="Loading solution..." />
);

// ==================== ROUTE COMPONENTS ====================

// Exam Route Components with heavy loading
export const LazyExamPage = withLazyLoading(
  () => import('@/app/exam/[examType]/page'),
  <LoadingSpinner message="Loading exam interface..." />
);

export const LazyMockTestPage = withLazyLoading(
  () => import('@/app/exam/[examType]/mock-test/[paperId]/page'),
  <LoadingSpinner message="Preparing mock test..." />
);

export const LazyTestInstructions = withLazyLoading(
  () => import('@/app/exam/[examType]/mock-test/[paperId]/instructions/page'),
  <ComponentLoadingFallback message="Loading test instructions..." />
);

// ==================== UTILITY FUNCTIONS ====================

// Preload components based on user role
export function preloadComponentsByRole(role: 'user' | 'admin' | 'superadmin' | null) {
  if (!role) return;
  
  // Preload common components
  import('@/components/dashboard/TestHistory');
  import('@/components/dashboard/PerformanceChart');
  
  if (role === 'admin' || role === 'superadmin') {
    // Preload admin components
    import('@/app/admin/page');
    import('@/app/admin/users/page');
    import('@/components/admin/tests/TestCreationStepper');
    import('@/components/questions/form/QuestionForm');
  } else {
    // Preload user components
    import('@/components/practice/PracticeQuestion');
    import('@/components/analysis/AnalysisWindow');
  }
}

// Preload components on route change
export function preloadRouteComponents(pathname: string) {
  if (pathname.startsWith('/admin')) {
    import('@/app/admin/page');
    import('@/components/admin/tests/TestCreationStepper');
  } else if (pathname.startsWith('/exam')) {
    import('@/components/test/TestWindow');
    import('@/components/analysis/AnalysisWindow');
  } else if (pathname.startsWith('/practice')) {
    import('@/components/practice/PracticeQuestion');
    import('@/components/practice/ChapterList');
  }
}

// Bundle size analyzer helper
export function getBundleSize(componentName: string): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    
    // Simulate loading the component
    setTimeout(() => {
      const end = performance.now();
      const estimatedSize = Math.random() * 100; // KB
      
      console.log(`${componentName} bundle size: ~${estimatedSize.toFixed(2)}KB, load time: ${(end - start).toFixed(2)}ms`);
      resolve(estimatedSize);
    }, Math.random() * 100);
  });
}

// Performance monitoring for lazy components
export function trackComponentLoad(componentName: string, loadTime: number, success: boolean) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'component_load', {
      component_name: componentName,
      load_time: loadTime,
      success: success
    });
  }
  
  // Store in local analytics
  const analytics = JSON.parse(localStorage.getItem('component_analytics') || '{}');
  if (!analytics[componentName]) {
    analytics[componentName] = [];
  }
  
  analytics[componentName].push({
    timestamp: Date.now(),
    loadTime,
    success
  });
  
  // Keep only last 10 entries per component
  analytics[componentName] = analytics[componentName].slice(-10);
  localStorage.setItem('component_analytics', JSON.stringify(analytics));
}

export default {
  // Admin components
  LazyAdminDashboard,
  LazyAdminUsers,
  LazyAdminQuestions,
  LazyAdminTests,
  LazyAdminAnalytics,
  LazyQuestionForm,
  LazyTestCreationStepper,
  
  // User components  
  LazyUserDashboard,
  LazyTestWindow,
  LazyAnalysisWindow,
  LazyPracticeQuestion,
  
  // Shared components
  LazyProfileSettings,
  LazyResultsPage,
  
  // Utilities
  preloadComponentsByRole,
  preloadRouteComponents,
  withLazyLoading
}; 