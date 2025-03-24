"use client";

import React from 'react';
import AnalysisWindow from '@/components/analysis/AnalysisWindow';

interface AnalysisPageProps {
  params: {
    paperId: string;
    examType: string;
  };
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ params }) => {
  return (
    <AnalysisWindow 
      paperId={params.paperId} 
      examType={params.examType}
    />
  );
};

export default AnalysisPage;
