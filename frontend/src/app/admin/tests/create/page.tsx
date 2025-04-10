"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Loader2, AlertCircle, X, ChevronLeft, ChevronRight, Check, CheckCircle
} from "lucide-react";
import { toast } from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Import our modular components
import { TestDetailsForm } from "@/components/admin/tests/TestDetailsForm";
import { QuestionSelection } from "@/components/admin/tests/questions/QuestionSelection";
import { TestCreationStepper } from "@/components/admin/tests/TestCreationStepper";

// Import type definitions
import { TestDetails } from "@/components/admin/tests/types";
import { 
  Question, 
  FilterState, 
  AvailableOptions, 
  SelectedQuestionsMetrics 
} from "@/components/admin/tests/questions/types";

export default function CreateTestPage() {
  const router = useRouter();
  
  // Updated Test Details State
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
  
  // Question Expand State
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(30);
  const [showMoreVisible, setShowMoreVisible] = useState(true);
  
  // Calculate metrics for selected questions
  const selectedQuestionsMetrics = useMemo<SelectedQuestionsMetrics>(() => {
    const selectedQuestionObjects = questions.filter(q => selectedQuestions.includes(q._id));
    
    const totalMarks = selectedQuestionObjects.reduce((sum, q) => sum + (q.marks || 0), 0);
    
    const subjectCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};
    
    selectedQuestionObjects.forEach(q => {
      // Count by subject
      const subject = q.subject || 'unknown';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      
      // Count by difficulty
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
        q.question.text?.toLowerCase().includes(searchLower) // Check if text exists
      );
    }
    // Apply select filters
    if (filters.examType.length > 0) {
      filtered = filtered.filter(q => filters.examType.includes(q.examType));
    }
    if (filters.year.length > 0) {
      filtered = filtered.filter(q => q.year && filters.year.includes(q.year)); // Check if year exists
    }
    if (filters.subject.length > 0) {
      filtered = filtered.filter(q => filters.subject.includes(q.subject));
    }
    if (filters.chapter.length > 0) { // Filter by chapter
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

    // Only apply pagination if there are active filters or search
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
      // Apply pagination when filters are active
      const indexOfLastQuestion = currentPage * questionsPerPage;
      const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
      const currentQuestions = filtered.slice(indexOfFirstQuestion, indexOfLastQuestion);
      
      // Check if we need to show the "Show More" button
      const hasMoreQuestions = filtered.length > indexOfLastQuestion;
      
      return { 
        filteredData: currentQuestions, 
        totalFilteredCount: filtered.length,
        hasMoreQuestions
      };
    } else {
      // With the new approach, we still paginate when no filters are active
      const indexOfLastQuestion = currentPage * questionsPerPage;
      const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
      const currentQuestions = filtered.slice(indexOfFirstQuestion, indexOfLastQuestion);
      
      // Check if we need to show the "Show More" button
      const hasMoreQuestions = filtered.length > indexOfLastQuestion;
      
      return { 
        filteredData: currentQuestions, 
        totalFilteredCount: filtered.length,
        hasMoreQuestions
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
    async function loadQuestions() {
      setLoading(true);
      setError("");
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error("Authentication required. Please log in again.");
        }
        
        // Adding a large limit parameter to fetch all questions at once
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions?limit=1000`, { 
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
           },
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error("Questions API Error:", res.status, errorText);
          throw new Error(`Failed to fetch questions (${res.status}). Please try again.`);
        }

        const data = await res.json();
        if (!data.success || !data.data) {
           throw new Error(data.message || "Invalid data format received");
        }
        
        const allQuestions: Question[] = data.data.questions || []; 
        const totalQuestions = data.data.totalQuestions || 0;
        console.log(`Loaded ${allQuestions.length} questions out of ${totalQuestions} total`);

        if (allQuestions.length === 0) {
          toast.error("No questions available. You may need to add questions first.");
        }

        // Extract unique values for filters
        const options = {
          subjects: new Set(allQuestions.map(q => q.subject).filter(Boolean)) as Set<string>,
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
        
        // Show all questions initially without pagination
        setFilteredQuestions(allQuestions);
        
        toast.success(`Loaded ${allQuestions.length} questions successfully!`);
      } catch (err: any) {
        const errorMessage = err.message || "Failed to load questions. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error loading questions:", err);
      } finally {
        setLoading(false); 
      }
    }
    
    loadQuestions();
  }, []);

  // Add a retry button in the error message
  const retryLoadQuestions = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      toast.error("Authentication required. Please log in again.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions?limit=1000`, { 
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    })
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch questions (${res.status})`);
      return res.json();
    })
    .then(data => {
      if (!data.success || !data.data) {
        throw new Error(data.message || "Invalid data format received");
      }
      
      const allQuestions: Question[] = data.data.questions || [];
      const totalQuestions = data.data.totalQuestions || 0;
      console.log(`Loaded ${allQuestions.length} questions out of ${totalQuestions} total on retry`);
      
      // Extract unique values for filters
      const options = {
        subjects: new Set(allQuestions.map(q => q.subject).filter(Boolean)) as Set<string>,
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
      
      // Show all questions initially without pagination
      setFilteredQuestions(allQuestions);
      
      toast.success(`Loaded ${allQuestions.length} questions successfully!`);
    })
    .catch(err => {
      const errorMessage = err.message || "Failed to load questions. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error retrying load questions:", err);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  // Handle Input Changes
  const handleDetailChange = (field: keyof TestDetails, value: any) => {
     // Special handling for placeholder values
     if (value === 'placeholder') {
        value = '';
     }
     
     // Reset category-specific fields when category changes
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
        ...(prev[parentField] as object), // Type assertion
        [childField]: value === '' ? undefined : value, // Handle empty string for optional numbers
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
    // Basic Frontend Validation
    if (!testDetails.title || !testDetails.testCategory || !testDetails.subject || !testDetails.examType || !testDetails.class || !testDetails.duration || selectedQuestions.length === 0) {
       toast.error("Please fill all required fields (*) and select at least one question.");
       setError("Please fill all required fields (*) and select at least one question.");
       setActiveStep(1); // Go back to details if basic info is missing
       return;
    }
    
    // Category Specific Validation
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
    setError(""); // Clear previous errors

    // Prepare payload matching backend model
    const payload = {
        ...testDetails,
        questions: selectedQuestions,
        // Ensure numeric fields are numbers or undefined
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
        // Ensure boolean is sent
        isPremium: testDetails.testCategory === 'Platform' ? !!testDetails.isPremium : undefined,
        // Remove empty optional fields if necessary (backend might handle null/undefined)
        description: testDetails.description || undefined,
        instructions: testDetails.instructions || undefined,
        syllabus: testDetails.syllabus || undefined,
        session: testDetails.session || undefined,
    };
    
     // Remove fields not relevant to the category before sending
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

    console.log("Submitting Payload:", payload); // Log payload for debugging

    try {
        const accessToken = localStorage.getItem('accessToken'); // Get token
        if (!accessToken) {
            throw new Error("Authentication token not found. Please log in.");
        }
        
        // Use fetch directly or API wrapper if available
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}` // Include auth token
            },
            body: JSON.stringify(payload),
        });
        
        const responseData = await response.json(); // Always try to parse JSON

        if (!response.ok) {
           console.error("API Error Response:", responseData);
           throw new Error(responseData.message || `Failed to create test: ${response.statusText}`);
        }
        
        toast.success("Test created successfully!");
        router.push("/admin/tests"); // Redirect on success

    } catch (err: any) {
        setError(err.message || "Failed to create test. Please try again.");
        toast.error(err.message || "Failed to create test.");
        console.error("Error creating test:", err);
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

  if (loading && questions.length === 0) { // Show initial loading state only
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Card className="border-green-200">
        <CardHeader className="bg-green-50 border-b border-green-100">
          <CardTitle className="text-green-800 flex justify-between items-center">
            <span>Create New Test</span>
            {activeStep === 2 && (
              <Button 
                onClick={handleCreateTest} 
                disabled={isSubmitting || selectedQuestions.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Create Test
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Create a new test by selecting questions and defining test parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <TestCreationStepper
            activeStep={activeStep}
            onStepClick={setActiveStep}
            testDetails={testDetails}
            selectedQuestionsCount={selectedQuestions.length}
          />

          {/* Test Details Form */}
          <div className={activeStep === 1 ? 'block' : 'hidden'}>
            <TestDetailsForm 
              testDetails={testDetails}
              onDetailChange={handleDetailChange}
              onNestedDetailChange={handleNestedDetailChange}
            />
          </div>

          {/* Question Selection */}
          <div className={activeStep === 2 ? 'block' : 'hidden'}>
            <QuestionSelection
              questions={questions}
              filteredQuestions={filteredQuestions}
              totalFilteredCount={paginatedAndFilteredQuestions.totalFilteredCount}
              selectedQuestions={selectedQuestions}
              expandedQuestions={expandedQuestions}
              filters={filters}
              availableOptions={availableOptions}
              loading={loading}
              error={error}
              currentPage={currentPage}
              questionsPerPage={questionsPerPage}
              selectedQuestionsMetrics={selectedQuestionsMetrics}
              onSelectQuestion={handleQuestionSelect}
              onToggleExpand={handleToggleExpand}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              onFilterChange={setFilters}
              onResetFilters={handleResetFilters}
              onPageChange={setCurrentPage}
              onSubmit={handleCreateTest}
              isSubmitting={isSubmitting}
            />
            
            {/* Show More Button */}
            {showMoreVisible && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  className="border-green-300 text-green-700 hover:bg-green-50"
                  onClick={handleShowMore}
                >
                  Show More Questions
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
