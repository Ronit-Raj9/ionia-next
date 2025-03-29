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
  ClockIcon,
  ChevronUpIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import Link from 'next/link';
import Image from 'next/image';
import { toast, Toaster } from 'react-hot-toast';

interface Question {
  _id: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  question: {
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  };
  questionType: 'single' | 'multiple' | 'numerical';
  options: Array<{
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  }>;
  correctOptions: number[];
  numericalAnswer?: {
    exactValue: number;
    range: {
      min: number;
      max: number;
    };
    unit: string;
  };
  examType: 'jee_main' | 'jee_adv' | 'cuet' | 'neet' | 'cbse_10' | 'cbse_12' | 'none';
  class: 'class_11' | 'class_12' | 'none';
  subject: string;
  chapter: string;
  sectionPhysics?: string;
  sectionChemistry?: string;
  sectionMathematics?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  conceptualDifficulty: number;
  year: string;
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  language: 'english' | 'hindi';
  solution: {
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  };
  hints: Array<{
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  }>;
  isVerified: boolean;
  isActive: boolean;
  marks: number;
  statistics: {
    timesAttempted: number;
    successRate: number;
    averageTimeTaken: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  subject: string;
  examType: string;
  difficulty: string;
  chapter: string;
  language: string;
  languageLevel: string;
  questionType: string;
  isVerified: boolean | null;
  isActive: boolean | null;
  year: string;
  conceptualDifficulty: {
    min: number;
    max: number;
  } | null;
  marks: number | null;
  tags: string[];
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  sectionPhysics?: string;
  sectionChemistry?: string;
  sectionMathematics?: string;
  solutionMode: string;
  dateRange: string;
  hasOptions: boolean | null;
  class: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    subject: '',
    examType: '',
    difficulty: '',
    chapter: '',
    language: '',
    languageLevel: '',
    questionType: '',
    isVerified: null,
    isActive: null,
    year: '',
    conceptualDifficulty: null,
    marks: null,
    tags: [],
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    sectionPhysics: '',
    sectionChemistry: '',
    sectionMathematics: '',
    solutionMode: '',
    dateRange: 'all',
    hasOptions: null,
    class: 'none'
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
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedQuestions, setExpandedQuestions] = useState<{ [key: string]: boolean }>({});
  const [globalExpanded, setGlobalExpanded] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  // Filter options
  const filterOptions = {
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    examTypes: ['jee_main', 'jee_adv', 'cuet', 'neet', 'cbse_10', 'cbse_12', 'none'],
    difficulties: ['easy', 'medium', 'hard'],
    languages: ['english', 'hindi'],
    languageLevels: ['basic', 'intermediate', 'advanced'],
    questionTypes: ['single', 'multiple', 'numerical'],
    classes: ['class_11', 'class_12', 'none'],
    sections: {
      Physics: ['Mechanics', 'Electricity and Magnetism', 'Modern Physics', 'Waves and Optics', 'Thermodynamics'],
      Chemistry: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Analytical Chemistry'],
      Mathematics: ['Algebra', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics']
    }
  };

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

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.subject) count++;
    if (filters.examType) count++;
    if (filters.difficulty) count++;
    if (filters.year) count++;
    if (filters.sectionPhysics) count++;
    if (filters.sectionChemistry) count++;
    if (filters.sectionMathematics) count++;
    if (filters.languageLevel) count++;
    if (filters.solutionMode) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.hasOptions !== null) count++;
    if (filters.isVerified !== null) count++;
    if (filters.sortBy !== 'createdAt') count++;
    if (filters.class !== 'none') count++;
    if (searchQuery) count++;
    return count;
  };

  const filterAndSortQuestions = () => {
    let filtered = [...questions];

    // Apply text search
    if (searchQuery) {
      filtered = filtered.filter(q => 
        q.question.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    filtered = filtered.filter(q => {
      const matchesSubject = !filters.subject || q.subject.toLowerCase() === filters.subject.toLowerCase();
      const matchesExamType = !filters.examType || q.examType === filters.examType;
      const matchesDifficulty = !filters.difficulty || q.difficulty === filters.difficulty;
      const matchesYear = !filters.year || q.year === filters.year;
      const matchesLanguageLevel = !filters.languageLevel || q.languageLevel === filters.languageLevel;
      const matchesClass = !filters.class || filters.class === 'none' || q.class === filters.class;
      
      // Section matching
      const matchesSection = 
        (!filters.sectionPhysics && !filters.sectionChemistry && !filters.sectionMathematics) ||
        (q.sectionPhysics === filters.sectionPhysics) ||
        (q.sectionChemistry === filters.sectionChemistry) ||
        (q.sectionMathematics === filters.sectionMathematics);

      // Solution mode matching (based on whether solution has text or image)
      const matchesSolutionMode = !filters.solutionMode || (
        (filters.solutionMode === 'Text' && q.solution.text) ||
        (filters.solutionMode === 'Image' && q.solution.image.url)
      );

      // Date range matching
      const createdAt = new Date(q.createdAt);
      const now = new Date();
      const matchesDateRange = !filters.dateRange || filters.dateRange === 'all' || (
        filters.dateRange === 'today' && createdAt.toDateString() === now.toDateString() ||
        filters.dateRange === 'week' && createdAt >= new Date(now.setDate(now.getDate() - 7)) ||
        filters.dateRange === 'month' && createdAt >= new Date(now.setMonth(now.getMonth() - 1)) ||
        filters.dateRange === 'year' && createdAt >= new Date(now.setFullYear(now.getFullYear() - 1))
      );

      return matchesSubject && matchesExamType && matchesDifficulty && 
             matchesYear && matchesLanguageLevel && matchesSolutionMode && 
             matchesSection && matchesDateRange && matchesClass;
    });

    // Apply sorting
    const sortField = filters.sortBy === 'newest' ? 'createdAt' : 
                      filters.sortBy === 'oldest' ? 'createdAt' :
                      filters.sortBy === 'alphabetical' ? 'question.text' : 
                      'difficulty';

    filtered.sort((a, b) => {
      if (sortField === 'createdAt') {
        return filters.sortOrder === 'desc' 
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortField === 'question.text') {
        return filters.sortOrder === 'desc'
          ? b.question.text.localeCompare(a.question.text)
          : a.question.text.localeCompare(b.question.text);
      }
      return filters.sortOrder === 'desc'
        ? b.difficulty.localeCompare(a.difficulty)
        : a.difficulty.localeCompare(b.difficulty);
    });

    return filtered;
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      // Only include filters that have actual values
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });

      // Only add additional filters if they have values
      if (filters.sortBy && filters.sortBy !== 'createdAt') queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder !== 'desc') queryParams.append('sortOrder', filters.sortOrder);
      if (filters.subject) queryParams.append('subject', filters.subject);
      if (filters.examType) queryParams.append('examType', filters.examType);
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (filters.chapter) queryParams.append('chapter', filters.chapter);
      if (filters.language) queryParams.append('language', filters.language);
      if (filters.languageLevel) queryParams.append('languageLevel', filters.languageLevel);
      if (filters.questionType) queryParams.append('questionType', filters.questionType);
      if (filters.isVerified !== null) queryParams.append('isVerified', filters.isVerified.toString());
      if (filters.isActive !== null) queryParams.append('isActive', filters.isActive.toString());
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.class && filters.class !== 'none') queryParams.append('class', filters.class);

      const response = await fetch(`${API_URL}/questions?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      if (data.success) {
        setQuestions(data.data.questions);
        setTotalQuestions(data.data.totalQuestions);
        setTotalPages(data.data.totalPages);
      } else {
        throw new Error(data.message || 'Failed to fetch questions');
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch without filters
    fetchQuestions();
  }, []); // Empty dependency array for initial fetch

  useEffect(() => {
    // Only refetch if any filter is actively set
    const hasActiveFilters = 
      filters.subject ||
      filters.examType ||
      filters.difficulty ||
      filters.chapter ||
      filters.language ||
      filters.languageLevel ||
      filters.questionType ||
      filters.isVerified !== null ||
      filters.isActive !== null ||
      filters.year ||
      filters.sectionPhysics ||
      filters.sectionChemistry ||
      filters.sectionMathematics ||
      filters.dateRange !== 'all' ||
      filters.hasOptions !== null ||
      (filters.class && filters.class !== 'none');

    if (hasActiveFilters) {
      fetchQuestions();
    }
  }, [filters]); // Dependency array includes filters

  const filteredQuestions = filterAndSortQuestions();
  const activeFiltersCount = getActiveFiltersCount();

  const resetFilters = () => {
    setFilters({
      subject: '',
      examType: '',
      difficulty: '',
      chapter: '',
      language: '',
      languageLevel: '',
      questionType: '',
      isVerified: null,
      isActive: null,
      year: '',
      conceptualDifficulty: null,
      marks: null,
      tags: [],
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      sectionPhysics: '',
      sectionChemistry: '',
      sectionMathematics: '',
      solutionMode: '',
      dateRange: 'all',
      hasOptions: null,
      class: 'none'
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
      const response = await fetch(`${API_URL}/api/v1/questions/${selectedQuestionId}/permanent-delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmDelete: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete question');
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

  const toggleQuestionStatus = async (questionId: string, newStatus: boolean) => {
    try {
      setTogglingStatus(questionId);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/questions/${questionId}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update question status');
      }

      // Update the question in state
      setQuestions(prevQuestions =>
        prevQuestions.map(q =>
          q._id === questionId ? { ...q, isActive: newStatus } : q
        )
      );
      
      // Show success message
      setError(null);
      toast.success(`Question ${newStatus ? 'activated' : 'deactivated'} successfully`, {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#FFFFFF',
          borderRadius: '8px',
        },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      });
    } catch (error) {
      console.error('Error updating question status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update question status');
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} question. Please try again.`, {
        duration: 3000
      });
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleSectionChange = (value: string) => {
    const newFilters = { ...filters };
    
    // Reset all section filters
    newFilters.sectionPhysics = '';
    newFilters.sectionChemistry = '';
    newFilters.sectionMathematics = '';

    // Set the appropriate section based on subject
    if (filters.subject === 'Physics') {
      newFilters.sectionPhysics = value;
    } else if (filters.subject === 'Chemistry') {
      newFilters.sectionChemistry = value;
    } else if (filters.subject === 'Mathematics') {
      newFilters.sectionMathematics = value;
    }

    setFilters(newFilters);
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

  const handleApiError = (error: any) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      setError(error.response.data.message || 'Server error occurred');
    } else if (error.request) {
      // The request was made but no response was received
      setError('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      setError('Failed to send request. Please try again.');
    }
  };

  // Add this function to handle global expand/collapse
  const handleGlobalExpand = (expand: boolean) => {
    setGlobalExpanded(expand);
    const newExpandedState: { [key: string]: boolean } = {};
    questions.forEach(question => {
      newExpandedState[question._id] = expand;
    });
    setExpandedQuestions(newExpandedState);
  };

  // Add this function to handle individual question expand/collapse
  const toggleQuestionExpand = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Add this useEffect to initialize expanded state when questions change
  useEffect(() => {
    const newExpandedState: { [key: string]: boolean } = {};
    questions.forEach(question => {
      newExpandedState[question._id] = globalExpanded;
    });
    setExpandedQuestions(newExpandedState);
  }, [questions]);

  return (
    <div className="min-h-screen bg-green-50/30">
      <Toaster position="top-right" />
      
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
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleGlobalExpand(!globalExpanded)}
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
            <div className="space-y-6">
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
                    className="bg-white rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Question Header - Always visible */}
                    <div 
                      className="border-b border-green-100 bg-green-50/30 px-6 py-4 cursor-pointer"
                      onClick={() => toggleQuestionExpand(question._id)}
                    >
                      <div className="flex justify-between items-start">
                      <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                              ${question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'}`}>
                              {question.difficulty}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {question.marks} marks
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                              ${togglingStatus === question._id 
                                ? 'bg-gray-100 text-gray-800'
                                : question.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'}`}>
                              {togglingStatus === question._id 
                                ? 'Updating...' 
                                : question.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                          <div className="flex items-center justify-between">
                            {!expandedQuestions[question._id] && (
                              <h3 className="text-base font-medium text-gray-900 line-clamp-2">
                                {question.question.text}
                              </h3>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleQuestionExpand(question._id);
                              }}
                              className="ml-4 text-green-600 hover:text-green-700 focus:outline-none"
                            >
                              {expandedQuestions[question._id] ? (
                                <ChevronUpIcon className="h-5 w-5" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5" />
                              )}
                            </button>
                            </div>
                          {!expandedQuestions[question._id] && (
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>{question.subject} • {question.chapter}</span>
                              <span>{question.questionType}</span>
                              {question.class && question.class !== 'none' && (
                                <span>Class: {question.class.replace('class_', '')}</span>
                              )}
                              {question.statistics.timesAttempted > 0 && (
                                <span>Success Rate: {question.statistics.successRate}%</span>
                              )}
                        </div>
                          )}
                      </div>
                        <div className="flex space-x-2 ml-4">
                        <Link
                          href={`/admin/questions/edit/${question._id}`}
                            className="px-3 py-1 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                Edit
              </Link>
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleQuestionStatus(question._id, !question.isActive);
                            }}
                            disabled={togglingStatus === question._id}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors
                              ${question.isActive 
                                ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                                : 'text-green-700 bg-green-100 hover:bg-green-200'}
                              ${togglingStatus === question._id ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {togglingStatus === question._id ? (
                              <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {question.isActive ? 'Deactivating...' : 'Activating...'}
                              </span>
                            ) : (
                              question.isActive ? 'Deactivate' : 'Activate'
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(question._id);
                            }}
                            className="px-3 py-1 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      expandedQuestions[question._id] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="p-6">
                        <div className="grid grid-cols-12 gap-6">
                          {/* Left Column - Question Details */}
                          <div className="col-span-8">
                            {/* Question Text/Image */}
                            <div className="mb-6">
                              <h3 className="text-lg font-medium text-gray-900 mb-3">
                                {question.question.text}
                              </h3>
                              {question.question.image?.url && (
                                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                                  <div className="relative aspect-[16/9] w-full">
                                    <Image 
                                      src={question.question.image.url}
                                      alt="Question"
                                      fill
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      priority={false}
                                      className="object-contain bg-gray-50"
                                      loading="lazy"
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        console.log('Question Image Error - Original URL:', question.question.image.url);
                                        if (!img.dataset.fallback) {
                                          img.dataset.fallback = 'true';
                                          img.src = '/placeholder-image.png';
                                          console.log('Question Image - Fallback URL:', img.src);
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Options (for MCQ) with expand/collapse */}
                            {question.questionType !== 'numerical' && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-gray-700">Options:</h4>
                                  <button
                                    onClick={() => toggleQuestionExpand(question._id)}
                                    className="inline-flex items-center px-2 py-1 text-sm text-green-600 hover:text-green-700 focus:outline-none"
                                  >
                                    {expandedQuestions[question._id] ? (
                                      <>
                                        <ChevronUpIcon className="h-4 w-4 mr-1" />
                                        Collapse
                                      </>
                          ) : (
                            <>
                                        <ChevronDownIcon className="h-4 w-4 mr-1" />
                                        Expand
                            </>
                          )}
                        </button>
                                </div>
                                <div className={`space-y-3 transition-all duration-300 ${
                                  expandedQuestions[question._id] ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                                }`}>
                                  {question.options.map((option, index) => (
                                    <div
                                      key={index}
                                      className={`p-4 rounded-lg border ${
                                        question.correctOptions.includes(index)
                                          ? 'bg-green-50 border-green-200'
                                          : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-start space-x-3">
                                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 text-sm">
                                          {String.fromCharCode(65 + index)}
                                        </span>
                                        <div className="flex-grow space-y-2">
                                          <p className="text-sm text-gray-700">{option.text}</p>
                                          {option.image?.url && (
                                            <div className="rounded-lg overflow-hidden border border-gray-200">
                                              <div className="relative aspect-[16/9] w-full max-w-md">
                                                <Image 
                                                  src={option.image.url}
                                                  alt={`Option ${String.fromCharCode(65 + index)}`}
                                                  fill
                                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                  priority={false}
                                                  className="object-contain bg-gray-50"
                                                  loading="lazy"
                                                  onError={(e) => {
                                                    const img = e.target as HTMLImageElement;
                                                    console.log('Option Image Error - Original URL:', option.image.url);
                                                    if (!img.dataset.fallback) {
                                                      img.dataset.fallback = 'true';
                                                      img.src = '/placeholder-image.png';
                                                      console.log('Option Image - Fallback URL:', img.src);
                                                    }
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Numerical Answer */}
                            {question.questionType === 'numerical' && (
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Numerical Answer:</h4>
                                <div className="space-y-2">
                                  <p className="text-sm text-blue-700">
                                    <span className="font-medium">Exact Value:</span> {question.numericalAnswer?.exactValue} 
                                    {question.numericalAnswer?.unit}
                                  </p>
                                  <p className="text-sm text-blue-700">
                                    <span className="font-medium">Acceptable Range:</span> {question.numericalAnswer?.range.min} - {question.numericalAnswer?.range.max}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column - Metadata */}
                          <div className="col-span-4 space-y-4">
                            {/* Question Info Card */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Question Details</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Subject:</span>
                                  <span className="font-medium text-gray-900">{question.subject}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Chapter:</span>
                                  <span className="font-medium text-gray-900">{question.chapter}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Class:</span>
                                  <span className="font-medium text-gray-900">
                                    {question.class ? (question.class === 'none' ? 'N/A' : question.class.replace('class_', '')) : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Type:</span>
                                  <span className="font-medium text-gray-900">{question.questionType}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Language:</span>
                                  <span className="font-medium text-gray-900">{question.language}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Level:</span>
                                  <span className="font-medium text-gray-900">{question.languageLevel}</span>
                                </div>
                              </div>
                            </div>

                            {/* Statistics Card */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Statistics</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Times Attempted:</span>
                                  <span className="font-medium text-gray-900">{question.statistics.timesAttempted}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Success Rate:</span>
                                  <span className="font-medium text-gray-900">{question.statistics.successRate}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Avg. Time:</span>
                                  <span className="font-medium text-gray-900">{question.statistics.averageTimeTaken}s</span>
                                </div>
                              </div>
                            </div>

                            {/* Verification Status */}
                            <div className={`rounded-lg p-4 ${
                              question.isVerified ? 'bg-green-50' : 'bg-yellow-50'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {question.isVerified ? 'Verified' : 'Pending Verification'}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  question.isVerified 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {question.isVerified ? 'Verified' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
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
                            options={filterOptions.subjects}
                            placeholder="All Subjects"
                          />
                        </div>

                        {/* Year Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Year</label>
                          <CustomSelect
                            value={filters.year}
                            onChange={(value) => setFilters({ ...filters, year: value })}
                            options={['2024', '2023', '2022', '2021', '2020', '2019']}
                            placeholder="All Years"
                          />
                        </div>

                        {/* Section Filter */}
                          <div className="filter-group animate-fadeIn">
                            <label className="block text-sm font-medium text-green-700 mb-2">Section</label>
                            <CustomSelect
                            value={
                              filters.sectionPhysics || 
                              filters.sectionChemistry || 
                              filters.sectionMathematics || 
                              ''
                            }
                            onChange={handleSectionChange}
                            options={filterOptions.sections[filters.subject as keyof typeof filterOptions.sections] || []}
                              placeholder="All Sections"
                            />
                          </div>

                        {/* Difficulty Filter with Pills */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Difficulty</label>
                          <div className="flex gap-2">
                            {filterOptions.difficulties.map((diff) => (
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
                            options={filterOptions.examTypes}
                            placeholder="All Exam Types"
                          />
                        </div>

                        {/* Class Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Class</label>
                          <CustomSelect
                            value={filters.class}
                            onChange={(value) => setFilters({ ...filters, class: value })}
                            options={[
                              { value: 'none', label: 'All Classes' },
                              { value: 'class_11', label: 'Class 11' },
                              { value: 'class_12', label: 'Class 12' }
                            ]}
                            placeholder="Select Class"
                          />
                        </div>

                        {/* Language Level */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Language Level</label>
                          <CustomSelect
                            value={filters.languageLevel}
                            onChange={(value) => setFilters({ ...filters, languageLevel: value })}
                            options={filterOptions.languageLevels}
                            placeholder="All Levels"
                          />
                        </div>

                        {/* Solution Mode */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Solution Mode</label>
                          <CustomSelect
                            value={filters.solutionMode}
                            onChange={(value) => setFilters({ ...filters, solutionMode: value })}
                            options={['Text', 'Conceptual', 'Option']}
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
