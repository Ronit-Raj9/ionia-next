"use client";

import React, { useEffect } from 'react';
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

  // Debug logging
  useEffect(() => {
    console.log('🔍 Analysis Page Props:', { paperId, examType, attemptId });
    
    // Check if attemptId is in localStorage as fallback
    const storedAttemptId = localStorage.getItem('currentAttemptId');
    const storedPaperId = localStorage.getItem('lastSubmittedPaperId');
    
    if (storedAttemptId && storedPaperId === paperId) {
      console.log('📋 Found stored attemptId:', storedAttemptId);
    }
  }, [paperId, examType, attemptId]);

  return (
    <AnalysisWindow 
      examType={examType}
      paperId={paperId}
      attemptId={attemptId}
    />
  );
};

export default AnalysisPage;
