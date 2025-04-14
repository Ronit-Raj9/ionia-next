"use client";

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import TestWindow from '@/components/test/TestWindow';

interface TestWindowClientProps {
  examType: string;
  paperId: string;
}

export default function TestWindowClient({ examType, paperId }: TestWindowClientProps) {
  return (
    <Provider store={store}>
      <TestWindow examType={examType} paperId={paperId} />
    </Provider>
  );
} 