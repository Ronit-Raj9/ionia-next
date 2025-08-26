"use client";

import React from 'react';
import { Loader2 } from "lucide-react";

interface EditPageLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onReturnToQuestions: () => void;
  className?: string;
}

interface LoadingStateProps {
  message?: string;
}

interface ErrorStateProps {
  error: string;
  onReturnToQuestions: () => void;
  title?: string;
}

interface NotFoundStateProps {
  onReturnToQuestions: () => void;
  message?: string;
}

// Loading State Component
const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading question data..." 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto text-green-600" />
        <p className="mt-4 text-lg">{message}</p>
      </div>
    </div>
  );
};

// Error State Component
const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  onReturnToQuestions, 
  title = "Error loading question" 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg inline-block">
          <p className="text-lg font-medium">{title}</p>
          <p className="mt-2">{error}</p>
        </div>
        <button
          onClick={onReturnToQuestions}
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          Return to Questions
        </button>
      </div>
    </div>
  );
};

// Not Found State Component
const NotFoundState: React.FC<NotFoundStateProps> = ({ 
  onReturnToQuestions, 
  message = "Question not found" 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg inline-block">
          <p className="text-lg font-medium">{message}</p>
        </div>
        <button
          onClick={onReturnToQuestions}
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          Return to Questions
        </button>
      </div>
    </div>
  );
};

// Main Layout Component
export const EditPageLayout: React.FC<EditPageLayoutProps> = ({ 
  children, 
  loading = false, 
  error = null, 
  onReturnToQuestions,
  className 
}) => {
  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className || ''}`}>
        <LoadingState />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className || ''}`}>
        <ErrorState error={error} onReturnToQuestions={onReturnToQuestions} />
      </div>
    );
  }

  // Show main content
  return (
    <div className={`min-h-screen bg-gray-50 ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
};

// Export individual state components for custom usage
export { LoadingState, ErrorState, NotFoundState };