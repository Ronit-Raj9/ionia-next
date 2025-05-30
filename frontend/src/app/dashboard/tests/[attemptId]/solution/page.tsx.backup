"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import SolutionViewer from '@/components/solution';

interface SolutionPageProps {
  params: {
    attemptId: string;
  };
}

export default function SolutionPage({ params }: SolutionPageProps) {
  const { attemptId } = params;
  const searchParams = useSearchParams();
  const questionId = searchParams.get('questionId') || '';

  if (!questionId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-3">Missing Question ID</h2>
          <p className="text-gray-700 mb-4">
            A question ID is required to view the solution. Please select a specific question from the analysis page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <SolutionViewer 
        examType="cuet"
        paperId={attemptId}
        attemptId={attemptId}
      />
    </main>
  );
} 