"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks/hooks';
import { 
  fetchTest, 
  setActiveQuestion, 
  answerQuestion,
  submitTest,
  markQuestionVisited,
  startTest,
  toggleMarkQuestion,
  completeTest,
  updateTimeRemaining
} from '@/redux/slices/testSlice';
import { RootState } from '@/redux/store';
import QuestionPanel from './QuestionPanel';
import QuestionGrid from './Navigation/QuestionGrid';
import QuestionStatus from './StatusPanel/QuestionStatus';
import Timer from './Header/Timer';
import CandidateInfo from './Header/CandidateInfo';
import ActionButtons from './Controls/ActionButtons';
import LanguageSelector from './Controls/LanguageSelector';
import { ClipLoader } from 'react-spinners';
import { startQuestionTimer, pauseQuestionTimer, resetTimeTracking, updateQuestionTime } from '@/redux/slices/timeTrackingSlice';
import { setAnalysisData, setLoading as setAnalysisLoading } from '@/redux/slices/analysisSlice';
import { toast } from 'react-hot-toast';
import { getCurrentUser } from '@/redux/slices/authSlice';
import type { Test } from '@/redux/slices/testSlice';

interface TestWindowProps {
  examType: string;
  paperId: string;
  subject?: string;
}

// Define the types based on the new test data structure
interface QuestionOption {
  text: string;
  image?: {
    url: string;
    publicId: string;
  };
}

interface QuestionContent {
  text: string;
  image?: {
    url: string;
    publicId: string;
  };
}

interface Question {
  _id: string;
  question: QuestionContent | string;
  options: QuestionOption[];
  subject: string;
  examType: string;
  difficulty: string;
  isMarked: boolean;
  timeTaken: number;
  isVisited: boolean;
  userAnswer?: number;
}

// Function to fetch analysis data - add this after imports and before component definition
export const fetchTestAnalysis = async (attemptId: string) => {
  try {
    // The controller expects attemptId as a query parameter
    const queryParams = new URLSearchParams();
    if (attemptId) {
      queryParams.append('attemptId', attemptId);
    }
    
    // Get paperId from localStorage if available (as a fallback)
    const paperId = localStorage.getItem('lastSubmittedPaperId');
    if (paperId) {
      queryParams.append('paperId', paperId);
    }
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/attempted-tests/analysis?${queryParams.toString()}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analysis: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching test analysis:', error);
    throw error;
  }
};

const TestWindow: React.FC<TestWindowProps> = ({ examType, paperId, subject }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Get test state from Redux
  const { 
    currentTest, 
    activeQuestion, 
    timeRemaining, 
    loading, 
    error: reduxError,
    isTestCompleted
  } = useAppSelector((state: RootState) => state.test);

  // Get user state from Redux
  const { user, loading: userLoading } = useAppSelector((state: RootState) => state.auth);
  
  // Get time tracking state
  const timeTrackingState = useAppSelector((state: RootState) => state.timeTracking);
  
  // Local state
  const [language, setLanguage] = useState('English');
  const [questionVisits, setQuestionVisits] = useState<number[]>([]);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testStartTime] = useState(Date.now());
  const [firstVisitTimes, setFirstVisitTimes] = useState<Record<string, number>>({});
  const [lastVisitTimes, setLastVisitTimes] = useState<Record<string, number>>({});
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [networkDisconnections, setNetworkDisconnections] = useState<Array<{startTime: number, endTime: number}>>([]);
  const [pageReloads, setPageReloads] = useState(0);
  const [navigationEvents, setNavigationEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<Test | null>(null);

  // Initialize them when test data loads
  useEffect(() => {
    if (currentTest?.questions?.length) {
      setQuestionVisits(new Array(currentTest.questions.length).fill(0));
    }
  }, [currentTest]);

  // Start tracking time when the test starts
  useEffect(() => {
    if (currentTest && activeQuestion >= 0) {
      dispatch(startQuestionTimer(activeQuestion));
    }
    
    return () => {
      // Pause the timer when component unmounts
      dispatch(pauseQuestionTimer());
    };
  }, [dispatch, currentTest, activeQuestion]);

  // Reset time tracking when test starts
  useEffect(() => {
    if (currentTest) {
      dispatch(resetTimeTracking());
    }
  }, [dispatch, currentTest]);

  // Ensure we're running on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simplified test data fetching
  useEffect(() => {
    const loadTest = async () => {
      if (paperId) {
        setIsLoading(true);
        setError(null);
        
        try {
          const apiUrl = `/tests/${paperId}`;
          console.log("📌 Attempting to fetch test data for ID:", paperId);
          
          const token = localStorage.getItem('accessToken');
          const headers: HeadersInit = {
            'Accept': 'application/json'
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch(apiUrl, {
            credentials: 'include',
            headers
          });
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("📋 Test data fetched successfully");
          
          // Use the data directly instead of dispatching to Redux
          if (data.data) {
            setTest(data.data);
            dispatch({ type: 'test/setTest', payload: data.data });
            dispatch(setActiveQuestion(0));
            dispatch(startTest());
          } else if (data) {
            setTest(data);
            dispatch({ type: 'test/setTest', payload: data });
            dispatch(setActiveQuestion(0));
            dispatch(startTest());
          }
        } catch (error) {
          console.error("🚨 Fetch error:", error);
          setError(`Failed to load test: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTest();
  }, [dispatch, paperId]);
  
  // Fetch user data if not already in the store
  useEffect(() => {
    if (isClient && !user && !userLoading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user, userLoading, isClient]);

  // Helper function to safely get user ID from potentially different user object structures
  const getUserId = useCallback(() => {
    if (user && 'id' in user) {
      return user.id;
    }
    if (user && '_id' in user) {
      return (user as any)._id;
    }
    if (user && typeof user === 'object' && 'data' in user) {
      const userData = user as { data?: { _id?: string; id?: string } };
      return userData.data?._id || userData.data?.id;
    }
    return null;
  }, [user]);

  // Helper function to safely get user name from potentially different user object structures
  const getUserName = useCallback((): string => {
    if (user && 'fullName' in user) {
      return user.fullName || 'Guest User';
    }
    if (user && typeof user === 'object' && 'data' in user) {
      const userData = user as { data?: { fullName?: string; name?: string } };
      return userData.data?.fullName || userData.data?.name || 'Guest User';
    }
    return 'Guest User';
  }, [user]);

  // Log test metadata (simplified)
  const logTestMetadata = useCallback(() => {
    if (!currentTest) return;
    console.log("Test metadata logging...");
  }, [currentTest]);

  const handleNavigateToQuestion = (index: number) => {
    dispatch(startQuestionTimer(index));
    dispatch(setActiveQuestion(index));
  };

  const handleQuestionClick = useCallback((questionIndex: number) => {
    setNavigationEvents(prev => [...prev, {
      timestamp: Date.now(),
      fromQuestion: activeQuestion,
      toQuestion: questionIndex,
      action: 'click'
    }]);
    
    if (currentTest && activeQuestion >= 0 && activeQuestion < currentTest.questions.length) {
      dispatch(answerQuestion({
        questionIndex: activeQuestion,
        answerIndex: currentTest.questions[activeQuestion].userAnswer,
        isVisited: true
      }));
    }
    
    dispatch(startQuestionTimer(questionIndex));
    handleNavigateToQuestion(questionIndex);
    
    logTestMetadata();
  }, [dispatch, currentTest, activeQuestion, logTestMetadata]);
  
  const handleNext = useCallback(() => {
    if (currentTest && activeQuestion < currentTest.questions.length - 1) {
      dispatch(answerQuestion({
        questionIndex: activeQuestion,
        answerIndex: currentTest.questions[activeQuestion].userAnswer,
        isVisited: true
      }));
      
      dispatch(startQuestionTimer(activeQuestion + 1));
      handleNavigateToQuestion(activeQuestion + 1);
      
      logTestMetadata();
    }
  }, [dispatch, activeQuestion, currentTest, logTestMetadata]);
  
  const handlePrevious = useCallback(() => {
    if (activeQuestion > 0) {
      if (currentTest) {
        dispatch(answerQuestion({
          questionIndex: activeQuestion,
          answerIndex: currentTest.questions[activeQuestion].userAnswer,
          isVisited: true
        }));
      }
      
      dispatch(startQuestionTimer(activeQuestion - 1));
      handleNavigateToQuestion(activeQuestion - 1);
      
      logTestMetadata();
    }
  }, [dispatch, activeQuestion, currentTest, logTestMetadata]);
  
  const handleOptionChange = useCallback((questionIndex: number, answerIndex: number) => {
    dispatch(answerQuestion({ questionIndex, answerIndex }));
    logTestMetadata();
  }, [dispatch, logTestMetadata]);
  
  // Simplified event handlers
  const handleSaveAndNext = useCallback(() => {
    if (currentTest?.questions[activeQuestion]?.userAnswer !== undefined) {
      dispatch(answerQuestion({ 
        questionIndex: activeQuestion, 
        answerIndex: currentTest.questions[activeQuestion].userAnswer,
      }));
    }
    
    if (currentTest && activeQuestion < currentTest.questions.length - 1) {
      dispatch(setActiveQuestion(activeQuestion + 1));
    }
  }, [dispatch, activeQuestion, currentTest]);
  
  const handleClear = useCallback(() => {
    dispatch(answerQuestion({ questionIndex: activeQuestion, answerIndex: undefined }));
  }, [dispatch, activeQuestion]);
  
  const handleMarkForReview = useCallback(() => {
    dispatch(toggleMarkQuestion(activeQuestion));
    logTestMetadata();
  }, [dispatch, activeQuestion, logTestMetadata]);
  
  // Simplified submit handler
  const handleSubmit = async () => {
    if (!isClient) return;
    setIsLoading(true);

    try {
      // Create submission payload
      const formattedAnswers = currentTest?.questions
        .map((q, index) => ({
          questionId: q._id,
          answerOptionIndex: q.userAnswer,
          timeSpent: timeTrackingState.questionTimes[index]?.totalTime || 0
        }))
        .filter(answer => answer.questionId) || [];

      // Create metadata about question states
      const questionStates = {
        notVisited: currentTest?.questions.filter(q => !q.isVisited).map(q => q._id) || [],
        notAnswered: currentTest?.questions.filter(q => q.isVisited && q.userAnswer === undefined).map(q => q._id) || [],
        answered: currentTest?.questions.filter(q => q.userAnswer !== undefined).map(q => q._id) || [],
        markedForReview: currentTest?.questions.filter(q => q.isMarked).map(q => q._id) || [],
        markedAndAnswered: currentTest?.questions.filter(q => q.isMarked && q.userAnswer !== undefined).map(q => q._id) || []
      };

      // Create navigation history from tracked events
      const formattedNavigationHistory = navigationEvents.map(event => {
        // Map custom actions to valid enum values from the schema
        let validAction = "visit";
        if (event.action === "click") validAction = "visit";
        // You can add more mappings if needed
        
        return {
          timestamp: event.timestamp,
          questionId: currentTest?.questions[event.toQuestion]?._id || null,
          action: validAction,
          timeSpent: timeTrackingState.questionTimes[event.fromQuestion]?.totalTime || 0
        };
      });

      // Create environment data
      const environmentData = {
        device: {
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          deviceType: window.innerWidth <= 768 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop'
        },
        session: {
          tabSwitches: tabSwitchCount,
          disconnections: networkDisconnections.map(d => ({
            startTime: d.startTime,
            endTime: d.endTime || Date.now(),
            duration: (d.endTime || Date.now()) - d.startTime
          })),
          browserRefreshes: pageReloads
        }
      };

      const testCompleteTime = Date.now();
      
      const payload = {
        testId: paperId,
        language: language,
        startTime: testStartTime,
        endTime: testCompleteTime,
        totalTimeTaken: testCompleteTime - testStartTime,
        answers: formattedAnswers,
        metadata: {
          totalQuestions: currentTest?.questions.length || 0,
          answeredQuestions: questionStates.answered,
          visitedQuestions: currentTest?.questions.filter(q => q.isVisited).map(q => q._id) || [],
          markedForReview: questionStates.markedForReview,
          selectedLanguage: language
        },
        questionStates,
        navigationHistory: formattedNavigationHistory,
        environment: environmentData
      };

      console.log("Submitting test with payload:", payload);
      
      // Submit test
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/attempted-tests/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit test");
      }

      const responseData = await response.json();
      toast?.success("Test submitted successfully!");
      
      // Store both attempt ID and test ID for analysis page
      if (responseData.data && responseData.data.attemptId) {
        localStorage.setItem('currentAttemptId', responseData.data.attemptId);
        localStorage.setItem('lastSubmittedPaperId', paperId);
        
        try {
          // Fetch the analysis data using the attemptId
          dispatch(setAnalysisLoading(true));
          const analysisData = await fetchTestAnalysis(responseData.data.attemptId);
          
          if (analysisData) {
            // Store in Redux for the analysis page to use
            dispatch(setAnalysisData(analysisData));
          }
        } catch (analysisError) {
          console.error("Error fetching analysis data:", analysisError);
          // Continue with redirection even if analysis fetch fails
        }
        
        // Redirect to analysis page without attempt ID
        router.push(`/exam/${examType || "general"}/mock-test/${paperId}/analysis`);
      } else {
        // Still store paperId even if no attemptId is returned
        localStorage.setItem('lastSubmittedPaperId', paperId);
        router.push(`/exam/${examType || "general"}/mock-test/${paperId}/analysis`);
      }
    } catch (err) {
      console.error("Error submitting test:", err);
      toast?.error(`An error occurred while submitting the test: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
      setConfirmSubmit(false);
    }
  };
  
  const handleTimeEnd = useCallback(() => {
    dispatch(submitTest());
    router.push(`/exam/${examType}/mock-test/${paperId}/analysis`);
  }, [dispatch, router, examType, paperId]);
  
  // Get test statistics
  const getTestStats = useCallback(() => {
    if (!currentTest) return { answered: 0, marked: 0, total: 0 };
    
    const total = currentTest.questions.length;
    let answered = 0;
    let marked = 0;
    
    currentTest.questions.forEach(q => {
      if (q.userAnswer !== undefined) answered++;
      if (q.isMarked) marked++;
    });
    
    return { answered, marked, total };
  }, [currentTest]);
  
  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track network connectivity
  useEffect(() => {
    const handleOffline = () => {
      setNetworkDisconnections(prev => [...prev, { startTime: Date.now(), endTime: 0 }]);
    };

    const handleOnline = () => {
      setNetworkDisconnections(prev => {
        const lastDisconnection = prev[prev.length - 1];
        if (lastDisconnection && !lastDisconnection.endTime) {
          return [...prev.slice(0, -1), { ...lastDisconnection, endTime: Date.now() }];
        }
        return prev;
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Track page reloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      setPageReloads(prev => prev + 1);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Handle test completion
  useEffect(() => {
    if (isTestCompleted) {
      dispatch(pauseQuestionTimer());
    }
  }, [isTestCompleted, dispatch]);
  
  // Update question time
  useEffect(() => {
    if (!isTestCompleted) {
      const timer = setInterval(() => {
        if (timeTrackingState.currentQuestionId !== null) {
          dispatch(updateQuestionTime({
            questionId: timeTrackingState.currentQuestionId,
            timeSpent: 1000 // 1 second in milliseconds
          }));
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isTestCompleted, timeTrackingState.currentQuestionId, dispatch]);

  // Updated data validity check for the new question format
  const isTestDataValid = React.useMemo(() => {
    if (!currentTest) return false;
    if (!Array.isArray(currentTest.questions)) return false;
    if (currentTest.questions.length === 0) return false;
    
    // Check that questions have the required fields for the new format
    return currentTest.questions.every(q => {
      if (!q) return false;
      
      // Handle both string questions and object questions
      const hasValidQuestion = typeof q.question === 'string' || 
                              (typeof q.question === 'object' && 
                               q.question && 
                               typeof q.question.text === 'string');
      
      // Check options
      const hasValidOptions = Array.isArray(q.options) && 
                             q.options.length > 0 &&
                             q.options.every(opt => 
                               typeof opt === 'string' || 
                               (typeof opt === 'object' && opt && typeof opt.text === 'string')
                             );
      
      return hasValidQuestion && hasValidOptions;
    });
  }, [currentTest]);

  // If not client-side yet, return minimal content to prevent hydration issues
  if (!isClient) {
    return null;
  }
  
  if (loading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <ClipLoader size={50} color="#3B82F6" />
        <p className="mt-4 text-gray-700 text-lg">Loading test...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">Test Data Error</h2>
          <p className="text-center text-gray-600 mb-6">We encountered an error while loading the test:</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-center">{error}</p>
          </div>
          <div className="flex justify-between">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Try again
            </button>
            <button 
              onClick={() => window.location.href = `/exam/${examType}`} 
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Return to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!currentTest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Test not found</p>
          <p>The requested test could not be loaded.</p>
          <button 
            onClick={() => router.push(`/exam/${examType}`)}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Return to Exams
          </button>
        </div>
      </div>
    );
  }
  
  if (!isTestDataValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Invalid test data</p>
          <p>The test data appears to be incomplete or malformed. Please try a different test.</p>
          <pre className="mt-2 text-xs bg-orange-50 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(currentTest, null, 2)}
          </pre>
          <button 
            onClick={() => router.push(`/exam/${examType}`)}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Return to Exams
          </button>
        </div>
      </div>
    );
  }

  const { total } = getTestStats();
  const currentQuestionData = currentTest.questions[activeQuestion];
  
  if (!currentQuestionData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Question not found</p>
          <p>The requested question (#{activeQuestion + 1}) could not be loaded.</p>
          <button
            onClick={() => dispatch(setActiveQuestion(0))}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Go to First Question
          </button>
          <button
            onClick={() => router.push(`/exam/${examType}`)}
            className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Return to Exams
          </button>
        </div>
      </div>
    );
  }

  // Extract question text properly handling both string and object formats
  const questionText = typeof currentQuestionData.question === 'string' 
    ? currentQuestionData.question 
    : currentQuestionData.question?.text || '';

  // Extract question image if available
  const questionImage = typeof currentQuestionData.question === 'object' && currentQuestionData.question?.image?.url
    ? currentQuestionData.question.image.url
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <div className="container mx-auto flex justify-between items-center">
          <CandidateInfo name={getUserName()} testName={currentTest.title} />
          <Timer 
            timeRemaining={timeRemaining} 
            onTimeEnd={handleTimeEnd} 
          />
        </div>
      </header>
      
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-3/4 bg-white p-4 overflow-auto">
          <div className="bg-gray-50 p-6 rounded-lg shadow mb-4">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Question {activeQuestion + 1}</h2>
              <LanguageSelector 
                selectedLanguage={language} 
                onLanguageChange={(lang: string) => setLanguage(lang)} 
              />
            </div>
            
            <div className="mb-6">
              <p className="text-gray-800 text-lg mb-2">{questionText}</p>
              {questionImage && (
                <img 
                  src={questionImage} 
                  alt="Question image" 
                  className="max-w-full h-auto my-3 rounded"
                />
              )}
            </div>
            
            <div className="space-y-3">
              {currentQuestionData.options.map((option, index) => {
                const optionText = typeof option === 'string' ? option : option.text;
                const optionImage = typeof option === 'object' && option.image?.url ? option.image.url : null;
                
                return (
                  <div 
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      currentQuestionData.userAnswer === index ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleOptionChange(activeQuestion, index)}
                  >
                    <div className="flex items-start">
                      <div className="rounded-full w-6 h-6 flex items-center justify-center border border-gray-400 mr-3">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="flex-1">
                        <p>{optionText}</p>
                        {optionImage && (
                          <img 
                            src={optionImage} 
                            alt={`Option ${String.fromCharCode(65 + index)} image`} 
                            className="max-w-full h-auto my-2 rounded"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <ActionButtons 
            onPrevious={handlePrevious}
            onNext={handleNext}
            onClear={handleClear}
            onMarkForReview={handleMarkForReview}
            onSaveAndNext={handleSaveAndNext}
            onSaveAndMark={() => {}} // Provide empty function for now
            onSubmit={() => setConfirmSubmit(true)}
            confirmSubmit={false}
            isLastQuestion={activeQuestion === total - 1}
            isFirstQuestion={activeQuestion === 0}
            hasSelectedOption={currentQuestionData.userAnswer !== undefined}
            isSubmitting={false}
          />
        </div>
        
        <div className="w-full md:w-1/4 bg-gray-200 p-4 overflow-auto">
          <QuestionStatus 
            questions={currentTest.questions}
            total={total}
          />
          
          <QuestionGrid 
            questions={currentTest.questions}
            activeQuestion={activeQuestion}
            onQuestionClick={handleQuestionClick}
          />
          
          <div className="mt-6">
            <button
              onClick={() => setConfirmSubmit(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>
      </main>
      
      {confirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-3">Confirm Submission</h3>
            <p className="mb-6">Are you sure you want to submit your test? You cannot change your answers after submission.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmSubmit(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestWindow;