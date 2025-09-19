"use client";

import React from 'react';
import { QuestionView } from '@/features/admin/components/questions';

interface QuestionDetailPageProps {
  params: {
    questionId: string;
  };
}

export default function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuestionView questionId={params.questionId} />
      </div>
    </div>
  );
}