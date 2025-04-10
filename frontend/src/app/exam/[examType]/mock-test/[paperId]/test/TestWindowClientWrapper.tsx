"use client";

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from '@/redux/store';
import TestWindow from '@/components/test/TestWindow';
import { ClipLoader } from 'react-spinners';
import { fetchTest } from '@/redux/slices/testSlice';

interface TestWindowClientWrapperProps {
  examType: string;
  paperId: string;
}

export default function TestWindowClientWrapper({ 
  examType, 
  paperId 
}: TestWindowClientWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<any | null>(null);
  
  // Pre-initialize store with test data
  useEffect(() => {
    const initializeTest = async () => {
      try {
        if (paperId) {
          // Dispatch action to load test data
          const result = await store.dispatch(fetchTest(paperId));
          
          // Validate the test data structure
          if ('payload' in result && result.payload) {
            const test = result.payload as any;
            
            // Validate questions array exists and has elements
            if (!test.questions || !Array.isArray(test.questions) || test.questions.length === 0) {
              throw new Error("Test contains no questions");
            }
            
            // Validate question structure (check first 3 questions as a sample)
            const sampleQuestions = test.questions.slice(0, 3);
            
            // First check: detect numeric key objects (malformed data)
            const hasNumericKeys = sampleQuestions.some((q: any) => {
              if (!q || typeof q !== 'object') return false;
              // Check if it has numeric keys like "0", "1", "2" instead of proper properties
              return Object.keys(q).some(key => !isNaN(Number(key)) && key !== '_id');
            });
            
            if (hasNumericKeys) {
              console.error("Detected numeric keys in question data:", sampleQuestions[0]);
              throw new Error("Test data is malformed (contains numeric keys instead of proper question format)");
            }
            
            const invalidQuestions = sampleQuestions.filter((q: any) => 
              typeof q !== 'object' || 
              typeof q.question !== 'string' || 
              !Array.isArray(q.options) || 
              q.options.length === 0
            );
            
            if (invalidQuestions.length > 0) {
              console.error("Invalid question format:", invalidQuestions[0]);
              throw new Error("Test contains questions with invalid format");
            }
            
            setTestData(test);
            setError(null);
          } else {
            throw new Error("Failed to load test data");
          }
        }
      } catch (error) {
        console.error("Error initializing test:", error);
        setError(error instanceof Error ? error.message : 'Failed to load test data');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeTest();
  }, [paperId]);
  
  // Show error state if data validation fails
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Test Data Error</h2>
          <p className="text-gray-700 mb-4">We encountered an error with the test data:</p>
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = `/exam/${examType}`}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
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
          {isLoading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="flex flex-col items-center">
                <ClipLoader size={50} color="#3B82F6" />
                <p className="mt-4 text-gray-700">Loading test data...</p>
              </div>
            </div>
          ) : (
            <TestWindow examType={examType} paperId={paperId} />
          )}
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}

// Improved error boundary component
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