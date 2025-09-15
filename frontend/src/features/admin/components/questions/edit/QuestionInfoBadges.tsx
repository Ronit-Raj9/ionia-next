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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center flex-wrap gap-3 mb-6">
      {/* Subject Badge - Blue */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        {question.subject}
      </span>
      
      {/* Chapter Badge - Indigo */}
      {question.chapter && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
          {question.chapter}
        </span>
      )}
      
      {/* Exam Type Badge - Purple */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
        {formatExamType(question.examType)}
      </span>
      
      {/* Difficulty Badge - Dynamic Color */}
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
        {formatDifficulty(question.difficulty)}
      </span>

      {/* Question Type Badge - Gray */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        {question.questionType?.toUpperCase() || 'MCQ'}
      </span>

      {/* Status Badge */}
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        question.isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {question.isActive ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
};

export { QuestionInfoBadges };