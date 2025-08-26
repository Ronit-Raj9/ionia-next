"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAdminStore } from '../../../store/adminStore';
import { TestDetails } from '../types';
import { 
  Question, 
  FilterState, 
  AvailableOptions, 
  SelectedQuestionsMetrics 
} from '../questions/types';

interface TestCreationContainerProps {
  children: (props: TestCreationContextProps) => React.ReactNode;
}

export interface TestCreationContextProps {
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
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  expandedQuestions: Set<string>;
  setExpandedQuestions: React.Dispatch<React.SetStateAction<Set<string>>>;
  
  // Pagination State
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  questionsPerPage: number;
  setQuestionsPerPage: React.Dispatch<React.SetStateAction<number>>;
  showMoreVisible: boolean;
  
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
  handleCreateTest: () => Promise<void>;
  retryLoadQuestions: () => void;
  
  // Submission State
  isSubmitting: boolean;
}

const TestCreationContainer: React.FC<TestCreationContainerProps> = ({ children }) => {
  const router = useRouter();
  const { createTest } = useAdminStore();
  
  // Test Details State
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
  const [activeStep, setActiveStep] = useState(1);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(30);
  const [showMoreVisible, setShowMoreVisible] = useState(true);

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

    // Apply text search
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.text?.toLowerCase().includes(searchLower)
      );
    }

    // Apply select filters
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
    if (filters.chapter.length > 0) {
      filtered = filtered.filter(q => filters.chapter.includes(q.chapter));
    }
    if (filters.difficulty.length > 0) {
      filtered = filtered.filter(q => filters.difficulty.includes(q.difficulty));
    }
    if (filters.questionType.length > 0) {
      filtered = filtered.filter(q => filters.questionType.includes(q.questionType));
    }
    if (filters.questionCategory.length > 0) {
      filtered = filtered.filter(q => q.questionCategory && filters.questionCategory.includes(q.questionCategory));
    }
    if (filters.questionSource.length > 0) {
      filtered = filtered.filter(q => q.questionSource && filters.questionSource.includes(q.questionSource));
    }
    if (filters.section.length > 0) {
      filtered = filtered.filter(q => q.section && filters.section.includes(q.section));
    }
    if (filters.class.length > 0) {
      filtered = filtered.filter(q => filters.class.includes(q.class));
    }
    if (filters.isVerified !== null) {
      filtered = filtered.filter(q => q.isVerified === filters.isVerified);
    }
    if (filters.isActive !== null) {
      filtered = filtered.filter(q => q.isActive === filters.isActive);
    }
    if (filters.marks.min !== null || filters.marks.max !== null) {
      filtered = filtered.filter(q => {
        if (filters.marks.min !== null && filters.marks.max !== null) {
          return q.marks >= filters.marks.min && q.marks <= filters.marks.max;
        } else if (filters.marks.min !== null) {
          return q.marks >= filters.marks.min;
        } else if (filters.marks.max !== null) {
          return q.marks <= filters.marks.max;
        }
        return true;
      });
    }
    if (filters.negativeMarks.min !== null || filters.negativeMarks.max !== null) {
      filtered = filtered.filter(q => {
        const negMarks = q.negativeMarks || 0;
        if (filters.negativeMarks.min !== null && filters.negativeMarks.max !== null) {
          return negMarks >= filters.negativeMarks.min && negMarks <= filters.negativeMarks.max;
        } else if (filters.negativeMarks.min !== null) {
          return negMarks >= filters.negativeMarks.min;
        } else if (filters.negativeMarks.max !== null) {
          return negMarks <= filters.negativeMarks.max;
        }
        return true;
      });
    }

    // Check if filters are active
    const hasActiveFilters = filters.searchTerm || 
                            filters.examType.length > 0 || 
                            filters.year.length > 0 || 
                            filters.subject.length > 0 || 
                            filters.chapter.length > 0 || 
                            filters.difficulty.length > 0 ||
                            filters.questionType.length > 0 ||
                            filters.questionCategory.length > 0 ||
                            filters.questionSource.length > 0 ||
                            filters.section.length > 0 ||
                            filters.languageLevel.length > 0 ||
                            filters.class.length > 0 ||
                            filters.isVerified !== null ||
                            filters.isActive !== null ||
                            filters.marks.min !== null ||
                            filters.marks.max !== null ||
                            filters.negativeMarks.min !== null ||
                            filters.negativeMarks.max !== null;
    
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

  // Load Questions
  useEffect(() => {
    loadQuestions();
  }, []);

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
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(`Failed to fetch questions (${res.status}). Please try again.`);
      }

      const data = await res.json();
      if (!data.success || !data.data) {
         throw new Error(data.message || "Invalid data format received");
      }
      
      const allQuestions: Question[] = data.data.questions || []; 

      if (allQuestions.length === 0) {
        toast.error("No questions available. You may need to add questions first.");
      }

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

  // Handle Create Test Submission
  const handleCreateTest = async () => {
    // Basic validation
    if (!testDetails.title || !testDetails.testCategory || !testDetails.subject || !testDetails.examType || !testDetails.class || !testDetails.duration || selectedQuestions.length === 0) {
       toast.error("Please fill all required fields (*) and select at least one question.");
       setError("Please fill all required fields (*) and select at least one question.");
       setActiveStep(1);
       return;
    }
    
    if (testDetails.testCategory === 'PYQ' && !testDetails.year) {
       toast.error("Year is required for PYQ tests.");
       setError("Year is required for PYQ tests.");
       setActiveStep(1);
       return;
    }
    
     if (testDetails.testCategory === 'Platform' && !testDetails.platformTestType) {
       toast.error("Platform Test Type is required for Platform tests.");
       setError("Platform Test Type is required for Platform tests.");
       setActiveStep(1);
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
      
      // Clean up unused fields
      if (payload.testCategory !== 'PYQ') {
        delete payload.year;
        delete payload.month;
        delete payload.day;
        delete payload.session;
      }
      if (payload.testCategory !== 'Platform') {
        delete payload.platformTestType;
        delete payload.isPremium;
        delete payload.syllabus;
      }

      await createTest(payload);
      toast.success("Test created successfully!");
      router.push("/admin/tests");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create test. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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

  // Retry loading questions
  const retryLoadQuestions = () => {
    loadQuestions();
  };

  const contextProps: TestCreationContextProps = {
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
    activeStep,
    setActiveStep,
    expandedQuestions,
    setExpandedQuestions,
    currentPage,
    setCurrentPage,
    questionsPerPage,
    setQuestionsPerPage,
    showMoreVisible,
    selectedQuestionsMetrics,
    paginatedAndFilteredQuestions,
    handleQuestionSelect,
    handleToggleExpand,
    handleExpandAll,
    handleCollapseAll,
    handleResetFilters,
    handleShowMore,
    handleCreateTest,
    retryLoadQuestions,
    isSubmitting,
  };

  return <>{children(contextProps)}</>;
};

export default TestCreationContainer;