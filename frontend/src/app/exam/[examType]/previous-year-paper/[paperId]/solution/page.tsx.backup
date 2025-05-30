"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import SolutionViewer from '@/components/solution';

interface SolutionPageProps {
  params: {
    examType: string;
    paperId: string;
  };
}

export default function SolutionPage({ params }: SolutionPageProps) {
  const { examType, paperId } = params;
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId') || '';

  if (!attemptId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-3">Missing Attempt ID</h2>
          <p className="text-gray-700 mb-4">
            An attempt ID is required to view the solutions. Please access this page from your test results.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <SolutionViewer 
        examType={examType}
        paperId={paperId}
        attemptId={attemptId}
      />
    </main>
  );
} 