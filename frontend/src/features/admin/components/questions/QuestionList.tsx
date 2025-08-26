"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { Toaster } from 'react-hot-toast';
import { useQuestionStore } from '../../store/questionStore';
import { QuestionCard } from './QuestionCard';
import { QuestionSearch } from './QuestionSearch';
import { QuestionFilters } from './QuestionFilters';
import { PaginationControls } from './PaginationControls';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

export const QuestionList: React.FC = () => {
  const {
    questions,
    loading,
    error,
    totalQuestions,
    globalExpanded,
    fetchQuestions,
    setGlobalExpanded,
    resetFilters,
    clearError
  } = useQuestionStore();

  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Get active filters count for display
  const { filters, searchQuery } = useQuestionStore();
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.subject.length > 0) count++;
    if (filters.examType.length > 0) count++;
    if (filters.difficulty.length > 0) count++;
    if (filters.year.length > 0) count++;
    if (filters.section.length > 0) count++;
    if (filters.languageLevel.length > 0) count++;
    if (filters.questionCategory.length > 0) count++;
    if (filters.questionSource.length > 0) count++;
    if (filters.solutionMode) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.hasOptions !== null) count++;
    if (filters.isVerified !== null) count++;
    if (filters.sortBy !== 'createdAt') count++;
    if (filters.class.length > 0) count++;
    if (searchQuery) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-none mx-auto px-6 py-6">
      {/* Header */}
            <div className="flex items-center justify-between mb-6">
        <div>
                <h1 className="text-2xl font-bold text-green-800">Questions Management</h1>
                <p className="text-sm text-green-600 mt-1">
                  {totalQuestions} total questions
                  {activeFiltersCount > 0 && ` • ${activeFiltersCount} filters applied`}
          </p>
        </div>
              <div className="flex items-center space-x-4">
          <button
                  onClick={() => setGlobalExpanded(!globalExpanded)}
                  className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  {globalExpanded ? (
                    <>
                      <ChevronUpIcon className="h-5 w-5 mr-2" />
                      Collapse All Options
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="h-5 w-5 mr-2" />
                      Expand All Options
                    </>
                  )}
          </button>
          <Link
            href="/admin/questions/add"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add New Question
          </Link>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <QuestionSearch />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-red-800">{error}</p>
            <button
                    onClick={clearError}
                    className="text-red-600 hover:text-red-800 transition-colors"
            >
                    ×
            </button>
          </div>
              </div>
            )}

            {/* Debug Filter Information */}
            {activeFiltersCount > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold">Active Filters:</span>
                  <span className="text-blue-700">{questions.length} results</span>
                </div>
                {filters.subject.length > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">Subject:</span> {filters.subject.join(', ')}
          </div>
        )}
                {filters.difficulty.length > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">Difficulty:</span> {filters.difficulty.join(', ')}
      </div>
                )}
                {filters.section.length > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">Section:</span> {filters.section.join(', ')}
                    </div>
                      )}
                    </div>
            )}

            {/* Questions List */}
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {/* Loading State */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                  <p className="text-green-600 mt-2">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                /* No Results */
                <div className="text-center py-8 border border-yellow-200 rounded-lg bg-yellow-50 p-6">
                  <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">No questions found</h3>
                  <p className="text-yellow-700 mb-4">
                    No questions match your current filter criteria. Try removing some filters or search with different terms.
                  </p>
                      <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md transition-colors duration-200 flex items-center mx-auto"
                      >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Clear all filters
                      </button>
                    </div>
              ) : (
                /* Questions Cards */
                questions.map((question) => (
                  <QuestionCard key={question._id} question={question} />
                ))
        )}
      </div>

      {/* Pagination */}
              <PaginationControls />
            </div>
          </div>
        </div>

        {/* Filters Sidebar - Fixed Right Side */}
        <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-4">
            <QuestionFilters />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
    </div>
  );
};