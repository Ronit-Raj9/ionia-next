"use client";

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/redux/store';
import TestWindow from '@/components/test/TestWindow';
import { ClipLoader } from 'react-spinners';
import { checkEnvironment } from '@/utils/environmentCheck';

interface TestWindowClientWrapperProps {
  examType: string;
  paperId: string;
}

export default function TestWindowClientWrapper({
  examType,
  paperId,
}: TestWindowClientWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Perform any necessary initialization
    const init = async () => {
      try {
        // Check environment
        const envStatus = await checkEnvironment();
        if (!envStatus.supported) {
          setErrorMessage(
            'Your browser environment may not be fully supported. ' +
            'Please use a modern browser like Chrome, Firefox, or Edge.'
          );
        }
        
        // Simulate loading
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error initializing test:', error);
        setErrorMessage('Failed to initialize test window. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    init();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <ClipLoader size={50} color="#3B82F6" />
          <p className="mt-4 text-gray-700">Preparing your test environment...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-red-600 text-xl font-bold mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <TestWindow examType={examType} paperId={paperId} />
      </PersistGate>
    </Provider>
  );
} 