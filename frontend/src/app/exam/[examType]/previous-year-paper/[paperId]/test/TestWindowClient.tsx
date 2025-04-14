"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TestWindow from '@/components/test/TestWindow';
import { ClipLoader } from 'react-spinners';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';

interface TestWindowClientProps {
  examType: string;
  paperId: string;
}

export default function TestWindowClient({ examType, paperId }: TestWindowClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize test
    const initializeTest = async () => {
      try {
        // Simulate loading time
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Failed to initialize test:', err);
        setError('Failed to load test data. Please try again.');
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
          <p className="mt-4 text-gray-700">Loading test...</p>
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
            <Link
              href="/dashboard"
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-center"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <TestWindow examType={examType} paperId={paperId} />
    </Provider>
  );
} 