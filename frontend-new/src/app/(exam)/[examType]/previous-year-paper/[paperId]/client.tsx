"use client";

import React, { useState } from 'react';
import TestWindow from '@/features/tests/components/TestWindow';

interface TestWindowClientProps {
  examType: string;
  paperId: string;
}

export default function TestWindowClient({ examType, paperId }: TestWindowClientProps) {
  return (
    
      <TestWindow examType={examType} paperId={paperId} />
    
  );
} 