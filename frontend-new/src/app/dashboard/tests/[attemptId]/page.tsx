"use client";

import React from 'react';
import AnalysisWindow from '@/features/analysis/components/AnalysisWindow';
import { AnalysisProvider } from '@/context/AnalysisContext';

interface AnalysisPageProps {
  params: {
    attemptId: string;
  };
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ params }) => {
  return (
    
      <AnalysisProvider>
        <AnalysisWindow 
          paperId={params.attemptId} 
          examType="cuet" // Default exam type
        />
      </AnalysisProvider>
    
  );
};

export default AnalysisPage;
