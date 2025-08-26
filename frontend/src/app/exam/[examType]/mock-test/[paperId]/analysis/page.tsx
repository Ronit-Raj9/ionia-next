"use client";

import React from 'react';
import { AnalysisWindow } from '@/features/analysis';

interface AnalysisPageProps {
  params: {
    paperId: string;
    examType: string;
  };
  searchParams: {
    attemptId?: string;
  };
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ params, searchParams }) => {
  const { paperId, examType } = params;
  const { attemptId } = searchParams;

  return (
    <AnalysisWindow 
      examType={examType}
      paperId={paperId}
      attemptId={attemptId}
    />
  );
};

export default AnalysisPage;
