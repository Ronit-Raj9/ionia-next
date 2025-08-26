"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { useTestStore } from '../../store/testStore';
import type { Test } from '../../types';
import LoadingSpinner from '../analytics/LoadingSpinner';
import ErrorMessage from '../analytics/ErrorMessage';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface TestFilters {
  search: string;
  testCategory: string;
  status: string;
  subject: string;
  examType: string;
  difficulty: string;
  page: number;
  limit: number;
}

interface TestListProps {
  className?: string;
}

const TestList: React.FC<TestListProps> = ({ className = '' }) => {
  const {
    tests,
    totalTests,
    currentPage,
    totalPages,
    loading,
    error,
    fetchTests,
    deleteTest,
    clearError,
    setCurrentPage,
    setShowDeleteModal,
    setSelectedTestId,
    showDeleteModal,
    selectedTestId,
    isDeleting
  } = useTestStore();

  const [filters, setFilters] = useState<TestFilters>({
    search: '',
    testCategory: '',
    status: '',
    subject: '',
    examType: '',
    difficulty: '',
    page: 1,
    limit: 20
  });

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTests();
  }, [filters]);

  // Load tests on component mount
  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = () => {
    const apiParams: any = {
      page: filters.page,
      limit: filters.limit
    };
    
    // Add filters only if they have values
    if (filters.search) apiParams.search = filters.search;
    if (filters.testCategory) apiParams.testCategory = filters.testCategory;
    if (filters.status) apiParams.status = filters.status;
    if (filters.subject) apiParams.subject = filters.subject;
    if (filters.examType) apiParams.examType = filters.examType;
    if (filters.difficulty) apiParams.difficulty = filters.difficulty;

    fetchTests(apiParams);
  };

  const handleDeleteTest = async (testId: string) => {
    setSelectedTestId(testId);
    setShowDeleteModal(true);
  };

  const handleSelectTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTests.length === tests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(tests.map(t => t._id));
    }
  };

  const updateFilter = (key: keyof TestFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 when filtering
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      testCategory: '',
      status: '',
      subject: '',
      examType: '',
      difficulty: '',
      page: 1,
      limit: 20
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pyq': return 'bg-blue-100 text-blue-800';
      case 'platform': return 'bg-purple-100 text-purple-800';
      case 'usercustom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const isLoading = loading;
  const hasError = error;

  if (isLoading && tests.length === 0) {
    return <LoadingSpinner message="Loading tests..." />;
  }

  if (hasError && tests.length === 0) {
    return (
      <ErrorMessage 
        message={hasError}
        onRetry={() => {
          clearError();
          loadTests();
        }}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tests</h1>
          <p className="text-sm text-gray-600">
            Manage and organize your test collection
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search tests..."
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          <Link
            href="/admin/tests/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Test
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm border"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Search tests..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.testCategory}
                onChange={(e) => updateFilter('testCategory', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                <option value="PYQ">Previous Year Questions</option>
                <option value="Platform">Platform Tests</option>
                <option value="UserCustom">Custom Tests</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={filters.subject}
                onChange={(e) => updateFilter('subject', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">All Subjects</option>
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="mathematics">Mathematics</option>
                <option value="biology">Biology</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Type
              </label>
              <select
                value={filters.examType}
                onChange={(e) => updateFilter('examType', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">All Exam Types</option>
                <option value="JEE Main">JEE Main</option>
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="NEET">NEET</option>
                <option value="CBSE">CBSE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => updateFilter('difficulty', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Showing {tests.length} tests
          {totalTests > 0 && ` of ${totalTests} total`}
        </p>
        
        {selectedTests.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedTests.length} selected
            </span>
            <button className="text-sm text-red-600 hover:text-red-800">
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Tests Grid */}
      {tests.length === 0 && !isLoading && !hasError ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
          <p className="text-gray-600 mb-6">
            {Object.values(filters).some(v => v) 
              ? 'Try adjusting your filters or search terms.' 
              : 'Get started by creating your first test.'
            }
          </p>
          <Link
            href="/admin/tests/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create First Test
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && tests.length === 0 ? (
            <div className="col-span-full flex justify-center py-12">
              <LoadingSpinner message="Loading tests..." />
            </div>
          ) : (
            tests.map((test, index) => (
            <motion.div
              key={test._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2" title={test.title}>
                      {test.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {test.description || 'No description provided'}
                    </p>
                  </div>
                  
                  <input
                    type="checkbox"
                    checked={selectedTests.includes(test._id)}
                    onChange={() => handleSelectTest(test._id)}
                    className="ml-3 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(test.status)}`}>
                    {test.status}
                  </span>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(test.testCategory)}`}>
                    {test.testCategory}
                  </span>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyBadgeColor(test.difficulty)}`}>
                    {test.difficulty}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    {test.questionCount} questions
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatDuration(test.duration)}
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    {test.totalMarks} marks
                  </div>
                  <div className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    {test.subject}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="text-xs text-gray-500 mb-4">
                  <p>Created: {formatDate(test.createdAt)}</p>
                  <p>Exam: {test.examType} • Class: {test.class}</p>
                  {test.year && <p>Year: {test.year}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/tests/view/${test._id}`}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                      title="View test"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View
                    </Link>
                    
                    <Link
                      href={`/admin/tests/edit/${test._id}`}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                      title="Edit test"
                    >
                      <PencilSquareIcon className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </div>
                  
                  <div className="flex space-x-2">
                    {test.status === 'published' && (
                      <Link
                        href={`/exam/test/${test._id}`}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 transition-colors duration-200"
                        title="Take test"
                      >
                        <PlayIcon className="h-3 w-3 mr-1" />
                        Start
                      </Link>
                    )}
                    
                    <button
                      onClick={() => handleDeleteTest(test._id)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 transition-colors duration-200"
                      title="Delete test"
                    >
                      <TrashIcon className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => {
                setFilters(prev => ({ ...prev, page: prev.page - 1 }));
              }}
              disabled={filters.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              onClick={() => {
                setFilters(prev => ({ ...prev, page: prev.page + 1 }));
              }}
              disabled={filters.page >= totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(filters.page * filters.limit, totalTests)}
                </span>{' '}
                of <span className="font-medium">{totalTests}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, page: prev.page - 1 }));
                  }}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, page: prev.page + 1 }));
                  }}
                  disabled={filters.page >= totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (selectedTestId) {
            await deleteTest(selectedTestId);
            setShowDeleteModal(false);
            setSelectedTestId(null);
            loadTests();
          }
        }}
        isLoading={isDeleting}
        title="Delete Test"
        message="Are you sure you want to delete this test? This action cannot be undone."
      />
    </div>
  );
};

export default TestList;