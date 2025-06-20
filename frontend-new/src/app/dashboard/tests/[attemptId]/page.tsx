"use client";

import React from 'react';
import AnalysisWindow from '@/features/analysis/components/AnalysisWindow';

interface AnalysisPageProps {
  params: {
    attemptId: string;
  };
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ params }) => {
  return (
    <AnalysisWindow 
      paperId={params.attemptId} 
      examType="cuet" // Default exam type
    />
  );
};

export default AnalysisPage;
