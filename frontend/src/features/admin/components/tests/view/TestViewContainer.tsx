"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTestStore } from '../../../store/testStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { TestService } from '../../../services/testService';

interface Question {
  _id: string;
  question: {
    text: string;
    image?: { url?: string; publicId?: string };
  } | string;
  image?: { url?: string; publicId?: string };
  questionType?: 'single' | 'multiple' | 'numerical';
  options?: Array<{ text?: string; image?: { url?: string; publicId?: string } } | string>;
  correctOptions?: number[];
  correctOption?: number;
  marks: number;
  subject?: string;
  examType?: string;
  class?: string;
  difficulty?: string;
  year?: string;
  chapter?: string;
  section?: string;
  negativeMarks?: number;
  isVerified?: boolean;
  isActive?: boolean;
}

interface Test {
  _id: string;
  title: string;
  testCategory: 'PYQ' | 'Platform' | 'UserCustom'; 
  description?: string;
  instructions?: string;
  subject: string;
  examType: string;
  class: string;
  difficulty: string;
  status: 'draft' | 'published' | 'archived';
  duration: number;
  year?: number;
  questions: (Question | string)[];
  createdAt: string;
  updatedAt: string;
  attemptsAllowed?: number;
  solutionsVisibility?: string;
  tags?: string[];
  markingScheme?: {
    correct?: number;
    incorrect?: number;
    unattempted?: number;
  };
}

interface TestViewContainerProps {
  children: (props: TestViewContextProps) => React.ReactNode;
}

export interface TestViewContextProps {
  // Test Data
  test: Test | null;
  testId: string;
  
  // Questions Data
  questionDetails: Record<string, Question>;
  
  // Loading States
  loading: boolean;
  fetchingQuestions: boolean;
  isDeleting: boolean;
  isUpdatingStatus: boolean;
  
  // Error States
  error: string | null;
  
  // UI States
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  showStatusDropdown: boolean;
  setShowStatusDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Actions
  handleDeleteTest: () => Promise<void>;
  handleUpdateStatus: (newStatus: 'draft' | 'published' | 'archived') => Promise<void>;
  retryLoadTest: () => void;
  retryLoadQuestions: () => void;
  
  // Refs
  statusDropdownRef: React.RefObject<HTMLDivElement>;
}

const TestViewContainer: React.FC<TestViewContainerProps> = ({ children }) => {
  const { id } = useParams();
  const router = useRouter();
  const { 
    selectedTest,
    loading,
    error,
    fetchTestById,
    deleteTest,
    updateTest,
    clearError,
    setShowDeleteModal,
    setSelectedTestId,
    setSelectedTest,
    showDeleteModal,
    isDeleting,
    isUpdating
  } = useTestStore();
  
  const { user, isAuthenticated } = useAuthStore();
  
  const [questionDetails, setQuestionDetails] = useState<Record<string, Question>>({});
  const [fetchingQuestions, setFetchingQuestions] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const testId = Array.isArray(id) ? id[0] : id as string;
  console.log('TestViewContainer: Extracted testId:', testId, 'from params:', id);
  console.log('TestViewContainer: Environment variables:', {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV
  });
  console.log('TestViewContainer: Auth state:', {
    isAuthenticated,
    user: user ? { id: user.id, email: user.email, role: user.role } : null
  });

  // Load test data
  useEffect(() => {
    console.log('TestViewContainer: useEffect triggered with testId:', testId);
    if (testId && isAuthenticated) {
      loadTestData();
    } else if (testId && !isAuthenticated) {
      console.log('TestViewContainer: User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [testId, isAuthenticated]);

  // Process question details when test is loaded
  useEffect(() => {
    if (selectedTest && selectedTest.questions && selectedTest.questions.length > 0) {
      processQuestionDetails();
    }
  }, [selectedTest]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadTestData = async () => {
    try {
      console.log('TestViewContainer: Loading test data for ID:', testId);
      
      // Use the service layer to fetch test with populated questions
      const testData = await TestService.getTestWithQuestions(testId);
      
      console.log('TestViewContainer: Test with questions response:', testData);
      
      // Update the store with the populated test data
      setSelectedTest(testData);
      
      console.log('TestViewContainer: Test data loaded successfully');
      toast.success("Test loaded successfully!");
    } catch (error: any) {
      console.error("TestViewContainer: Error fetching test details:", error);
      const errorMessage = error.message || "Failed to load test details. Please try again.";
      toast.error(errorMessage);
    }
  };

  const processQuestionDetails = () => {
    if (!selectedTest || !selectedTest.questions || selectedTest.questions.length === 0) return;
    
    console.log('TestViewContainer: Processing question details for test:', selectedTest._id);
    
    // Check if questions are already populated (objects instead of strings)
    const hasPopulatedQuestions = selectedTest.questions.some(q => typeof q === 'object');
    
    if (hasPopulatedQuestions) {
      console.log('TestViewContainer: Questions already populated, processing directly');
      const questionDetailsMap: Record<string, Question> = {};
      selectedTest.questions.forEach((question: any) => {
        if (typeof question === 'object' && question._id) {
          questionDetailsMap[question._id] = question;
        }
      });
      setQuestionDetails(questionDetailsMap);
      console.log('TestViewContainer: Processed', Object.keys(questionDetailsMap).length, 'questions');
    } else {
      console.log('TestViewContainer: Questions are not populated, this should not happen with the new endpoint');
      // This should not happen with the new endpoint, but keeping as fallback
      setQuestionDetails({});
    }
  };

  const handleDeleteTest = async () => {
    if (!selectedTest) return;
    
    try {
      setSelectedTestId(testId);
      setShowDeleteModal(true);
      await deleteTest(testId);
      toast.success("Test deleted successfully!");
      router.push('/admin/tests');
    } catch (error: any) {
      console.error("Error deleting test:", error);
      toast.error(error.message || "Failed to delete test");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'draft' | 'published' | 'archived') => {
    if (!selectedTest || selectedTest.status === newStatus) return;
    
    try {
      await updateTest(selectedTest._id, {
        status: newStatus,
        changesDescription: `Status changed from ${selectedTest.status} to ${newStatus}`
      });
      toast.success(`Test status updated to ${newStatus}`);
      setShowStatusDropdown(false);
    } catch (error: any) {
      console.error("Error updating test status:", error);
      toast.error(error.message || "Failed to update test status");
    }
  };

  const retryLoadTest = () => {
    clearError();
    loadTestData();
  };

  const retryLoadQuestions = () => {
    if (selectedTest) {
      processQuestionDetails();
    }
  };

  const contextProps: TestViewContextProps = {
    test: selectedTest,
    testId,
    questionDetails,
    loading,
    fetchingQuestions,
    isDeleting,
    isUpdatingStatus: isUpdating,
    error,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showStatusDropdown,
    setShowStatusDropdown,
    handleDeleteTest,
    handleUpdateStatus,
    retryLoadTest,
    retryLoadQuestions,
    statusDropdownRef,
  };

  return <>{children(contextProps)}</>;
};

export default TestViewContainer;