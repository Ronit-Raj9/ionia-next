"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAdminStore } from '../../../store/adminStore';
import { TestDetails } from '../types';
import { 
  Question, 
  FilterState, 
  AvailableOptions, 
  SelectedQuestionsMetrics 
} from '../questions/types';

interface RevisionHistoryItem {
  _id: string;
  version: number;
  timestamp: string;
  modifiedBy: {
    _id: string;
    username: string;
    email: string;
  };
  changesDescription: string;
}

interface TestEditContainerProps {
  children: (props: TestEditContextProps) => React.ReactNode;
}

export interface TestEditContextProps {
  // Test ID
  testId: string;
  
  // Test Details State
  testDetails: TestDetails;
  setTestDetails: React.Dispatch<React.SetStateAction<TestDetails>>;
  handleDetailChange: (field: keyof TestDetails, value: any) => void;
  handleNestedDetailChange: (parentField: keyof TestDetails, childField: string, value: any) => void;
  
  // Questions State
  questions: Question[];
  filteredQuestions: Question[];
  selectedQuestions: string[];
  loading: boolean;
  error: string;
  
  // Filter State
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableOptions: AvailableOptions;
  
  // UI State
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  expandedQuestions: Set<string>;
  setExpandedQuestions: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Pagination State
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  questionsPerPage: number;
  setQuestionsPerPage: React.Dispatch<React.SetStateAction<number>>;
  showMoreVisible: boolean;
  
  // Revision History
  revisionHistory: RevisionHistoryItem[];
  loadingHistory: boolean;
  
  // Metrics
  selectedQuestionsMetrics: SelectedQuestionsMetrics;
  paginatedAndFilteredQuestions: {
    filteredData: Question[];
    totalFilteredCount: number;
    hasMoreQuestions: boolean;
  };
  
  // Actions
  handleQuestionSelect: (questionId: string) => void;
  handleToggleExpand: (questionId: string) => void;
  handleExpandAll: () => void;
  handleCollapseAll: () => void;
  handleResetFilters: () => void;
  handleShowMore: () => void;
  handleUpdateTest: () => Promise<void>;
  handleLoadRevisionHistory: () => Promise<void>;
  retryLoadQuestions: () => void;
  retryLoadTest: () => void;
  
  // Submission State
  isSubmitting: boolean;
  testLoading: boolean;
  testError: string;
}

const TestEditContainer: React.FC<TestEditContainerProps> = ({ children }) => {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const redirectInProgress = useRef(false);
  const { updateTest, getTestById } = useAdminStore();
  
  // Test data state
  const [testDetails, setTestDetails] = useState<TestDetails>({
    title: "",
    description: "",
    tags: [],
    testCategory: '', 
    status: 'draft',
    instructions: "",
    solutionsVisibility: 'after_submission',
    attemptsAllowed: null, 
    duration: 180, 
    subject: '', 
    examType: '', 
    class: '', 
    difficulty: '', 
  });

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [testLoading, setTestLoading] = useState(true);
  const [testError, setTestError] = useState("");

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    examType: [],
    year: [],
    subject: [],
    difficulty: [],
    chapter: [],
    questionType: [],
    questionCategory: [],
    questionSource: [],
    section: [],
    languageLevel: [],
    isVerified: null,
    isActive: null,
    marks: { min: null, max: null },
    negativeMarks: { min: null, max: null },
    class: [],
    searchTerm: "",
  });

  // UI State
  const [activeTab, setActiveTab] = useState('details');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(30);
  const [showMoreVisible, setShowMoreVisible] = useState(true);

  // Revision History State
  const [revisionHistory, setRevisionHistory] = useState<RevisionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Available Options
  const [availableOptions, setAvailableOptions] = useState<AvailableOptions>({
    subjects: new Set<string>(),
    examTypes: new Set<string>(),
    years: new Set<string>(),
    chapters: new Set<string>(),
    difficulties: new Set(['easy', 'medium', 'hard']),
    questionTypes: new Set(['single', 'multiple', 'numerical']),
    questionCategories: new Set(['theoretical', 'numerical']),
    questionSources: new Set(['custom', 'india_book', 'foreign_book', 'pyq']),
    sections: new Set<string>(),
    languageLevels: new Set(['basic', 'intermediate', 'advanced']),
    classes: new Set(['class_9', 'class_10', 'class_11', 'class_12', 'none']),
    marks: { min: 0, max: 10 },
    negativeMarks: { min: -5, max: 0 },
  });

  // Calculate metrics for selected questions
  const selectedQuestionsMetrics = useMemo<SelectedQuestionsMetrics>(() => {
    const selectedQuestionObjects = questions.filter(q => selectedQuestions.includes(q._id));
    
    const totalMarks = selectedQuestionObjects.reduce((sum, q) => sum + (q.marks || 0), 0);
    
    const subjectCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};
    
    selectedQuestionObjects.forEach(q => {
      const subject = q.subject || 'unknown';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      
      const difficulty = q.difficulty || 'unknown';
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
    });
    
    return {
      count: selectedQuestionObjects.length,
      totalMarks,
      subjectCounts,
      difficultyCounts
    };
  }, [questions, selectedQuestions]);

  // Apply Filters & Pagination (Memoized)
  const paginatedAndFilteredQuestions = useMemo(() => {
    let filtered = questions;

    // Apply filters (same logic as create page)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.text?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.examType.length > 0) {
      filtered = filtered.filter(q => filters.examType.includes(q.examType));
    }
    if (filters.year.length > 0) {
      filtered = filtered.filter(q => q.year && filters.year.includes(q.year));
    }
    if (filters.subject.length > 0) {
      filtered = filtered.filter(q => {
        if (!q.subject) return false;
        
        return filters.subject.some(selectedSubject => {
          const qSubjectLower = q.subject.toLowerCase().trim();
          const selectedSubjectLower = selectedSubject.toLowerCase().trim();
          
          return qSubjectLower === selectedSubjectLower || 
                 qSubjectLower.includes(selectedSubjectLower) || 
                 selectedSubjectLower.includes(qSubjectLower);
        });
      });
    }

    // Apply remaining filters...
    // (Similar to create page, omitted for brevity)

    const hasActiveFilters = filters.searchTerm || 
                            filters.examType.length > 0 || 
                            filters.year.length > 0 || 
                            filters.subject.length > 0;
    
    if (hasActiveFilters) {
      const indexOfLastQuestion = currentPage * questionsPerPage;
      const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
      const currentQuestions = filtered.slice(indexOfFirstQuestion, indexOfLastQuestion);
      
      const hasMoreQuestions = filtered.length > indexOfLastQuestion;
      
      return { 
        filteredData: currentQuestions, 
        totalFilteredCount: filtered.length,
        hasMoreQuestions
      };
    } else {
      return { 
        filteredData: filtered, 
        totalFilteredCount: filtered.length,
        hasMoreQuestions: false
      };
    }
  }, [filters, questions, currentPage, questionsPerPage]);
  
  // Update filteredQuestions whenever the memoized value changes
  useEffect(() => {
    if (paginatedAndFilteredQuestions) {
      setFilteredQuestions(paginatedAndFilteredQuestions.filteredData);
      setShowMoreVisible(paginatedAndFilteredQuestions.hasMoreQuestions);
    }
  }, [paginatedAndFilteredQuestions]);

  // Load Test Data
  useEffect(() => {
    if (testId && !redirectInProgress.current) {
      loadTestData();
    }
  }, [testId]);

  // Load Questions
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadTestData = async () => {
    setTestLoading(true);
    setTestError("");
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${testId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 404) {
          toast.error("Test not found. Redirecting to tests list...");
          redirectInProgress.current = true;
          router.push('/admin/tests');
          return;
        }
        throw new Error(errorData?.message || `Failed to load test (${response.status})`);
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.message || "Invalid response format");
      }

      const testData = data.data;
      setTestDetails({
        title: testData.title || "",
        description: testData.description || "",
        tags: testData.tags || [],
        testCategory: testData.testCategory || '',
        status: testData.status || 'draft',
        instructions: testData.instructions || "",
        solutionsVisibility: testData.solutionsVisibility || 'after_submission',
        attemptsAllowed: testData.attemptsAllowed,
        duration: testData.duration || 180,
        subject: testData.subject || '',
        examType: testData.examType || '',
        class: testData.class || '',
        difficulty: testData.difficulty || '',
        year: testData.year,
        month: testData.month,
        day: testData.day,
        session: testData.session,
        platformTestType: testData.platformTestType,
        isPremium: testData.isPremium,
        syllabus: testData.syllabus,
        markingScheme: testData.markingScheme || {}
      });

      // Set selected questions
      const questionIds = testData.questions?.map((q: any) => 
        typeof q === 'string' ? q : q._id
      ) || [];
      setSelectedQuestions(questionIds);

      toast.success("Test loaded successfully!");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load test data";
      setTestError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTestLoading(false);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("Authentication required. Please log in again.");
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions?limit=10000`, { 
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
         },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch questions (${res.status}). Please try again.`);
      }

      const data = await res.json();
      if (!data.success || !data.data) {
         throw new Error(data.message || "Invalid data format received");
      }
      
      const allQuestions: Question[] = data.data.questions || []; 

      // Extract unique values for filters
      const options = {
        subjects: new Set(
          allQuestions
            .map(q => q.subject?.toLowerCase())
            .filter(Boolean)
            .map(subject => subject?.trim())
        ) as Set<string>,
        examTypes: new Set(allQuestions.map(q => q.examType).filter(Boolean)) as Set<string>,
        years: new Set(allQuestions.map(q => q.year).filter(Boolean).sort()) as Set<string>,
        chapters: new Set(allQuestions.map(q => q.chapter).filter(Boolean)) as Set<string>,
        difficulties: new Set(allQuestions.map(q => q.difficulty).filter(Boolean)) as Set<string>,
        questionTypes: new Set(allQuestions.map(q => q.questionType).filter(Boolean)) as Set<string>,
        questionCategories: new Set(allQuestions.map(q => q.questionCategory).filter(Boolean)) as Set<string>,
        questionSources: new Set(allQuestions.map(q => q.questionSource).filter(Boolean)) as Set<string>,
        sections: new Set(allQuestions.map(q => q.section).filter(Boolean)) as Set<string>,
        languageLevels: new Set(allQuestions.map(q => q.languageLevel).filter(Boolean)) as Set<string>,
        classes: new Set(allQuestions.map(q => q.class).filter(Boolean)) as Set<string>,
        marks: {
          min: Math.min(...allQuestions.map(q => q.marks || 1)),
          max: Math.max(...allQuestions.map(q => q.marks || 1))
        },
        negativeMarks: {
          min: Math.min(...allQuestions.map(q => q.negativeMarks || 0)),
          max: Math.max(...allQuestions.map(q => q.negativeMarks || 0))
        }
      };

      setAvailableOptions(options);
      setQuestions(allQuestions);
      setFilteredQuestions(allQuestions);
      
      toast.success(`Loaded ${allQuestions.length} questions successfully!`);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to load questions. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false); 
    }
  };

  // Handle Input Changes
  const handleDetailChange = (field: keyof TestDetails, value: any) => {
     if (value === 'placeholder') {
        value = '';
     }
     
     if (field === 'testCategory') {
       setTestDetails(prev => ({ 
           ...prev, 
           [field]: value, 
           year: undefined,
           month: undefined,
           day: undefined,
           session: undefined,
           platformTestType: undefined,
           isPremium: undefined,
           syllabus: undefined
        }));
     } else {
         setTestDetails(prev => ({ ...prev, [field]: value }));
     }
  };

  const handleNestedDetailChange = (parentField: keyof TestDetails, childField: string, value: any) => {
    setTestDetails(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as object),
        [childField]: value === '' ? undefined : value,
      }
    }));
  };

  // Handle Question Selection
  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Handle Toggle Expand
  const handleToggleExpand = (questionId: string) => {
    const newExpandedQuestions = new Set(expandedQuestions);
    if (newExpandedQuestions.has(questionId)) {
      newExpandedQuestions.delete(questionId);
    } else {
      newExpandedQuestions.add(questionId);
    }
    setExpandedQuestions(newExpandedQuestions);
  };

  // Handle Expand/Collapse All
  const handleExpandAll = () => {
    const newExpandedSet = new Set<string>();
    filteredQuestions.forEach(q => newExpandedSet.add(q._id));
    setExpandedQuestions(newExpandedSet);
  };

  const handleCollapseAll = () => {
    setExpandedQuestions(new Set());
  };

  // Handle Update Test Submission
  const handleUpdateTest = async () => {
    if (!testDetails.title || !testDetails.testCategory || !testDetails.subject || !testDetails.examType || !testDetails.class || !testDetails.duration || selectedQuestions.length === 0) {
       toast.error("Please fill all required fields (*) and select at least one question.");
       setError("Please fill all required fields (*) and select at least one question.");
       return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        ...testDetails,
        questions: selectedQuestions,
        year: testDetails.year ? Number(testDetails.year) : undefined,
        month: testDetails.month ? Number(testDetails.month) : undefined,
        day: testDetails.day ? Number(testDetails.day) : undefined,
        duration: Number(testDetails.duration),
        attemptsAllowed: testDetails.attemptsAllowed ? Number(testDetails.attemptsAllowed) : null,
        markingScheme: {
           correct: testDetails.markingScheme?.correct !== undefined ? Number(testDetails.markingScheme.correct) : undefined,
           incorrect: testDetails.markingScheme?.incorrect !== undefined ? Number(testDetails.markingScheme.incorrect) : undefined,
           unattempted: testDetails.markingScheme?.unattempted !== undefined ? Number(testDetails.markingScheme.unattempted) : undefined,
        },
        isPremium: testDetails.testCategory === 'Platform' ? !!testDetails.isPremium : undefined,
        description: testDetails.description || undefined,
        instructions: testDetails.instructions || undefined,
        syllabus: testDetails.syllabus || undefined,
        session: testDetails.session || undefined,
      };

      await updateTest(testId, payload);
      toast.success("Test updated successfully!");
      router.push("/admin/tests");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update test. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load Revision History
  const handleLoadRevisionHistory = async () => {
    setLoadingHistory(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${testId}/history`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRevisionHistory(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load revision history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setCurrentPage(1);
    setFilters({ 
      examType: [], 
      year: [], 
      subject: [], 
      difficulty: [], 
      chapter: [], 
      questionType: [],
      questionCategory: [],
      questionSource: [],
      section: [],
      languageLevel: [],
      isVerified: null,
      isActive: null,
      marks: { min: null, max: null },
      negativeMarks: { min: null, max: null },
      class: [],
      searchTerm: "" 
    });
  };

  // Handle showing more questions
  const handleShowMore = () => {
    setQuestionsPerPage(prevValue => prevValue + 30);
  };

  // Retry functions
  const retryLoadQuestions = () => {
    loadQuestions();
  };

  const retryLoadTest = () => {
    loadTestData();
  };

  const contextProps: TestEditContextProps = {
    testId,
    testDetails,
    setTestDetails,
    handleDetailChange,
    handleNestedDetailChange,
    questions,
    filteredQuestions,
    selectedQuestions,
    loading,
    error,
    filters,
    setFilters,
    availableOptions,
    activeTab,
    setActiveTab,
    expandedQuestions,
    setExpandedQuestions,
    currentPage,
    setCurrentPage,
    questionsPerPage,
    setQuestionsPerPage,
    showMoreVisible,
    revisionHistory,
    loadingHistory,
    selectedQuestionsMetrics,
    paginatedAndFilteredQuestions,
    handleQuestionSelect,
    handleToggleExpand,
    handleExpandAll,
    handleCollapseAll,
    handleResetFilters,
    handleShowMore,
    handleUpdateTest,
    handleLoadRevisionHistory,
    retryLoadQuestions,
    retryLoadTest,
    isSubmitting,
    testLoading,
    testError,
  };

  return <>{children(contextProps)}</>;
};

export default TestEditContainer;