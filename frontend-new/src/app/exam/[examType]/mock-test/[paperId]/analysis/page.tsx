"use client";

import React from 'react';
import AnalysisWindow from '@/features/analysis/components/AnalysisWindow';
import { AnalysisProvider } from '@/context/AnalysisContext';

interface AnalysisPageProps {
  params: {
    paperId: string;
    examType: string;
  };
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ params }) => {
  return (
    
      <AnalysisProvider>
        <AnalysisWindow 
          paperId={params.paperId} 
          examType={params.examType}
        />
      </AnalysisProvider>
    
  );
};

export default AnalysisPage;
