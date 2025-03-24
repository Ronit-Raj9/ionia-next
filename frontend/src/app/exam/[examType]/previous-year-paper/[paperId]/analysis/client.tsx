"use client";

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from '@/redux/store';
import AnalysisWindow from '@/components/analysis/AnalysisWindow';

interface AnalysisClientProps {
  examType: string;
  paperId: string;
}

export default function AnalysisClient({ examType, paperId }: AnalysisClientProps) {
  // Create Redux store instance
  const [{ store }] = useState(() => makeStore());
  
  return (
    <Provider store={store}>
      <AnalysisWindow examType={examType} paperId={paperId} />
    </Provider>
  );
} 