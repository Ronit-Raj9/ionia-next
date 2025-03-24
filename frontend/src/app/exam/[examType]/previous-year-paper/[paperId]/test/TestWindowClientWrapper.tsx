"use client";

import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from '@/redux/store';
import TestWindow from '@/components/test/TestWindow';
import { ClipLoader } from 'react-spinners';

interface TestWindowClientWrapperProps {
  examType: string;
  paperId: string;
}

export default function TestWindowClientWrapper({ 
  examType, 
  paperId 
}: TestWindowClientWrapperProps) {
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
                onClick={() => window.location.href = '/'}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Return home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 