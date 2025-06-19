"use client";
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAnalysisStore } from '@/features/analysis/store/analysisStore';
import  AnalysisWindow from '@/features/analysis/components/AnalysisWindow';
import Navbar from '@/shared/components/common/Navbar';
import { ClipLoader } from 'react-spinners';

const ResultsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const paperId = searchParams.get('paperId');
  const { isLoading } = useAnalysisStore();

  if (!paperId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-600">No paper ID provided</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader size={50} color="#3b82f6" />
            </div>
          ) : (
            <AnalysisWindow paperId={paperId} examType="test" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage; 