"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useAdminStore } from '../../store/adminStore';
import type { Question } from '../../types';
import LoadingSpinner from '../analytics/LoadingSpinner';
import ErrorMessage from '../analytics/ErrorMessage';

interface QuestionViewProps {
  questionId: string;
  className?: string;
}

const QuestionView: React.FC<QuestionViewProps> = ({ questionId, className = '' }) => {
  const {
    selectedQuestion,
    loading,
    error,
    fetchQuestionById,
    deleteQuestion,
    verifyQuestion,
    clearError
  } = useAdminStore();

  useEffect(() => {
    fetchQuestionById(questionId);
  }, [questionId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        await deleteQuestion(questionId);
        // Redirect or show success message
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    }
  };

  const handleVerify = async () => {
    try {
      await verifyQuestion(questionId);
    } catch (error) {
      console.error('Failed to verify question:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mcq': return 'Multiple Choice';
      case 'numerical': return 'Numerical';
      case 'assertion': return 'Assertion';
      default: return type;
    }
  };

  const isLoading = loading.has('questionDetails');
  const hasError = error.questionDetails;

  if (isLoading && !selectedQuestion) {
    return <LoadingSpinner message="Loading question details..." />;
  }

  if (hasError && !selectedQuestion) {
    return (
      <ErrorMessage 
        message={hasError}
        onRetry={() => {
          clearError('questionDetails');
          fetchQuestionById(questionId);
        }}
      />
    );
  }

  if (!selectedQuestion) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Question not found</h3>
        <p className="text-gray-600">The requested question could not be found.</p>
        <Link
          href="/admin/questions"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Questions
        </Link>
      </div>
    );
  }

  const question = selectedQuestion;

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/questions"
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Question Details</h1>
                <p className="text-sm text-gray-600">
                  Created {formatDate(question.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!question.isVerified && (
                <button
                  onClick={handleVerify}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Verify
                </button>
              )}
              
              <Link
                href={`/admin/questions/edit/${question._id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <PencilSquareIcon className="h-4 w-4 mr-2" />
                Edit
              </Link>
              
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
            
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getQuestionTypeLabel(question.questionType)}
            </span>
            
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {question.subject}
            </span>
            
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {question.marks} mark{question.marks !== 1 ? 's' : ''}
            </span>

            {question.isVerified ? (
              <span className="inline-flex items-center text-sm text-green-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center text-sm text-gray-500">
                <XCircleIcon className="h-4 w-4 mr-1" />
                Not Verified
              </span>
            )}

            <span className="inline-flex items-center text-sm text-gray-500">
              <EyeIcon className="h-4 w-4 mr-1" />
              {question.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BookOpenIcon className="h-5 w-5 mr-2 text-gray-400" />
          Question
        </h2>
        
        <div className="prose max-w-none">
          <p className="text-gray-900 whitespace-pre-wrap">
            {question.question.text || 'No question text available'}
          </p>
          
          {question.question.image?.url && (
            <div className="mt-4">
              <img
                src={question.question.image.url}
                alt="Question illustration"
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Options (for MCQ) */}
      {question.questionType === 'mcq' && question.options && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Options</h2>
          
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.div
                key={index}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  question.correctOptions?.includes(index)
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                  {String.fromCharCode(65 + index)}
                </span>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{option.text}</p>
                  {option.image?.url && (
                    <img
                      src={option.image.url}
                      alt={`Option ${String.fromCharCode(65 + index)}`}
                      className="mt-2 max-w-xs h-auto rounded-md"
                    />
                  )}
                </div>
                
                {question.correctOptions?.includes(index) && (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Numerical Answer */}
      {question.questionType === 'numerical' && question.numericalAnswer && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Answer</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exact Value
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {question.numericalAnswer.exactValue ?? 'Not specified'}
                {question.numericalAnswer.unit && ` ${question.numericalAnswer.unit}`}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Range
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {question.numericalAnswer.range.min} - {question.numericalAnswer.range.max}
                {question.numericalAnswer.unit && ` ${question.numericalAnswer.unit}`}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <p className="text-lg font-semibold text-gray-900">
                {question.numericalAnswer.unit || 'No unit'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Solution */}
      {question.solution.text && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Solution</h2>
          
          <div className="prose max-w-none">
            <p className="text-gray-900 whitespace-pre-wrap">
              {question.solution.text}
            </p>
            
            {question.solution.image?.url && (
              <div className="mt-4">
                <img
                  src={question.solution.image.url}
                  alt="Solution illustration"
                  className="max-w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Question Details */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2 text-gray-400" />
            Question Details
          </h3>
          
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Subject</dt>
              <dd className="text-sm text-gray-900 capitalize">{question.subject}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Chapter</dt>
              <dd className="text-sm text-gray-900">{question.chapter || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Exam Type</dt>
              <dd className="text-sm text-gray-900">{question.examType}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Class</dt>
              <dd className="text-sm text-gray-900">{question.class}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Language</dt>
              <dd className="text-sm text-gray-900 capitalize">{question.language}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="text-sm text-gray-900 capitalize">{question.questionCategory}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Source</dt>
              <dd className="text-sm text-gray-900 uppercase">{question.questionSource}</dd>
            </div>
          </dl>
        </div>

        {/* Additional Info */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
            Additional Information
          </h3>
          
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">{formatDate(question.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
              <dd className="text-sm text-gray-900">{formatDate(question.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Difficulty Rating</dt>
              <dd className="text-sm text-gray-900">{question.conceptualDifficulty}/10</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Negative Marks</dt>
              <dd className="text-sm text-gray-900">{question.negativeMarks || 0}</dd>
            </div>
            {question.year && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Year</dt>
                <dd className="text-sm text-gray-900">{question.year}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Tags and Prerequisites */}
      {(question.tags && question.tags.length > 0) || (question.prerequisites && question.prerequisites.length > 0) && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TagIcon className="h-5 w-5 mr-2 text-gray-400" />
            Tags & Prerequisites
          </h3>
          
          <div className="space-y-4">
            {question.tags && question.tags.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {question.prerequisites && question.prerequisites.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">Prerequisites</dt>
                <div className="flex flex-wrap gap-2">
                  {question.prerequisites.map((prereq, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {prereq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionView;