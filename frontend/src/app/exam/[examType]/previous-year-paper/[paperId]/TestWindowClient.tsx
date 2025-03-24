"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TestWindow from '@/components/test/TestWindow';
import { ClipLoader } from 'react-spinners';
import { Provider } from 'react-redux';
import { makeStore } from '@/redux/store';

interface TestWindowClientProps {
  examType: string;
  paperId: string;
}

export default function TestWindowClient({ examType, paperId }: TestWindowClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Create Redux store instance
  const [storeInstance] = useState(() => makeStore().store);

  useEffect(() => {
    // Simulate checking if the test data is available or any other initialization
    const initializeTest = async () => {
      try {
        // You can add actual data fetching here if needed
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
            <button 
              onClick={() => router.push('/')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Provider store={storeInstance}>
      <TestWindow examType={examType} paperId={paperId} />
    </Provider>
  );
} 