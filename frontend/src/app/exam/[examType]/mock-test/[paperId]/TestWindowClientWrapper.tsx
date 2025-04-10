"use client";

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore } from '@/redux/store';
import TestWindow from '@/components/test/TestWindow';
import { ClipLoader } from 'react-spinners';
import { checkEnvironment } from '@/utils/environmentCheck';
import { useRouter } from 'next/navigation';

interface TestWindowClientWrapperProps {
  examType: string;
  paperId: string;
}

export default function TestWindowClientWrapper({ 
  examType, 
  paperId 
}: TestWindowClientWrapperProps) {
  const [environmentError, setEnvironmentError] = useState<string | null>(null);
  const router = useRouter();
  
  // Create Redux store instance
  const [{ store, persistor }] = useState(() => makeStore());
  
  useEffect(() => {
    const { isValid, errors } = checkEnvironment();
    if (!isValid) {
      setEnvironmentError(`Configuration error: ${errors.join(', ')}`);
    }
  }, []);
  
  if (environmentError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-700 font-medium text-lg mb-2">Configuration Error</div>
          <div className="text-red-600 mb-4">{environmentError}</div>
          <div className="flex space-x-4">
            <button 
              onClick={() => router.push('/exams')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Return to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <div className="flex items-center justify-center min-h-screen">
            <ClipLoader size={50} color="#3B82F6" />
          </div>
        } 
        persistor={persistor}
      >
        <ErrorBoundary>
          <TestWindow examType={examType} paperId={paperId} />
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}

// Simple error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Test Window Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">There was an error loading the test.</p>
            <pre className="bg-gray-100 p-3 rounded text-sm text-red-500 mb-4 overflow-auto max-h-40">
              {this.state.error?.toString()}
            </pre>
            <div className="flex justify-between">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/exams'}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Return to exams
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 