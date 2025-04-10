"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TestWindow from '@/components/test/TestWindow';
import { ClipLoader } from 'react-spinners';
import { Provider } from 'react-redux';
import store, { persistor } from '@/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { fetchTest } from '@/redux/slices/testSlice';

interface TestWindowClientProps {
  examType: string;
  paperId: string;
}

export default function TestWindowClient({ examType, paperId }: TestWindowClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    const initializeTest = async () => {
      try {
        if (paperId) {
          // Dispatch action to load test data
          await store.dispatch(fetchTest(paperId));
          setError(null);
        } else {
          throw new Error("No paper ID provided");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load test data';
        console.error('Test initialization error:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeTest();
  }, [paperId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <ClipLoader size={50} color="#3B82F6" />
          <p className="mt-4 text-gray-700">Loading test data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-700 font-medium text-lg mb-2">Something went wrong!</div>
          <div className="text-red-600 mb-4">{error}</div>
          <div className="flex space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Try again
            </button>
            <button 
              onClick={() => router.push(`/exam/${examType}`)}
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
        <ErrorBoundary fallbackExamType={examType}>
          <TestWindow examType={examType} paperId={paperId} />
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallbackExamType: string;
}> {
  state: { hasError: boolean; error: Error | null } = { 
    hasError: false, 
    error: null 
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Test window error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">There was an error loading the test.</p>
            <pre className="bg-gray-100 p-3 rounded text-sm text-red-500 mb-4 overflow-auto max-h-40">
              {this.state.error ? this.state.error.toString() : 'Unknown error'}
            </pre>
            <div className="flex justify-between">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = `/exam/${this.props.fallbackExamType}`}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Return to Exams
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 