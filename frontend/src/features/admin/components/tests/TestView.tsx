"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  PencilSquareIcon,
  TrashIcon,
  PlayIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  EyeIcon,
  CalendarIcon,
  StarIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useTestStore } from '../../store/testStore';
import type { Test } from '../../types';
import LoadingSpinner from '../analytics/LoadingSpinner';
import ErrorMessage from '../analytics/ErrorMessage';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface TestViewProps {
  testId: string;
  className?: string;
}

const TestView: React.FC<TestViewProps> = ({ testId, className = '' }) => {
  const {
    selectedTest,
    loading,
    error,
    fetchTestById,
    deleteTest,
    clearError,
    setShowDeleteModal,
    setSelectedTestId,
    showDeleteModal,
    isDeleting
  } = useTestStore();

  useEffect(() => {
    fetchTestById(testId);
  }, [testId]);

  const handleDelete = async () => {
    setSelectedTestId(testId);
    setShowDeleteModal(true);
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pyq': return 'bg-blue-100 text-blue-800';
      case 'platform': return 'bg-purple-100 text-purple-800';
      case 'usercustom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isLoading = loading;
  const hasError = error;

  if (isLoading && !selectedTest) {
    return <LoadingSpinner message="Loading test details..." />;
  }

  if (hasError && !selectedTest) {
    return (
      <ErrorMessage 
        message={hasError}
        onRetry={() => {
          clearError();
          fetchTestById(testId);
        }}
      />
    );
  }

  if (!selectedTest) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Test not found</h3>
        <p className="text-gray-600">The requested test could not be found.</p>
        <Link
          href="/admin/tests"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Tests
        </Link>
      </div>
    );
  }

  const test = selectedTest;

  return (
    <div className={`max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/tests"
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
                <p className="text-sm text-gray-600">
                  Created {formatDate(test.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {test.status === 'published' && (
                <Link
                  href={`/exam/test/${test._id}`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Take Test
                </Link>
              )}
              
              <Link
                href={`/admin/tests/edit/${test._id}`}
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
              {test.status}
            </span>
            
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(test.testCategory)}`}>
              {test.testCategory}
            </span>
            
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
              {test.difficulty}
            </span>
            
            <span className="inline-flex items-center text-sm text-gray-600">
              <DocumentTextIcon className="h-4 w-4 mr-1" />
              {test.questionCount} questions
            </span>
            
            <span className="inline-flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatDuration(test.duration)}
            </span>
            
            <span className="inline-flex items-center text-sm text-gray-600">
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              {test.totalMarks} marks
            </span>

            {test.isPremium && (
              <span className="inline-flex items-center text-sm text-yellow-600">
                <StarIcon className="h-4 w-4 mr-1" />
                Premium
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {test.description && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{test.description}</p>
        </div>
      )}

      {/* Instructions */}
      {test.instructions && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Instructions</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{test.instructions}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Configuration */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
            Test Configuration
          </h3>
          
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="text-sm text-gray-900">{formatDuration(test.duration)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Attempts Allowed</dt>
              <dd className="text-sm text-gray-900">{test.attemptsAllowed}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Solutions Visibility</dt>
              <dd className="text-sm text-gray-900 capitalize">{test.solutionsVisibility.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Marking Scheme</dt>
              <dd className="text-sm text-gray-900">
                Correct: +{test.markingScheme.correct}, 
                Incorrect: {test.markingScheme.incorrect}, 
                Unattempted: {test.markingScheme.unattempted}
              </dd>
            </div>
          </dl>
        </div>

        {/* Academic Details */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2 text-gray-400" />
            Academic Details
          </h3>
          
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Subject</dt>
              <dd className="text-sm text-gray-900 capitalize">{test.subject}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Exam Type</dt>
              <dd className="text-sm text-gray-900">{test.examType}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Class</dt>
              <dd className="text-sm text-gray-900">{test.class}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Difficulty</dt>
              <dd className="text-sm text-gray-900 capitalize">{test.difficulty}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Category-specific Information */}
      {test.testCategory === 'PYQ' && (test.year || test.month || test.session) && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
            Previous Year Question Details
          </h3>
          
          <dl className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {test.year && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Year</dt>
                <dd className="text-sm text-gray-900">{test.year}</dd>
              </div>
            )}
            {test.month && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Month</dt>
                <dd className="text-sm text-gray-900">{test.month}</dd>
              </div>
            )}
            {test.day && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Day</dt>
                <dd className="text-sm text-gray-900">{test.day}</dd>
              </div>
            )}
            {test.session && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Session</dt>
                <dd className="text-sm text-gray-900">{test.session}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {test.testCategory === 'Platform' && (test.platformTestType || test.isPremium || test.syllabus) && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <StarIcon className="h-5 w-5 mr-2 text-gray-400" />
            Platform Test Details
          </h3>
          
          <dl className="space-y-3">
            {test.platformTestType && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Test Type</dt>
                <dd className="text-sm text-gray-900 capitalize">{test.platformTestType.replace('-', ' ')}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Premium</dt>
              <dd className="text-sm text-gray-900">{test.isPremium ? 'Yes' : 'No'}</dd>
            </div>
            {test.syllabus && test.syllabus.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Syllabus</dt>
                <dd className="text-sm text-gray-900">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {test.syllabus.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400" />
          Statistics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Questions</dt>
            <dd className="text-2xl font-semibold text-gray-900">{test.questionCount}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Marks</dt>
            <dd className="text-2xl font-semibold text-gray-900">{test.totalMarks}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Duration</dt>
            <dd className="text-2xl font-semibold text-gray-900">{formatDuration(test.duration)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Attempts Allowed</dt>
            <dd className="text-2xl font-semibold text-gray-900">{test.attemptsAllowed}</dd>
          </div>
        </div>
      </div>

      {/* Tags */}
      {test.tags && test.tags.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TagIcon className="h-5 w-5 mr-2 text-gray-400" />
            Tags
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {test.tags.map((tag, index) => (
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

      {/* Metadata */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">{formatDate(test.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
              <dd className="text-sm text-gray-900">{formatDate(test.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Test ID</dt>
              <dd className="text-sm text-gray-900 font-mono">{test._id}</dd>
            </div>
          </dl>
          
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="text-sm text-gray-900">{test.testCategory}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900 capitalize">{test.status}</dd>
            </div>
            {test.isPublic !== undefined && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Public</dt>
                <dd className="text-sm text-gray-900">{test.isPublic ? 'Yes' : 'No'}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Questions Preview */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
            Questions ({test.questionCount})
          </h3>
          <Link
            href={`/admin/tests/view/${test._id}/questions`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View All Questions
          </Link>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Click "View All Questions" to see the questions in this test</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (testId) {
            await deleteTest(testId);
            setShowDeleteModal(false);
            setSelectedTestId(null);
            // Redirect to tests list after deletion
            window.location.href = '/admin/tests';
          }
        }}
        isLoading={isDeleting}
        title="Delete Test"
        message="Are you sure you want to delete this test? This action cannot be undone."
      />
    </div>
  );
};

export default TestView;