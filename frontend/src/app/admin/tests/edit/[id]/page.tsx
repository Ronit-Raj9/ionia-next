"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, CheckCircle, Save, ChevronDown, ChevronUp, Clock, 
  User, RotateCcw, AlertCircle, CalendarClock, Eye, History
} from "lucide-react";
import { toast } from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const redirectInProgress = useRef(false);
  
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
  
  // Metadata state
  const [createdBy, setCreatedBy] = useState<{username: string, email: string} | null>(null);
  const [lastModifiedBy, setLastModifiedBy] = useState<{username: string, email: string} | null>(null);
  const [createdAt, setCreatedAt] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [revisionHistory, setRevisionHistory] = useState<RevisionHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<{
    averageScore: number;
    averagePercentage: number;
    completionRate: number;
    timesAttempted: number;
  } | null>(null);
  
  // Original values for change detection
  const [originalTest, setOriginalTest] = useState<{
    title: string;
    status: string;
    questionCount: number;
  } | null>(null);
  
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
  const [activeTab, setActiveTab] = useState("details");
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

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

  // Apply Filters & Pagination (memoized - reused from create page)
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
      filtered = filtered.filter(q => q.year && filters.year.includes(q.year));
    }
    if (filters.subject.length > 0) {
      filtered = filtered.filter(q => filters.subject.includes(q.subject));
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

    // Apply pagination for all cases - simplified from create page
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
  }, [filters, questions, currentPage, questionsPerPage]);

  // Update filteredQuestions whenever the memoized value changes
  useEffect(() => {
    if (paginatedAndFilteredQuestions) {
      setFilteredQuestions(paginatedAndFilteredQuestions.filteredData);
      setShowMoreVisible(paginatedAndFilteredQuestions.hasMoreQuestions);
    }
  }, [paginatedAndFilteredQuestions]);

  // Fetch test data on mount
  useEffect(() => {
    const fetchTestData = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error("Authentication required. Please log in again.");
        }
        
        // Fetch test data
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${testId}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new Error(`Failed to fetch test: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        if (!data.success || !data.data) {
          throw new Error(data.message || "Invalid data format received");
        }
        
        const testData = data.data;
        console.log("Fetched test data:", testData);
        
        // Save original values for change detection
        setOriginalTest({
          title: testData.title || "",
          status: testData.status || "draft",
          questionCount: testData.questions?.length || 0
        });
        
        // Set test details
        setTestDetails({
          title: testData.title || "",
          description: testData.description || "",
          tags: testData.tags || [],
          testCategory: testData.testCategory || "",
          status: testData.status || "draft",
          instructions: testData.instructions || "",
          solutionsVisibility: testData.solutionsVisibility || "after_submission",
          attemptsAllowed: testData.attemptsAllowed,
          duration: testData.duration || 180,
          subject: testData.subject || "",
          examType: testData.examType || "",
          class: testData.class || "",
          difficulty: testData.difficulty || "",
          // Category specific fields
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
        setSelectedQuestions(testData.questions || []);
        
        // Set metadata
        setCreatedBy(testData.createdBy);
        setLastModifiedBy(testData.lastModifiedBy);
        setCreatedAt(testData.createdAt);
        setUpdatedAt(testData.updatedAt);
        setRevisionHistory(testData.revisionHistory || []);
        setAnalytics(testData.analytics || null);
        
        // Log revision history data for debugging
        console.log("Revision History:", JSON.stringify(testData.revisionHistory, null, 2));
        if (testData.revisionHistory && testData.revisionHistory.length > 0) {
          console.log("First revision modifiedBy:", testData.revisionHistory[0].modifiedBy);
        }
        
        toast.success("Test loaded successfully");
      } catch (err: any) {
        const errorMessage = err.message || "Failed to load test. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error loading test:", err);
      }
    };
    
    // Load all questions at the same time
    const loadQuestions = async () => {
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
          throw new Error(`Failed to fetch questions (${res.status}). Please try again.`);
        }

        const data = await res.json();
        if (!data.success || !data.data) {
           throw new Error(data.message || "Invalid data format received");
        }
        
        const allQuestions: Question[] = data.data.questions || []; 
        
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
        setFilteredQuestions(allQuestions.slice(0, questionsPerPage));
      } catch (err: any) {
        const errorMessage = err.message || "Failed to load questions. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error loading questions:", err);
      }
    };
    
    // Execute both fetch operations
    Promise.all([fetchTestData(), loadQuestions()])
      .catch(err => console.error("Error in parallel fetching:", err))
      .finally(() => setLoading(false));
  }, [testId, questionsPerPage]);

  // Handle Input Changes for test details
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

  // Handle Update Test Submission
  const handleUpdateTest = async () => {
    // Basic Frontend Validation
    if (!testDetails.title || !testDetails.testCategory || !testDetails.subject || !testDetails.examType || !testDetails.class || !testDetails.duration || selectedQuestions.length === 0) {
       toast.error("Please fill all required fields (*) and select at least one question.");
       setError("Please fill all required fields (*) and select at least one question.");
       setActiveTab("details");
       return;
    }
    
    // Category Specific Validation
    if (testDetails.testCategory === 'PYQ' && !testDetails.year) {
       toast.error("Year is required for PYQ tests.");
       setError("Year is required for PYQ tests.");
       setActiveTab("details");
       return;
    }
    
    if (testDetails.testCategory === 'Platform' && !testDetails.platformTestType) {
       toast.error("Platform test type is required for Platform tests.");
       setError("Platform test type is required for Platform tests.");
       setActiveTab("details");
       return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("Authentication required. Please log in again.");
      }
      
      // Create a meaningful change description
      let changesDescription = "Updated test details";
      
      // Add more specifics about what changed
      const changesArray = [];
      if (originalTest) {
        if (testDetails.title !== originalTest.title) changesArray.push("title");
        if (testDetails.status !== originalTest.status) changesArray.push(`status to ${testDetails.status}`);
        if (selectedQuestions.length !== originalTest.questionCount) {
          changesArray.push(`questions (now ${selectedQuestions.length})`);
        }
      }
      
      if (changesArray.length > 0) {
        changesDescription = `Updated ${changesArray.join(", ")}`;
      }
      
      // Create request payload
      const payload = {
        ...testDetails,
        questions: selectedQuestions,
        changesDescription
      };
      
      // Use PUT for update
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${testId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();

      if (!response.ok) {
         console.error("API Error Response:", responseData);
         throw new Error(responseData.message || `Failed to update test: ${response.statusText}`);
      }
      
      toast.success("Test updated successfully!");
      
      // Update revision history and other metadata after successful update
      setRevisionHistory(responseData.data.revisionHistory || []);
      setLastModifiedBy(responseData.data.lastModifiedBy);
      setUpdatedAt(responseData.data.updatedAt);
      
      // Prevent multiple redirects
      if (!redirectInProgress.current) {
        redirectInProgress.current = true;
        // Short timeout to allow state updates to complete
        setTimeout(() => {
          router.push(`/admin/tests/view/${testId}`);
        }, 100);
      }

    } catch (err: any) {
        setError(err.message || "Failed to update test. Please try again.");
        toast.error(err.message || "Failed to update test.");
        console.error("Error updating test:", err);
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

  // Format date string for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract username from revision modifiedBy field with better error handling
  const getUsernameFromRevision = (revision: RevisionHistoryItem): string => {
    // Check if revision exists
    if (!revision) return "Unknown user";
    
    // Check if modifiedBy exists and is an object
    if (!revision.modifiedBy || typeof revision.modifiedBy !== 'object') {
      return "Unknown user";
    }
    
    // Check if username exists
    if (revision.modifiedBy.username) {
      return revision.modifiedBy.username;
    }
    
    // If we have an email but no username
    if (revision.modifiedBy.email) {
      // Return email without domain
      const emailParts = revision.modifiedBy.email.split('@');
      return emailParts[0] || "User";
    }
    
    // If we have an ID but no username/email
    if (revision.modifiedBy._id) {
      return "User data unavailable";
    }
    
    // Default case
    return "Unknown user";
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Card className="border-green-200">
          <CardHeader className="bg-green-50 border-b border-green-100">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Card className="border-green-200">
        <CardHeader className="bg-green-50 border-b border-green-100">
          <div className="flex justify-between items-center">
            <CardTitle className="text-green-800">Edit Test: {testDetails.title}</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push(`/admin/tests/view/${testId}`)}
                variant="outline" 
                className="border-gray-300"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTest} 
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>
          <CardDescription>
            Update test details, modify selected questions, and manage test settings
          </CardDescription>
          
          {/* Error message */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="details" className="flex gap-2 items-center">
              <Eye className="h-4 w-4" />
              Test Details
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex gap-2 items-center">
              <CheckCircle className="h-4 w-4" />
              Questions ({selectedQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="metadata" className="flex gap-2 items-center">
              <History className="h-4 w-4" />
              Metadata
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="p-6">
            <TestDetailsForm 
              testDetails={testDetails}
              onDetailChange={handleDetailChange}
              onNestedDetailChange={handleNestedDetailChange}
            />
          </TabsContent>
          
          <TabsContent value="questions" className="p-6">
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
              onSubmit={handleUpdateTest}
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
          </TabsContent>
          
          <TabsContent value="metadata" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Authorship Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created By</p>
                    <p className="text-sm">
                      {createdBy?.username || 
                        (createdBy?.email ? createdBy.email.split('@')[0] : "Unknown user")}
                      {createdBy?.email && <span className="text-gray-400 ml-1">({createdBy.email})</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Modified By</p>
                    <p className="text-sm">
                      {lastModifiedBy?.username || 
                        (lastModifiedBy?.email ? lastModifiedBy.email.split('@')[0] : "Unknown user")}
                      {lastModifiedBy?.email && <span className="text-gray-400 ml-1">({lastModifiedBy.email})</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created At</p>
                    <p className="text-sm">{formatDate(createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-sm">{formatDate(updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Test Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Times Attempted</p>
                          <p className="text-lg font-semibold">{analytics.timesAttempted}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                          <p className="text-lg font-semibold">{analytics.completionRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Average Score</p>
                          <p className="text-lg font-semibold">{analytics.averageScore.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Average Percentage</p>
                          <p className="text-lg font-semibold">{analytics.averagePercentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">
                      No analytics data available for this test yet
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <div className="flex items-center">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Revision History
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      {revisionHistory.length} revisions
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revisionHistory.length > 0 ? (
                    <ScrollArea className="h-60">
                      <div className="space-y-3">
                        {revisionHistory.map((revision, index) => (
                          <div key={revision._id || index} className="flex gap-2 pb-3 border-b border-gray-100">
                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xs">
                              {revision.version || index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium">
                                  {getUsernameFromRevision(revision)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(revision.timestamp)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {revision.changesDescription}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">
                      No revision history available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
