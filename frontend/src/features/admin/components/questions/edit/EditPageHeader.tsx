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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToQuestions}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Question</h1>
            <p className="mt-1 text-sm text-gray-600">
              ID: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{questionId}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onBackToQuestions}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Back to Questions
        </button>
      </div>
    </div>
  );
};

export { EditPageHeader };