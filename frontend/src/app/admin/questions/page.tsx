"use client";

import { useState, useEffect, useRef } from 'react';
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
import { useAppSelector } from '@/redux/hooks/hooks';

interface Question {
  _id: string;
  author: {
    _id: string;
    email: string;
    username: string;
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
  class: 'class_9' | 'class_10' | 'class_11' | 'class_12' | 'none';
  subject: string;
  chapter: string;
  section?: string;
  questionCategory?: 'theoretical' | 'numerical';
  questionSource?: 'custom' | 'india_book' | 'foreign_book' | 'pyq';
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
  subject: string[];
  examType: string[];
  difficulty: string[];
  chapter: string[];
  language: string[];
  languageLevel: string[];
  questionType: string[];
  isVerified: boolean | null;
  isActive: boolean | null;
  year: string[];
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
  section: string[];
  questionCategory: string[];
  questionSource: string[];
  solutionMode: string;
  dateRange: string;
  hasOptions: boolean | null;
  class: string[];
}

export default function QuestionsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'superadmin';
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    subject: [],
    examType: [],
    difficulty: [],
    chapter: [],
    language: [],
    languageLevel: [],
    questionType: [],
    isVerified: null,
    isActive: null,
    year: [],
    conceptualDifficulty: null,
    marks: null,
    tags: [],
    page: 1,
    limit: 30,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    section: [],
    questionCategory: [],
    questionSource: [],
    solutionMode: '',
    dateRange: 'all',
    hasOptions: null,
    class: []
  });
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: false,
    additional: false,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(30);
  const [activeTab, setActiveTab] = useState('basic');

  // Filter options
  const filterOptions = {
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'General Knowledge', 'Computer Science', 'Information Practice'],
    examTypes: ['jee_main', 'jee_adv', 'cuet', 'neet', 'cbse_11', 'cbse_12', 'none'],
    difficulties: ['easy', 'medium', 'hard'],
    languages: ['english', 'hindi'],
    languageLevels: ['basic', 'intermediate', 'advanced'],
    questionTypes: ['single', 'multiple', 'numerical'],
    classes: ['class_9', 'class_10', 'class_11', 'class_12', 'none'],
    questionCategories: ['theoretical', 'numerical'],
    questionSources: ['custom', 'india_book', 'foreign_book', 'pyq'],
    sections: {
      Physics: ['mechanics', 'electromagnetism', 'thermodynamics', 'optics', 'modern_physics', 'none'],
      Chemistry: ['organic', 'inorganic', 'physical', 'analytical', 'none'],
      Mathematics: ['algebra', 'calculus', 'geometry', 'statistics', 'trigonometry', 'none'],
      Biology: ['botany', 'zoology', 'human_physiology', 'ecology', 'genetics', 'none'],
      English: ['reading_comprehension', 'vocabulary', 'grammar', 'writing', 'none'],
      General_Knowledge: ['gk', 'current_affairs', 'general_science', 'mathematical_reasoning', 'logical_reasoning', 'none'],
      Computer_Science: ['programming', 'data_structures', 'algorithms', 'databases', 'none'],
      Information_Practice: ['programming', 'databases', 'web_development', 'none']
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
      const matchesSubject = filters.subject.length === 0 || filters.subject.some(s => s.toLowerCase() === q.subject.toLowerCase());
      const matchesExamType = filters.examType.length === 0 || filters.examType.includes(q.examType);
      const matchesDifficulty = filters.difficulty.length === 0 || filters.difficulty.includes(q.difficulty);
      const matchesYear = filters.year.length === 0 || filters.year.includes(q.year);
      const matchesLanguageLevel = filters.languageLevel.length === 0 || filters.languageLevel.includes(q.languageLevel);
      const matchesClass = filters.class.length === 0 || filters.class.includes(q.class);
      const matchesQuestionType = filters.questionType.length === 0 || filters.questionType.includes(q.questionType);
      
      // For fields that may not exist in some questions
      const matchesSection = filters.section.length === 0 || 
                             (q.section && filters.section.includes(q.section));
      
      const matchesQuestionCategory = filters.questionCategory.length === 0 || 
                                     (q.questionCategory && filters.questionCategory.includes(q.questionCategory));
      
      const matchesQuestionSource = filters.questionSource.length === 0 || 
                                   (q.questionSource && filters.questionSource.includes(q.questionSource));

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
             matchesSection && matchesDateRange && matchesClass && 
             matchesQuestionType && matchesQuestionCategory && matchesQuestionSource;
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
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: questionsPerPage.toString()
      });

      // Add multi-select filters
      const addArrayParams = (key: string, values: string[]) => {
        if (values.length > 0) {
          values.forEach(value => queryParams.append(`${key}[]`, value));
        }
      };

      // Add array filters
      addArrayParams('subject', filters.subject);
      addArrayParams('examType', filters.examType);
      addArrayParams('difficulty', filters.difficulty);
      addArrayParams('year', filters.year);
      addArrayParams('section', filters.section);
      addArrayParams('languageLevel', filters.languageLevel);
      addArrayParams('questionType', filters.questionType);
      addArrayParams('class', filters.class);
      addArrayParams('questionCategory', filters.questionCategory);
      addArrayParams('questionSource', filters.questionSource);
      addArrayParams('tags', filters.tags);

      // Only add additional filters if they have values
      if (filters.sortBy && filters.sortBy !== 'createdAt') queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder !== 'desc') queryParams.append('sortOrder', filters.sortOrder);
      if (filters.chapter.length > 0) queryParams.append('chapter', filters.chapter[0]);
      if (filters.language.length > 0) queryParams.append('language', filters.language[0]);
      if (filters.isVerified !== null) queryParams.append('isVerified', filters.isVerified.toString());
      if (filters.isActive !== null) queryParams.append('isActive', filters.isActive.toString());
      if (filters.solutionMode) queryParams.append('solutionMode', filters.solutionMode);

      // Retrieve the access token
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        // Handle cases where the token might be missing (e.g., redirect to login)
        console.error("Access token not found, cannot fetch questions.");
        setError("Authentication token missing. Please login again.");
        setLoading(false);
        return; // Stop execution if no token
      }

      console.log(`Fetching questions with token: Bearer ${accessToken.substring(0, 10)}...`); // Log part of the token

      const response = await fetch(`${API_URL}/questions?${queryParams}`, {
        method: 'GET',
        credentials: 'include', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        // Handle specific error codes like 403 Forbidden
        if (response.status === 403) {
          const errorData = await response.json();
          console.error("Permission denied (403):", errorData);
          setError(errorData.message || "You don't have permission to view these questions.");
        } else {
          throw new Error(`Failed to fetch questions (Status: ${response.status})`);
        }
        // Don't proceed if response was not ok
        setLoading(false);
        return; 
      }

      const data = await response.json();
      if (data.success) {
        setQuestions(data.data.questions);
        setTotalQuestions(data.data.totalQuestions);
        setTotalPages(data.data.totalPages);
        console.log(`Successfully fetched ${data.data.questions.length} questions.`);
      } else {
        throw new Error(data.message || 'Failed to process questions data');
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred while fetching questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, filters]);

  const filteredQuestions = filterAndSortQuestions();
  const activeFiltersCount = getActiveFiltersCount();

  const resetFilters = () => {
    setFilters({
      subject: [],
      examType: [],
      difficulty: [],
      chapter: [],
      language: [],
      languageLevel: [],
      questionType: [],
      isVerified: null,
      isActive: null,
      year: [],
      conceptualDifficulty: null,
      marks: null,
      tags: [],
      page: 1,
      limit: 30,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      section: [],
      questionCategory: [],
      questionSource: [],
      solutionMode: '',
      dateRange: 'all',
      hasOptions: null,
      class: []
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleDelete = (questionId: string) => {
    if (!isSuperAdmin) {
      toast.error('Only superadmins can delete questions');
      return;
    }
    setSelectedQuestionId(questionId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedQuestionId) return;

    try {
      setDeletingId(selectedQuestionId);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/questions/${selectedQuestionId}/permanent-delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmDelete: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          toast.error('You do not have permission to delete questions');
        } else {
          throw new Error(errorData.message || 'Failed to delete question');
        }
        return;
      }

      toast.success('Question deleted successfully');
      setShowDeleteModal(false);
      // Refresh questions list
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete question');
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

  const handleSectionChange = (values: string[]) => {
    setFilters(prev => ({
      ...prev,
      section: values
    }));
  };

  // Custom multi-select dropdown with checkboxes - Update parent state immediately
  const CheckboxMultiSelect = ({ 
    values, 
    onChange,
    options, 
    placeholder,
    className = ""
  }: { 
    values: string[], 
    onChange: (values: string[]) => void, 
    options: string[] | { value: string, label: string }[],
    placeholder: string,
    className?: string
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the main button container
    const panelRef = useRef<HTMLDivElement>(null); // Ref for the dropdown panel itself

    // Handle outside click to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        // Close if clicked outside the button AND outside the panel
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
            panelRef.current && !panelRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      // Add listener only when dropdown is open
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]); // Re-run when isOpen changes
    
    const formatOptions = (): { value: string, label: string }[] => {
      return options.map(option => 
        typeof option === 'string' 
          ? { value: option, label: option }
          : option
      );
    };
    
    const formattedOptions = formatOptions();
    
    // Toggle options and call parent onChange immediately
    const toggleOption = (value: string) => {
      let newValues;
      if (values.includes(value)) {
        newValues = values.filter(v => v !== value);
      } else {
        newValues = [...values, value];
      }
      onChange(newValues); // Update parent state immediately
    };
    
    // Toggle all options and call parent onChange immediately
    const toggleAll = () => {
      let newValues: string[];
      if (values.length === formattedOptions.length) {
        newValues = [];
      } else {
        newValues = formattedOptions.map(opt => opt.value);
      }
      onChange(newValues); // Update parent state immediately
    };
    
    // Display text based on parent prop values
    const displayText = values.length > 0 
      ? `${values.length} selected` 
      : placeholder;
      
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full rounded-lg border-green-200 focus:ring-green-500 focus:border-green-500 bg-white 
            transition-all duration-200 cursor-pointer hover:border-green-400 text-left
            pl-4 pr-10 py-2.5 text-sm text-gray-700 border shadow-sm
            ${className}`}
        >
          <div className="flex items-center justify-between">
            <span className={values.length === 0 ? "text-gray-500" : "text-gray-800"}>
              {displayText}
            </span>
            <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} />
          </div>
        </button>
        
        {isOpen && (
          <div 
            ref={panelRef} // Add ref to the panel
            className="absolute z-10 mt-1 w-full bg-white border border-green-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto custom-scrollbar"
            // Prevent clicks inside the panel from closing it via the document listener
            onMouseDown={(e) => e.stopPropagation()} 
          >
            <div className="sticky top-0 bg-green-50 border-b border-green-200 px-3 py-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={values.length === formattedOptions.length && formattedOptions.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm font-medium text-green-800">Select All</span>
              </div>
            </div>
            {formattedOptions.map((option) => (
              <label 
                key={option.value} 
                className="flex items-center px-3 py-2 hover:bg-green-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={values.includes(option.value)}
                  // Use onChange for checkbox toggle logic
                  onChange={() => toggleOption(option.value)} 
                  className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Keep the original CustomSelect for single-select dropdowns
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

  // Add pagination controls component
  const PaginationControls = () => {
    const maxVisiblePages = 5;
    const pages = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((currentPage - 1) * questionsPerPage) + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * questionsPerPage, totalQuestions)}
              </span> of{' '}
              <span className="font-medium">{totalQuestions}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              {startPage > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                      ...
                    </span>
                  )}
                </>
              )}
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === page
                      ? 'z-10 bg-green-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              ))}
              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

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
                  {totalQuestions} total questions
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
                            <span className="text-xs text-gray-600 ml-2 flex items-center">
                              <span className="font-medium">{question.author?.username || 'Unknown Author'}</span>
                              <span className="mx-1">•</span>
                              <span>{new Date(question.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
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
                              handleDelete(question._id);
                            }}
                            className={`px-3 py-1 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors ${!isSuperAdmin && 'opacity-50 cursor-not-allowed'}`}
                            disabled={!isSuperAdmin}
                            title={!isSuperAdmin ? 'Only superadmins can delete questions' : ''}
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleQuestionExpand(question._id);
                                    }}
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
                                  <span className="text-gray-600">Author:</span>
                                  <span className="font-medium text-gray-900">{question.author?.username || 'Unknown Author'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Added On:</span>
                                  <span className="font-medium text-gray-900">
                                    {new Date(question.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
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
            <PaginationControls />
          </div>

          {/* Filters Sidebar - Improved layout with better organization */}
          <div className={`lg:w-96 transition-all duration-300 ease-in-out ${
              showFilters ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full lg:opacity-100 lg:translate-x-0'
          }`}>
            <div className="lg:sticky lg:top-4 bg-white rounded-xl shadow-sm border border-green-100 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-4 border-b border-green-100 bg-white">
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

              {/* Tab Navigation */}
              <div className="flex border-b border-green-100">
                {[
                  { id: 'basic', label: 'Basic', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" /> },
                  { id: 'advanced', label: 'Advanced', icon: <AcademicCapIcon className="h-4 w-4" /> },
                  { id: 'additional', label: 'Additional', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" /> },
                  { id: 'sorting', label: 'Sorting', icon: <ClockIcon className="h-4 w-4" /> }
                ].map(tab => (
                    <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-xs font-medium flex flex-col items-center justify-center transition-colors duration-200
                      ${activeTab === tab.id 
                        ? 'bg-green-50 text-green-700 border-b-2 border-green-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                  >
                    {tab.icon}
                    <span className="mt-1">{tab.label}</span>
                    </button>
                ))}
              </div>

              {/* Scrollable Content - Show only active tab content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-4">
                  {/* Basic Filters Tab */}
                  {activeTab === 'basic' && (
                      <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="text-sm font-medium text-green-800">Basic Filters</h3>
                      </div>
                      
                        {/* Subject Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Subject</label>
                        <CheckboxMultiSelect
                          values={filters.subject}
                          onChange={(values) => setFilters({ ...filters, subject: values })}
                            options={filterOptions.subjects}
                            placeholder="All Subjects"
                          />
                        </div>

                        {/* Year Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Year</label>
                        <CheckboxMultiSelect
                          values={filters.year}
                          onChange={(values) => setFilters({ ...filters, year: values })}
                            options={['2024', '2023', '2022', '2021', '2020', '2019']}
                            placeholder="All Years"
                          />
                        </div>

                        {/* Section Filter */}
                      <div className="filter-group">
                            <label className="block text-sm font-medium text-green-700 mb-2">Section</label>
                        <CheckboxMultiSelect
                          values={filters.section}
                            onChange={handleSectionChange}
                          options={filters.subject.length > 0 
                            ? filters.subject.flatMap(subj => 
                                filterOptions.sections[subj as keyof typeof filterOptions.sections] || []
                              )
                            : []}
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
                              onClick={() => {
                                // Toggle value in array
                                setFilters(prev => {
                                  if (prev.difficulty.includes(diff)) {
                                    return { ...prev, difficulty: prev.difficulty.filter(d => d !== diff) };
                                  } else {
                                    return { ...prev, difficulty: [...prev.difficulty, diff] };
                                  }
                                });
                              }}
                                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                                ${filters.difficulty.includes(diff)
                                  ? 'bg-green-100 text-green-800 border border-green-200 shadow-sm'
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

                  {/* Advanced Filters Tab */}
                  {activeTab === 'advanced' && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <AcademicCapIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="text-sm font-medium text-green-800">Advanced Filters</h3>
                      </div>
                      
                        {/* Exam Type Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Exam Type</label>
                        <CheckboxMultiSelect
                          values={filters.examType}
                          onChange={(values) => setFilters({ ...filters, examType: values })}
                            options={filterOptions.examTypes}
                            placeholder="All Exam Types"
                          />
                        </div>

                        {/* Class Filter */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Class</label>
                        <CheckboxMultiSelect
                          values={filters.class}
                          onChange={(values) => setFilters({ ...filters, class: values })}
                            options={[
                            { value: 'class_9', label: 'Class 9' },
                            { value: 'class_10', label: 'Class 10' },
                              { value: 'class_11', label: 'Class 11' },
                            { value: 'class_12', label: 'Class 12' },
                            { value: 'none', label: 'Not Applicable' }
                            ]}
                            placeholder="Select Class"
                          />
                        </div>

                      {/* Question Type */}
                      <div className="filter-group">
                        <label className="block text-sm font-medium text-green-700 mb-2">Question Type</label>
                        <CheckboxMultiSelect
                          values={filters.questionType}
                          onChange={(values) => setFilters({ ...filters, questionType: values })}
                          options={filterOptions.questionTypes}
                          placeholder="All Question Types"
                        />
                      </div>

                      {/* Question Category */}
                      <div className="filter-group">
                        <label className="block text-sm font-medium text-green-700 mb-2">Question Category</label>
                        <CheckboxMultiSelect
                          values={filters.questionCategory}
                          onChange={(values) => setFilters({ ...filters, questionCategory: values })}
                          options={filterOptions.questionCategories}
                          placeholder="All Categories"
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Filters Tab */}
                  {activeTab === 'additional' && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <AdjustmentsHorizontalIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="text-sm font-medium text-green-800">Additional Options</h3>
                      </div>
                      
                      {/* Question Source */}
                      <div className="filter-group">
                        <label className="block text-sm font-medium text-green-700 mb-2">Question Source</label>
                        <CheckboxMultiSelect
                          values={filters.questionSource}
                          onChange={(values) => setFilters({ ...filters, questionSource: values })}
                          options={filterOptions.questionSources}
                          placeholder="All Sources"
                          />
                        </div>

                        {/* Language Level */}
                        <div className="filter-group">
                          <label className="block text-sm font-medium text-green-700 mb-2">Language Level</label>
                        <CheckboxMultiSelect
                          values={filters.languageLevel}
                          onChange={(values) => setFilters({ ...filters, languageLevel: values })}
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

                  {/* Sorting Tab */}
                  {activeTab === 'sorting' && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="text-sm font-medium text-green-800">Sort Questions</h3>
                      </div>
                      
                        <div className="filter-group">
                        <label className="block text-sm font-medium text-green-700 mb-2">Sort By</label>
                          <CustomSelect
                            value={filters.sortBy}
                            onChange={(value) => setFilters({ ...filters, sortBy: value })}
                            options={sortOptions}
                            placeholder="Select Sorting"
                          className="bg-white"
                        />
                        
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-green-700 mb-2">Sort Direction</label>
                          <div className="flex">
                            <button
                              onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                              className={`flex-1 px-3 py-2 border border-r-0 rounded-l-lg text-sm font-medium 
                                ${filters.sortOrder === 'asc' 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                              Ascending
                            </button>
                            <button
                              onClick={() => setFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                              className={`flex-1 px-3 py-2 border rounded-r-lg text-sm font-medium 
                                ${filters.sortOrder === 'desc' 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                              Descending
                            </button>
                        </div>
                      </div>
                  </div>
                    </div>
                  )}
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
              <h3 className="text-lg font-medium text-gray-900">Permanent Deletion</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to <span className="font-bold text-red-600">permanently delete</span> this question? This action cannot be undone and all associated data will be lost.
            </p>
            <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-4">
              <p className="text-sm text-red-700">
                This will remove the question from all tests and analytics.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedQuestionId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 flex items-center"
              >
                {deletingId !== null ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Permanently"
                )}
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

        /* Add these new styles */
        .custom-scrollbar {
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}
