"use client";

import React from 'react';
import AnalysisWindow from '@/components/analysis/AnalysisWindow';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { AnalysisProvider } from '@/context/AnalysisContext';

interface AnalysisPageProps {
  params: {
    attemptId: string;
  };
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ params }) => {
  return (
    <Provider store={store}>
      <AnalysisProvider>
        <AnalysisWindow 
          paperId={params.attemptId} 
          examType="cuet" // Default exam type
        />
      </AnalysisProvider>
    </Provider>
  );
};

export default AnalysisPage;
