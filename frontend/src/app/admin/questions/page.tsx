"use client";

import { useState, useEffect } from 'react';
import { 
  FunnelIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  AcademicCapIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import Link from 'next/link';

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctOption: number;
  examType: string;
  subject: string;
  sectionPhysics: string;
  sectionChemistry: string;
  sectionMathematics: string;
  difficulty: string;
  year: string;
  languageLevel: string;
  solutionMode: string;
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  subject: string;
  examType: string;
  difficulty: string;
  year: string;
  section: string;
  languageLevel: string;
  solutionMode: string;
  dateRange: string;
  hasOptions: boolean | null;
  isVerified: boolean | null;
  sortBy: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    subject: '',
    examType: '',
    difficulty: '',
    year: '',
    section: '',
    languageLevel: '',
    solutionMode: '',
    dateRange: 'all',
    hasOptions: null,
    isVerified: null,
    sortBy: 'newest'
  });
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: false,
    sorting: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // Filter options
  const subjects = ['Physics', 'Chemistry', 'Mathematics'];
  const examTypes = ['JEE Main', 'JEE Advanced', 'NEET', 'CUET'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const years = ['2024', '2023', '2022', '2021', '2020', '2019'];
  const languageLevels = ['Easy', 'Intermediate', 'Advanced'];
  const solutionModes = ['Text', 'Conceptual', 'Option'];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'difficulty', label: 'Difficulty Level' }
  ];

  const sections = {
    Physics: ['Mechanics', 'Electricity and Magnetism', 'Modern Physics', 'Waves and Optics', 'Thermodynamics'],
    Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Analytical Chemistry'],
    Mathematics: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics']
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.subject) count++;
    if (filters.examType) count++;
    if (filters.difficulty) count++;
    if (filters.year) count++;
    if (filters.section) count++;
    if (filters.languageLevel) count++;
    if (filters.solutionMode) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.hasOptions !== null) count++;
    if (filters.isVerified !== null) count++;
    if (filters.sortBy !== 'newest') count++;
    if (searchQuery) count++;
    return count;
  };

  const filterAndSortQuestions = () => {
    let filtered = [...questions];

    // Apply text search
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    filtered = filtered.filter(q => {
      const matchesSubject = !filters.subject || q.subject.toLowerCase() === filters.subject.toLowerCase();
      const matchesExamType = !filters.examType || q.examType.toLowerCase().includes(filters.examType.toLowerCase());
      const matchesDifficulty = !filters.difficulty || q.difficulty.toLowerCase() === filters.difficulty.toLowerCase();
      const matchesYear = !filters.year || q.year === filters.year;
      const matchesLanguageLevel = !filters.languageLevel || q.languageLevel.toLowerCase() === filters.languageLevel.toLowerCase();
      const matchesSolutionMode = !filters.solutionMode || q.solutionMode.toLowerCase() === filters.solutionMode.toLowerCase();
      
      // Section filter based on subject
      const matchesSection = !filters.section || (
        (q.subject === 'Physics' && q.sectionPhysics === filters.section) ||
        (q.subject === 'Chemistry' && q.sectionChemistry === filters.section) ||
        (q.subject === 'Mathematics' && q.sectionMathematics === filters.section)
      );

      // Date range filter
      const createdAt = new Date(q.createdAt);
      const now = new Date();
      const matchesDateRange = filters.dateRange === 'all' || (
        filters.dateRange === 'today' && createdAt.toDateString() === now.toDateString() ||
        filters.dateRange === 'week' && createdAt >= new Date(now.setDate(now.getDate() - 7)) ||
        filters.dateRange === 'month' && createdAt >= new Date(now.setMonth(now.getMonth() - 1)) ||
        filters.dateRange === 'year' && createdAt >= new Date(now.setFullYear(now.getFullYear() - 1))
      );

      // Options and verification filters
      const matchesOptions = filters.hasOptions === null || (filters.hasOptions === true && q.options.length > 0);
      const matchesVerification = filters.isVerified === null || filters.isVerified === true;

      return matchesSubject && matchesExamType && matchesDifficulty && matchesYear &&
             matchesLanguageLevel && matchesSolutionMode && matchesSection && matchesDateRange &&
             matchesOptions && matchesVerification;
    });

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.question.localeCompare(b.question));
        break;
      case 'difficulty':
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        filtered.sort((a, b) => 
          (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
          (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
        );
        break;
    }

    return filtered;
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/questions/get`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch questions');
      }

      const data = await response.json();
      if (data && data.data) {
        setQuestions(data.data);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const filteredQuestions = filterAndSortQuestions();
  const activeFiltersCount = getActiveFiltersCount();

  const resetFilters = () => {
    setFilters({
      subject: '',
      examType: '',
      difficulty: '',
      year: '',
      section: '',
      languageLevel: '',
      solutionMode: '',
      dateRange: 'all',
      hasOptions: null,
      isVerified: null,
      sortBy: 'newest'
    });
    setSearchQuery('');
  };

  const handleDeleteClick = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedQuestionId) return;

    try {
      setDeletingId(selectedQuestionId);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/questions/delete/${selectedQuestionId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      // Remove the deleted question from the state
      setQuestions(prevQuestions => 
        prevQuestions.filter(q => q._id !== selectedQuestionId)
      );

      setShowDeleteModal(false);
      setSelectedQuestionId(null);
    } catch (error) {
      console.error('Error deleting question:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete question');
    } finally {
      setDeletingId(null);
    }
  };

  // Custom select component for better UI
  const CustomSelect = ({ 
    value, 
    onChange, 
    options, 
    placeholder,
    className = ""
  }: { 
    value: string, 
    onChange: (value: string) => void, 
    options: string[] | { value: string, label: string }[],
    placeholder: string,
    className?: string
  }) => {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border-green-200 focus:ring-green-500 focus:border-green-500 bg-white 
          transition-all duration-200 cursor-pointer appearance-none hover:border-green-400
          pl-4 pr-10 py-2.5 text-sm text-gray-700 bg-no-repeat bg-[right_0.75rem_center]
          bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNy40MSA4LjU5TDEyIDEzLjE3bDQuNTktNC41OEwxOCAxMGwtNiA2LTYtNiAxLjQxLTEuNDF6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=')] 
          ${className}`}
      >
        <option value="">{placeholder}</option>
        {Array.isArray(options) && options.map((option) => (
          typeof option === 'string' ? (
            <option key={option} value={option} className="py-2">{option}</option>
          ) : (
            <option key={option.value} value={option.value} className="py-2">{option.label}</option>
          )
        ))}
      </select>
    );
  };

  return (
    <div className="min-h-screen bg-green-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-green-800">Questions Management</h1>
                <p className="text-sm text-green-600 mt-1">
                  {filteredQuestions.length} questions found
                  {activeFiltersCount > 0 && ` • ${activeFiltersCount} filters applied`}
                </p>
              </div>
              <Link
                href="/admin/questions/add"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
            Add New Question
        </Link>
      </div>

            {/* Search and Filter Toggle for Mobile */}
            <div className="lg:hidden flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-green-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-green-200 rounded-lg text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search for Desktop */}
            <div className="hidden lg:block mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-green-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Questions List */}
      <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                  <p className="text-green-600 mt-2">Loading questions...</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-green-600">No questions found matching your criteria.</p>
                  {(activeFiltersCount > 0 || searchQuery) && (
                    <button
                      onClick={resetFilters}
                      className="mt-2 text-green-700 hover:text-green-800 underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <div
                    key={question._id}
                    className="bg-white p-6 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-green-900 mb-2">{question.question}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-600">
                          <p><span className="font-medium">Subject:</span> {question.subject}</p>
                          <p><span className="font-medium">Exam Type:</span> {question.examType}</p>
                          <p><span className="font-medium">Difficulty:</span> {question.difficulty}</p>
                          <p><span className="font-medium">Year:</span> {question.year}</p>
                        </div>
                        <div className="mt-4 space-y-2">
                          {question.options.map((option, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded-lg ${
                                index === question.correctOption
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors duration-200'
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Link
                          href={`/admin/questions/edit/${question._id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-all duration-200"
                        >
                Edit
              </Link>
                        <button
                          onClick={() => handleDeleteClick(question._id)}
                          disabled={deletingId === question._id}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === question._id ? (
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                          ) : (
                            <>
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Filters Sidebar - Now with improved sticky positioning and scrolling */}
          <div 
            className={`lg:w-96 transition-all duration-300 ease-in-out ${
              showFilters ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full lg:opacity-100 lg:translate-x-0'
            }`}
          >
            <div className="lg:sticky lg:top-6 bg-white rounded-xl shadow-sm border border-green-100 flex flex-col max-h-[calc(100vh-3rem)]">
              {/* Fixed Header */}
              <div className="p-6 border-b border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FunnelIcon className="h-5 w-5 text-green-600 mr-2" />
                    <h2 className="text-lg font-medium text-green-800">Filters</h2>
                  </div>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-green-600 hover:text-green-700 transition-colors duration-200 flex items-center"
                    >
                      <span className="mr-1">Reset</span>
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                        {activeFiltersCount}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-6">
                  {/* Basic Filters Section */}
                  <div className="filter-section">
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, basic: !prev.basic }))}
                      className="flex items-center justify-between w-full mb-2 text-green-800 hover:text-green-600"
                    >
                      <div className="flex items-center">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                        <span className="font-medium">Basic Filters</span>
                      </div>
                      <ChevronDownIcon 
                        className={`h-5 w-5 transition-transform duration-200 ${
                          expandedSections.basic ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {expandedSections.basic && (
                      <div className="space-y-4">
                        {/* Subject Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Subject</label>
                          <CustomSelect
                            value={filters.subject}
                            onChange={(value) => setFilters({ ...filters, subject: value })}
                            options={subjects}
                            placeholder="All Subjects"
                          />
                        </div>

                        {/* Year Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Year</label>
                          <CustomSelect
                            value={filters.year}
                            onChange={(value) => setFilters({ ...filters, year: value })}
                            options={years}
                            placeholder="All Years"
                          />
                        </div>

                        {/* Section Filter - Shows based on selected subject */}
                        {filters.subject && sections[filters.subject as keyof typeof sections] && (
                          <div className="filter-group animate-fadeIn">
                            <label className="block text-sm font-medium text-green-700 mb-2">Section</label>
                            <CustomSelect
                              value={filters.section}
                              onChange={(value) => setFilters({ ...filters, section: value })}
                              options={sections[filters.subject as keyof typeof sections]}
                              placeholder="All Sections"
                            />
                          </div>
                        )}

                        {/* Difficulty Filter with Pills */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Difficulty</label>
                          <div className="flex gap-2">
                            {difficulties.map((diff) => (
                              <button
                                key={diff}
                                onClick={() => setFilters({ ...filters, difficulty: filters.difficulty === diff ? '' : diff })}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                                  ${filters.difficulty === diff
                                    ? 'bg-green-100 text-green-800 border border-green-200 shadow-sm transform scale-105'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-green-200'
                                  }`}
                              >
                                {diff}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Advanced Filters Section */}
                  <div className="filter-section border-t pt-4">
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, advanced: !prev.advanced }))}
                      className="flex items-center justify-between w-full mb-2 text-green-800 hover:text-green-600"
                    >
                      <div className="flex items-center">
                        <AcademicCapIcon className="h-5 w-5 mr-2" />
                        <span className="font-medium">Advanced Filters</span>
                      </div>
                      <ChevronDownIcon 
                        className={`h-5 w-5 transition-transform duration-200 ${
                          expandedSections.advanced ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedSections.advanced && (
                      <div className="space-y-4">
                        {/* Exam Type Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Exam Type</label>
                          <CustomSelect
                            value={filters.examType}
                            onChange={(value) => setFilters({ ...filters, examType: value })}
                            options={examTypes}
                            placeholder="All Exam Types"
                          />
                        </div>

                        {/* Language Level */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Language Level</label>
                          <CustomSelect
                            value={filters.languageLevel}
                            onChange={(value) => setFilters({ ...filters, languageLevel: value })}
                            options={languageLevels}
                            placeholder="All Levels"
                          />
                        </div>

                        {/* Solution Mode */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Solution Mode</label>
                          <CustomSelect
                            value={filters.solutionMode}
                            onChange={(value) => setFilters({ ...filters, solutionMode: value })}
                            options={solutionModes}
                            placeholder="All Modes"
                          />
                        </div>

                        {/* Date Range Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Date Added</label>
                          <CustomSelect
                            value={filters.dateRange}
                            onChange={(value) => setFilters({ ...filters, dateRange: value })}
                            options={dateRangeOptions}
                            placeholder="Select Date Range"
                          />
                        </div>

                        {/* Additional Toggle Filters */}
                        <div className="space-y-3 pt-2">
                          <label className="flex items-center p-2 rounded-lg hover:bg-green-50 transition-colors duration-200 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filters.hasOptions === true}
                              onChange={(e) => setFilters({ ...filters, hasOptions: e.target.checked ? true : null })}
                              className="rounded border-green-300 text-green-600 focus:ring-green-500 transition-colors duration-200
                                group-hover:border-green-400"
                            />
                            <span className="ml-2 text-sm text-gray-700 group-hover:text-green-700 transition-colors duration-200">
                              Has Options
                            </span>
                          </label>
                          <label className="flex items-center p-2 rounded-lg hover:bg-green-50 transition-colors duration-200 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filters.isVerified === true}
                              onChange={(e) => setFilters({ ...filters, isVerified: e.target.checked ? true : null })}
                              className="rounded border-green-300 text-green-600 focus:ring-green-500 transition-colors duration-200
                                group-hover:border-green-400"
                            />
                            <span className="ml-2 text-sm text-gray-700 group-hover:text-green-700 transition-colors duration-200">
                              Verified Questions
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sorting Section */}
                  <div className="filter-section border-t pt-4">
                    <button
                      onClick={() => setExpandedSections(prev => ({ ...prev, sorting: !prev.sorting }))}
                      className="flex items-center justify-between w-full mb-2 text-green-800 hover:text-green-600"
                    >
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 mr-2" />
                        <span className="font-medium">Sort Questions</span>
                      </div>
                      <ChevronDownIcon 
                        className={`h-5 w-5 transition-transform duration-200 ${
                          expandedSections.sorting ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedSections.sorting && (
                      <div className="space-y-4">
                        <div className="filter-group">
                          <CustomSelect
                            value={filters.sortBy}
                            onChange={(value) => setFilters({ ...filters, sortBy: value })}
                            options={sortOptions}
                            placeholder="Select Sorting"
                            className="bg-green-50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Delete Question</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to permanently delete this question? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedQuestionId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
      </div>
      )}

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #22c55e #e2e8f0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #22c55e;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #16a34a;
        }
      `}</style>
    </div>
  );
}
