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
import { setAnalysisData } from '@/redux/slices/analysisSlice';
import { toast } from 'react-hot-toast';
import { getCurrentUser } from '@/redux/slices/authSlice';
import type { Test } from '@/redux/slices/testSlice';

interface TestWindowProps {
  examType: string;
  paperId: string;
  subject?: string;
}

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

  // Fetch test data
  useEffect(() => {
    const loadTest = async () => {
      if (paperId) {
        setIsLoading(true);
        setError(null);
        
        try {
          console.log("🔍 Making request to fetch test:", paperId);
          // Log raw fetch response before Redux processing
          const rawResponse = await fetch(`/api/v1/tests/${paperId}/attempt`, {
            credentials: 'include'
          });
          console.log("📦 Raw API Response Status:", rawResponse.status);
          const rawData = await rawResponse.clone().json();
          console.log("📋 Raw API Response Data:", JSON.stringify(rawData, null, 2));
          
          // Continue with regular Redux fetch
          dispatch(fetchTest(paperId))
            .unwrap()
            .then((data) => {
              console.log("🧩 Redux processed test data structure:", Object.keys(data));
              if (data.questions && data.questions.length > 0) {
                console.log("🔢 First question keys:", Object.keys(data.questions[0]));
                console.log("📝 First question content:", JSON.stringify(data.questions[0], null, 2));
              }
              setTest(data as unknown as Test);
              // Start timer when test is loaded
              dispatch(startTest());
            })
            .catch((err) => {
              console.error("❌ Error in fetchTest Redux action:", err);
              setError(`Failed to load test: ${err.message || "Unknown error"}`);
            });
        } catch (error) {
          console.error("🚨 Raw fetch error:", error);
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
      console.log("Fetching user data...");
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

  // Logging function remains unchanged
  const logTestMetadata = useCallback(() => {
    if (!currentTest) return;

    const currentTime = Date.now();
    
    const stats = {
      totalQuestions: currentTest?.questions?.length || 0,
      answeredCount: currentTest?.questions?.filter(q => q?.userAnswer !== undefined)?.length || 0,
      markedCount: currentTest?.questions?.filter(q => q?.isMarked)?.length || 0,
      visitedCount: currentTest?.questions ? 
        (currentTest.questions.length - currentTest.questions.filter(q => !q.isVisited).length) : 0,
      timeSpent: currentTime && testStartTime ? (currentTime - testStartTime) : 0,
      currentQuestion: (activeQuestion !== undefined) ? activeQuestion + 1 : 1,
      currentQuestionState: {
        isAnswered: currentTest?.questions?.[activeQuestion]?.userAnswer !== undefined,
        isMarked: currentTest?.questions?.[activeQuestion]?.isMarked || false,
        timeSpent: timeTrackingState.questionTimes[activeQuestion]?.totalTime || 0,
        visits: questionVisits?.[activeQuestion] || 0,
      },
      navigationCount: navigationEvents.length,
      tabSwitches: tabSwitchCount,
      networkIssues: networkDisconnections.length,
      answerDistribution: currentTest?.questions?.reduce((acc, q) => {
        if (q?.userAnswer !== undefined) {
          acc[q.userAnswer] = (acc[q.userAnswer] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>) || {},
    };

    console.group('Test Metadata Update');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Test Statistics:', stats);
    console.log('Question Times:', timeTrackingState.questionTimes);
    console.log('Navigation History:', navigationEvents);
    console.groupEnd();
  }, [
    currentTest,
    activeQuestion,
    timeTrackingState.questionTimes,
    questionVisits,
    navigationEvents,
    tabSwitchCount,
    networkDisconnections,
    testStartTime
  ]);

  const handleNavigateToQuestion = (index: number) => {
    // This will automatically pause current question timer and start the new one
    dispatch(startQuestionTimer(index));
    
    // Then navigate to the question
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
  }, [dispatch, currentTest, activeQuestion, logTestMetadata, handleNavigateToQuestion]);
  
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
  }, [dispatch, activeQuestion, currentTest, logTestMetadata, handleNavigateToQuestion]);
  
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
  }, [dispatch, activeQuestion, currentTest, logTestMetadata, handleNavigateToQuestion]);
  
  const handleOptionChange = useCallback((questionIndex: number, answerIndex: number) => {
    dispatch(answerQuestion({ questionIndex, answerIndex }));
    logTestMetadata();
  }, [dispatch, logTestMetadata]);
  
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
  }, [dispatch, activeQuestion, currentTest, logTestMetadata]);
  
  const handleClear = useCallback(() => {
    dispatch(answerQuestion({ questionIndex: activeQuestion, answerIndex: undefined }));
  }, [dispatch, activeQuestion]);
  
  const handleSaveAndMark = useCallback(() => {
    if (currentTest?.questions[activeQuestion]?.userAnswer !== undefined) {
      dispatch(answerQuestion({ 
        questionIndex: activeQuestion, 
        answerIndex: currentTest.questions[activeQuestion].userAnswer,
        isMarked: true
      }));
    }
    
    if (currentTest && activeQuestion < currentTest.questions.length - 1) {
      dispatch(setActiveQuestion(activeQuestion + 1));
    }
    
    logTestMetadata();
  }, [dispatch, activeQuestion, currentTest, logTestMetadata]);
  
  const handleMarkForReview = useCallback(() => {
    dispatch(answerQuestion({
      questionIndex: activeQuestion,
      answerIndex: currentTest?.questions[activeQuestion]?.userAnswer,
      isMarked: true
    }));
    
    if (currentTest && activeQuestion < currentTest.questions.length - 1) {
      dispatch(setActiveQuestion(activeQuestion + 1));
    }
    
    logTestMetadata();
  }, [dispatch, activeQuestion, currentTest, logTestMetadata]);
  
  // Updated handleSubmit using currentTest data to derive analytics
  const handleSubmit = async () => {
    if (!isClient) return;
    setIsLoading(true);

    try {
      const currentTime = Date.now();
      const totalTimeTaken = currentTime - testStartTime;

      // Derive answered, visited, and marked question indices directly from currentTest
      const safeAnsweredQuestions = currentTest?.questions
        .map((q, index) => (q.userAnswer !== undefined ? index : -1))
        .filter(index => index !== -1) || [];
      const safeVisitedQuestions = currentTest?.questions
        .map((q, index) => (q.isVisited ? index : -1))
        .filter(index => index !== -1) || [];
      const safeMarkedForReview = currentTest?.questions
        .map((q, index) => (q.isMarked ? index : -1))
        .filter(index => index !== -1) || [];

      console.log("Answered Questions:", safeAnsweredQuestions);
      console.log("Visited Questions:", safeVisitedQuestions);
      console.log("Marked for Review:", safeMarkedForReview);

        
      const formattedAnswers = currentTest?.questions
      .map((q, index) => ({
        questionId: q._id,
        answerOptionIndex: q.userAnswer,
        timeSpent: timeTrackingState.questionTimes[index]?.totalTime || 0,
        index
      }))
      .filter(answer => answer.answerOptionIndex !== undefined)
      .map(({questionId, answerOptionIndex, timeSpent}) => ({
        questionId,
        answerOptionIndex,
        timeSpent
      })) || [];
    console.log("formattedAnswers", formattedAnswers);

      const mapToQuestionIds = (serialNumbers: number[] | Set<number>) => {
        const numbers = Array.isArray(serialNumbers)
          ? serialNumbers
          : Array.from(serialNumbers);
        return numbers.map(
          (serialNumber) =>
            currentTest?.questions[serialNumber]?._id || `question-${serialNumber}`
        );
      };

      // Convert navigation events to use question IDs instead of indices
      const processedNavigationHistory = navigationEvents.map(event => {
        const fromQuestionId = event.fromQuestion >= 0 && event.fromQuestion < (currentTest?.questions?.length || 0)
          ? currentTest?.questions[event.fromQuestion]?._id 
          : null;
          
        const toQuestionId = event.toQuestion >= 0 && event.toQuestion < (currentTest?.questions?.length || 0)
          ? currentTest?.questions[event.toQuestion]?._id 
          : null;
          
        return {
          timestamp: event.timestamp,
          fromQuestion: fromQuestionId,
          toQuestion: toQuestionId,
          action: event.action
        };
      });

      const payload = {
        testId: paperId,
        paperId: paperId,
        userId: getUserId(),
        attemptNumber: 1,
        language: language,
        startTime: testStartTime,
        endTime: Date.now(),
        answers: formattedAnswers,
        metadata: {
          totalQuestions: currentTest?.questions.length || 0,
          totalTimeTaken,
          answeredQuestions: mapToQuestionIds(safeAnsweredQuestions),
          visitedQuestions: mapToQuestionIds(safeVisitedQuestions),
          markedForReview: mapToQuestionIds(safeMarkedForReview),
          selectedLanguage: language || "en",
        },
        questionStates: {
          notVisited: mapToQuestionIds(
            Array.from({ length: currentTest?.questions?.length || 0 }, (_, i) => i)
              .filter(num => !safeVisitedQuestions.includes(num))
          ),
          notAnswered: mapToQuestionIds(
            safeVisitedQuestions.filter(num => !safeAnsweredQuestions.includes(num))
          ),
          answered: mapToQuestionIds(safeAnsweredQuestions),
          markedForReview: mapToQuestionIds(safeMarkedForReview),
          markedAndAnswered: mapToQuestionIds(
            safeMarkedForReview.filter(num => safeAnsweredQuestions.includes(num))
          ),
        },
        responses: Object.fromEntries(
          currentTest?.questions.map((q, index) => [
            q._id,
            {
              selectedOption: q.userAnswer,
              isMarked: q.isMarked || false,
              timeSpent: timeTrackingState.questionTimes[index]?.totalTime || 0,
              visits: questionVisits[index] || 0,
              firstVisitTime: 0, // Use appropriate logic if needed
              lastVisitTime: 0,  // Use appropriate logic if needed
            }
          ]) || []
        ),
        questionAnalytics: Object.fromEntries(
          currentTest?.questions.map((q, index) => [
            q._id,
            {
              changeHistory: [],
              hesitationTime: 0,
              revisionCount: questionVisits[index] || 0,
              timeBeforeMarking: 0,
            }
          ]) || []
        ),
        subjectAnalytics: Object.fromEntries(
          Array.from(new Set(currentTest?.questions.map(q => q.subject)))
            .map(subject => [
              subject,
              {
                accuracy: 0,
                averageTimePerQuestion: 0,
                questionsAttempted: 0,
                scoreObtained: 0,
                weakTopics: [],
                strongTopics: [],
                improvementAreas: [],
              }
            ])
        ),
        timeAnalytics: {
          totalTimeSpent: totalTimeTaken,
          averageTimePerQuestion: totalTimeTaken / (currentTest?.questions.length || 1),
          questionTimeDistribution: {
            lessThan30Sec: [],
            between30To60Sec: [],
            between1To2Min: [],
            moreThan2Min: [],
          },
          peakPerformancePeriods: [],
          fatiguePeriods: [],
        },
        navigationHistory: processedNavigationHistory,
        environment: {
          device: {
            userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "",
            screenResolution: typeof window !== "undefined" 
              ? `${window.screen.width}x${window.screen.height}` 
              : "1920x1080",
            deviceType: typeof window !== "undefined"
              ? /Mobile|Android|iPhone/i.test(window.navigator.userAgent)
                ? "mobile"
                : /iPad|Tablet/i.test(window.navigator.userAgent)
                  ? "tablet"
                  : "desktop"
              : "unknown",
          },
          session: {
            tabSwitches: tabSwitchCount,
            disconnections: networkDisconnections,
            browserRefreshes: pageReloads,
          },
        },
        strategyMetrics: {
          questionSequencing: {
            optimalChoices: 0,
            backtracking: navigationEvents.filter(e => e.action === "prev").length,
            subjectSwitching: 0,
          },
          timeOptimization: {
            timeWastedOnIncorrect: 0,
            timeSpentOnCorrect: 0,
            unusedTime: 0,
          },
          markingStrategy: {
            correctlyMarkedReview: 0,
            unnecessaryReviews: 0,
            effectiveRevisions: 0,
          },
        },
        completionMetrics: {
          paceAnalysis: {
            plannedPace: totalTimeTaken / (currentTest?.questions.length || 1),
            actualPace: 0,
            paceVariation: [],
          },
          sectionCompletion: {},
          timeManagementScore: 0,
        },
      };

      console.log("Submitting payload:", payload);

      // Use the same apiUrl for submission
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attempted-tests/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Backend response:", result);
        toast?.success("Test submitted successfully!");
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const route = `/exam/${examType || "general"}/previous-year-paper/${
            paperId
          }/analysis/`;
          console.log("Navigating to:", route);
          if (router && typeof router.push === "function") {
            await router.push(route);
          } else if (typeof window !== "undefined") {
            window.location.href = route;
          }
        } catch (routerError) {
          console.error("Navigation error:", routerError);
          if (typeof window !== "undefined") {
            window.location.href = `/exam/${examType || "general"}/previous-year-paper/${
              paperId
            }/analysis/`;
          }
        }
      } else {
        let errorMessage = "Failed to submit test";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
        }
        console.error("Error response:", errorMessage);
        toast?.error(`Submission failed: ${errorMessage}`);
      }
    } catch (err) {
      console.error("Error submitting data:", err);
      toast?.error("An error occurred while submitting the test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTimeEnd = useCallback(() => {
    dispatch(submitTest());
    router.push(`/exam/${examType}/previous-year-paper/${paperId}/analysis`);
  }, [dispatch, router, examType, paperId]);
  
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
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setNetworkDisconnections(prev => [
        ...prev,
        { startTime: Date.now(), endTime: 0 }
      ]);
    };

    const handleOnline = () => {
      setNetworkDisconnections(prev => {
        const lastDisconnection = prev[prev.length - 1];
        if (lastDisconnection && !lastDisconnection.endTime) {
          return [
            ...prev.slice(0, -1),
            { ...lastDisconnection, endTime: Date.now() }
          ];
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

  useEffect(() => {
    const handleBeforeUnload = () => {
      setPageReloads(prev => prev + 1);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Add this effect to handle test completion
  useEffect(() => {
    if (isTestCompleted) {
      dispatch(pauseQuestionTimer());
    }
  }, [isTestCompleted, dispatch]);
  
  // Add this effect for regular time updates
  useEffect(() => {
    if (isTestCompleted) {
      const timer = setInterval(() => {
        // Update the current question time every second
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
  
  // Add this effect to log time tracking data whenever it changes
  useEffect(() => {
    console.log('Time Tracking State:', timeTrackingState);
    console.log('Question Times:', timeTrackingState.questionTimes);
    console.log('Current Question Time:', 
      timeTrackingState.currentQuestionId !== null 
        ? timeTrackingState.questionTimes[timeTrackingState.currentQuestionId]?.totalTime || 0 
        : 'No active question'
    );
  }, [timeTrackingState]);
  
  // Data validity checks
  const isTestDataValid = React.useMemo(() => {
    if (!currentTest) return false;
    if (!Array.isArray(currentTest.questions)) return false;
    if (currentTest.questions.length === 0) return false;
    
    // Check that questions have the required fields
    return currentTest.questions.every(q => 
      q && 
      typeof q.question === 'string' && 
      Array.isArray(q.options) && 
      q.options.length > 0
    );
  }, [currentTest]);

  // If not client-side yet, return minimal content to prevent hydration issues
  if (!isClient) {
    return null;
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <ClipLoader size={50} color="#3B82F6" />
        <p className="mt-4 text-gray-700 text-lg">Loading test...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Error loading test</p>
          <p>{error}</p>
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <ClipLoader size={50} color="#3B82F6" />
      <p className="mt-4 text-gray-700 text-lg">Loading test...</p>
    </div>
  );
};

export default TestWindow;