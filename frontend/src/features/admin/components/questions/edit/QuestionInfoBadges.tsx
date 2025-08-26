"use client";

import React from 'react';
import type { Question } from '@/features/admin/types';

interface QuestionInfoBadgesProps {
  question: Question;
}

const QuestionInfoBadges: React.FC<QuestionInfoBadgesProps> = ({ question }) => {
  const formatExamType = (examType: string) => {
    return examType.toUpperCase().replace(/\s+/g, ' ');
  };

  const formatDifficulty = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <div className="flex items-center space-x-3 mb-6">
      {/* Subject Badge - Blue */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        {question.subject}
      </span>
      
      {/* Exam Type Badge - Purple */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
        {formatExamType(question.examType)}
      </span>
      
      {/* Difficulty Badge - Green */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        {formatDifficulty(question.difficulty)}
      </span>
    </div>
  );
};

export { QuestionInfoBadges };