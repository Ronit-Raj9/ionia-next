'use client';

import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useUIStore } from '@/stores/uiStore';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const { addNotification } = useUIStore();

  const handleReportError = () => {
    // In production, this would send error reports to a service
    console.error('Error reported:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    addNotification({
      type: 'info',
      title: 'Error Reported',
      message: 'Thank you for reporting this issue. Our team has been notified.',
      duration: 5000,
    });
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          We're sorry, but something unexpected happened. Please try refreshing the page or go back to the homepage.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
              Error Details (Development Mode)
            </h3>
            <p className="text-xs text-red-600 dark:text-red-300 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={resetErrorBoundary}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </button>
        </div>
        
        <button
          onClick={handleReportError}
          className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Report this issue
        </button>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function ErrorBoundary({ 
  children, 
  fallback: FallbackComponent = ErrorFallback,
  onError 
}: ErrorBoundaryProps) {
  const { setError, addNotification } = useUIStore();

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to UI store
    setError(`${error.message}\n${errorInfo.componentStack}`);
    
    // Show notification in production
    if (process.env.NODE_ENV === 'production') {
      addNotification({
        type: 'error',
        title: 'Application Error',
        message: 'Something went wrong. Please try refreshing the page.',
        duration: 10000,
        persistent: true,
      });
    }
    
    // Log error details
    console.error('Error caught by boundary:', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    });
    
    // Call custom error handler if provided
    onError?.(error, errorInfo);
  };

  const handleReset = () => {
    // Clear error state when resetting
    setError(null);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Higher-order component for wrapping pages with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
} 