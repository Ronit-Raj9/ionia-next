"use client";

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import AnalysisWindow from '@/components/analysis/AnalysisWindow';
import { ClipLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import { AnalysisProvider } from '@/context/AnalysisContext';

interface ClientProps {
  examType: string;
  paperId: string;
}

export default function Client({ examType, paperId }: ClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader size={50} color="#1e40af" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-red-600 font-bold text-xl mb-4">Error Loading Analysis</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <Provider store={store}>
      <AnalysisProvider>
        <AnalysisWindow examType={examType} paperId={paperId} />
      </AnalysisProvider>
    </Provider>
  );
} 