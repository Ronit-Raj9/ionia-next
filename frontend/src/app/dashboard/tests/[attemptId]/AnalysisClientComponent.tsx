"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnalysisWindow from '@/components/analysis/AnalysisWindow';
import { ClipLoader } from 'react-spinners';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { setAnalysisData, setLoading } from '@/redux/slices/analysisSlice';
import { AnalysisProvider } from '@/context/AnalysisContext';

interface AnalysisClientComponentProps {
  attemptId: string;
}

export default function AnalysisClientComponent({ attemptId }: AnalysisClientComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize analysis data
    const initializeAnalysis = async () => {
      try {
        // Simulate loading time to allow Redux to initialize
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Failed to initialize analysis:', err);
        setError('Failed to load analysis data. Please try again.');
        setIsLoading(false);
      }
    };

    initializeAnalysis();
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <ClipLoader size={50} color="#3B82F6" />
          <p className="mt-4 text-gray-700">Loading analysis...</p>
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
              onClick={() => router.push('/dashboard/tests')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Return to My Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <AnalysisProvider>
        <AnalysisWindow examType="cuet" paperId={attemptId} />
      </AnalysisProvider>
    </Provider>
  );
} 