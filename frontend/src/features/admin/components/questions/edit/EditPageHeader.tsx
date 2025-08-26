"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface EditPageHeaderProps {
  questionId: string;
  onBackToQuestions: () => void;
}

const EditPageHeader: React.FC<EditPageHeaderProps> = ({ 
  questionId, 
  onBackToQuestions 
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Question</h1>
        <p className="mt-1 text-gray-600">
          ID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{questionId}</span>
        </p>
      </div>
      <button
        onClick={onBackToQuestions}
        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Questions
      </button>
    </div>
  );
};

export { EditPageHeader };