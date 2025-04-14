"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks/hooks';
import { setAnalysisData, setLoading, setError } from '@/redux/slices/analysisSlice';
import { useRouter } from 'next/navigation';
import { ClipLoader } from 'react-spinners';
import Header from './Header';
import Summary from './Summary';
import QuestionAnalysis from './QuestionAnalysis';
import SubjectAnalysis from './SubjectAnalysis';
import Tabs from './Tabs';
import TimeAnalysis from './TimeAnalysis';
import ErrorAnalysis from './ErrorAnalysis';
import BehavioralAnalysis from './BehavioralAnalysis';
import PerformanceAnalysis from './PerformanceAnalysis';
import StrategyAnalysis from './StrategyAnalysis';
import { useAnalysis } from '@/context/AnalysisContext';
import QualityTimeSpent from './QualityTimeSpent';
import SubjectWiseTime from './SubjectWiseTime';

interface AnalysisWindowProps {
  examType: string;
  paperId: string;
  subject?: string;
}

const AnalysisWindow: React.FC<AnalysisWindowProps> = ({ examType, paperId, subject }) => {
  const dispatch = useAppDispatch();
  const { loading, error, testInfo } = useAppSelector((state) => state.analysis);
  const router = useRouter();
  const [analysisData, setLocalAnalysisData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Overall');
  const { analysisData: contextAnalysisData } = useAnalysis();
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [attemptsData, setAttemptsData] = useState<{id: string, number: number}[]>([]);
  const fetchRef = useRef<{[key: string]: boolean}>({});
  const isFetchingRef = useRef<boolean>(false);

  // Process and enhance analysis data
  const processAnalysisData = (data: any) => {
    // First ensure we have default data structure
    const processedData = {
      testInfo: data?.testInfo || {},
      performance: data?.performance || {
        totalQuestions: 0,
        totalCorrectAnswers: 0,
        totalWrongAnswers: 0,
        totalVisitedQuestions: 0,
        accuracy: 0
      },
      answers: data?.answers || [],
      metadata: data?.metadata || { questions: [] },
      subjectWise: data?.subjectWise || {},
      timeAnalytics: data?.timeAnalytics || {
        totalTimeSpent: 0,
        averageTimePerQuestion: 0,
      },
      strategyMetrics: data?.strategyMetrics || {
        questionSequencing: {
          optimalChoices: 0,
          backtracking: 0,
          subjectSwitching: 0
        },
        timeManagement: {
          averageTimePerQuestion: 0,
          timeDistribution: {
            quick: 0.33,
            moderate: 0.33,
            lengthy: 0.34
          }
        }
      },
      completionMetrics: data?.completionMetrics || {
        sectionCompletion: {},
        timeManagementScore: 0
      }
    };
    
    // Ensure marking scheme data is present
    if (!processedData.testInfo.markingScheme) {
      console.log("⚠️ No marking scheme found, using default");
      processedData.testInfo.markingScheme = {
        correct: data?.markingScheme?.correct || 5,
        incorrect: data?.markingScheme?.incorrect || 0,
        unattempted: data?.markingScheme?.unattempted || 0
      };
    }
    
    console.log("📝 Marking Scheme:", processedData.testInfo.markingScheme);
    
    // Make sure we have the correct performance data
    console.log("🔍 Raw API performance data:", data?.performance);
    
    // CRITICAL FIX: Calculate score based on marking scheme
    if (processedData.testInfo.markingScheme) {
      const markingScheme = processedData.testInfo.markingScheme;
      
      // Calculate correct answers and other metrics
      let correctAnswers = data?.performance?.totalCorrectAnswers || 0;
      let wrongAnswers = data?.performance?.totalWrongAnswers || 0;
      let unattemptedAnswers = data?.performance?.totalUnattempted || 0;
      let totalQuestions = data?.performance?.totalQuestions || 0;
      
      // If these values aren't available, calculate them from answers
      if (Array.isArray(data?.answers) && data?.answers.length > 0) {
        correctAnswers = data.answers.filter((answer: any) => answer.isCorrect === true).length;
        const attemptedAnswers = data.answers.filter((answer: any) => 
          answer.selectedOption !== undefined && answer.selectedOption !== null
        ).length;
        wrongAnswers = attemptedAnswers - correctAnswers;
        totalQuestions = data?.metadata?.questions?.length || data.answers.length;
        unattemptedAnswers = totalQuestions - attemptedAnswers;
        
        console.log("🔢 Calculated metrics from answers:", {
          correctAnswers,
          wrongAnswers,
          attemptedAnswers,
          totalQuestions,
          unattemptedAnswers
        });
      }
      
      // Calculate score based on marking scheme
      const correctScore = correctAnswers * markingScheme.correct;
      const incorrectScore = wrongAnswers * markingScheme.incorrect;
      const unattemptedScore = unattemptedAnswers * markingScheme.unattempted;
      const totalScore = correctScore + incorrectScore + unattemptedScore;
      
      console.log("🧮 Score calculation:", {
        correctScore,
        incorrectScore,
        unattemptedScore,
        totalScore,
        markingScheme
      });
      
      // Update the performance data
      processedData.performance.totalCorrectAnswers = correctAnswers;
      processedData.performance.totalWrongAnswers = wrongAnswers;
      processedData.performance.totalUnattempted = unattemptedAnswers;
      processedData.performance.totalQuestions = totalQuestions;
      
      // Set score from our calculation based on marking scheme
      processedData.performance.score = totalScore;
      
      // Recalculate accuracy
      const attemptedAnswers = correctAnswers + wrongAnswers;
      if (attemptedAnswers > 0) {
        processedData.performance.accuracy = (correctAnswers / attemptedAnswers) * 100;
      }
      
      // Log the fixed performance data
      console.log("🛠️ Fixed performance data with score:", processedData.performance);
    }
    
    // DIRECT FIX: Ensure we have proper time data from totalTimeTaken
    console.log("⏱️ DIRECT TIME FIX applied");
    
    // If totalTimeTaken is available in the performance data, use it as our source of truth
    if (data?.performance?.totalTimeTaken) {
      const rawTimeTaken = data.performance.totalTimeTaken;
      console.log("⏱️ Raw totalTimeTaken from API:", rawTimeTaken);
      console.log("⏱️ Raw performance data:", data.performance);
      
      // CRITICAL FIX: API returns time in milliseconds, convert to seconds
      // ALWAYS convert values > 100 to seconds
      const convertedTimeTaken = rawTimeTaken > 100 ? rawTimeTaken / 1000 : rawTimeTaken;
      
      console.log("⏱️ Converted totalTimeTaken to seconds:", convertedTimeTaken);
      
      // Directly set the timeAnalytics values
      processedData.timeAnalytics.totalTimeSpent = convertedTimeTaken;
      
      // Calculate average time per question
      const totalQuestions = data.performance.totalQuestions || 
                             processedData.answers.length ||
                             data.metadata?.questions?.length || 1;
                             
      processedData.timeAnalytics.averageTimePerQuestion = convertedTimeTaken / totalQuestions;
      
      console.log("⏱️ Set timeAnalytics values:", {
        totalTimeSpent: processedData.timeAnalytics.totalTimeSpent,
        averageTimePerQuestion: processedData.timeAnalytics.averageTimePerQuestion,
        questionCount: totalQuestions
      });
      
      // Now distribute this time across subjects based on their question counts
      if (processedData.subjectWise && Object.keys(processedData.subjectWise).length > 0) {
        const totalSubjectQuestions = Object.values(processedData.subjectWise).reduce(
          (sum: number, subject: any) => sum + (subject.total || 0), 0
        );
        
        // Distribute time proportionally
        Object.keys(processedData.subjectWise).forEach(subject => {
          const subjectData = processedData.subjectWise[subject];
          const questionRatio = (subjectData.total || 0) / totalSubjectQuestions;
          
          // Assign time based on question ratio
          subjectData.timeSpent = convertedTimeTaken * questionRatio;
          subjectData.averageTimePerQuestion = subjectData.attempted > 0 ? 
            subjectData.timeSpent / subjectData.attempted : 0;
            
          console.log(`⏱️ Set time for subject ${subject}:`, {
            timeSpent: subjectData.timeSpent,
            averageTimePerQuestion: subjectData.averageTimePerQuestion,
            questionRatio
          });
        });
      }
    } else {
      // Fallback to original time calculation logic
      // ... existing time calculation code ...
      
      // Calculate total time spent
      let totalTimeSpent = processedData.answers.reduce(
        (sum: number, answer: any) => sum + (Number(answer.timeSpent) || 0), 
        0
      );
      
      console.log("Original totalTimeSpent:", totalTimeSpent);
      
      // Check if the value makes sense
      if (totalTimeSpent <= 0) {
        // Use a reasonable default based on 30 seconds per question
        const totalQuestions = processedData.performance.totalQuestions || 
                               processedData.answers.length || 10;
        totalTimeSpent = totalQuestions * 30; // 30 seconds per question default
        console.log("⚠️ Using default time estimate:", totalTimeSpent);
      }
      
      // Update time analytics with this value
      processedData.timeAnalytics.totalTimeSpent = totalTimeSpent;
      processedData.timeAnalytics.averageTimePerQuestion = 
        processedData.answers.length > 0 ? totalTimeSpent / processedData.answers.length : 
        (processedData.performance?.totalQuestions ? totalTimeSpent / processedData.performance.totalQuestions : 30);
      
      console.log("Final timeAnalytics from fallback:", processedData.timeAnalytics);
    }
    
    // Process subject wise time data
    if (processedData.subjectWise) {
      Object.keys(processedData.subjectWise).forEach(subject => {
        const subjectData = processedData.subjectWise[subject];
        console.log(`Processing subject ${subject} data:`, subjectData);
        
        // Ensure timeSpent is present and is a number
        if (!subjectData.timeSpent) {
          // Try to calculate from answers if not present
          if (processedData.answers && processedData.answers.length > 0) {
            // Get answers for this subject
            const subjectAnswers = processedData.answers.filter((a: any) => {
              const questionId = a.questionId?.toString();
              const question = processedData.metadata?.questions?.find(
                (q: any) => q.id?.toString() === questionId
              );
              return question && question.subject === subject;
            });
            
            // Calculate time spent
            subjectData.timeSpent = subjectAnswers.reduce(
              (sum: number, answer: any) => sum + (Number(answer.timeSpent) || 0), 
              0
            );
            
            console.log(`Calculated timeSpent for ${subject}:`, subjectData.timeSpent);
          } else {
            // If we have total time but no breakdown, estimate based on question ratio
            if (processedData.timeAnalytics.totalTimeSpent && subjectData.total && processedData.performance?.totalQuestions) {
              const subjectRatio = subjectData.total / processedData.performance.totalQuestions;
              subjectData.timeSpent = processedData.timeAnalytics.totalTimeSpent * subjectRatio;
              console.log(`Estimated timeSpent for ${subject} based on question ratio:`, subjectData.timeSpent);
            } else {
              subjectData.timeSpent = 0;
            }
          }
        }
        
        // Calculate average time per question for this subject
        subjectData.averageTimePerQuestion = 
          subjectData.attempted > 0 ? 
          subjectData.timeSpent / subjectData.attempted : 0;
      });
    }
    
    // Add section completion data from subjects if not present
    if (!processedData.completionMetrics.sectionCompletion || 
        Object.keys(processedData.completionMetrics.sectionCompletion).length === 0) {
      
      processedData.completionMetrics.sectionCompletion = {};
      
      Object.keys(processedData.subjectWise).forEach(subject => {
        const subjectData = processedData.subjectWise[subject];
        
        if (subjectData && typeof subjectData === 'object') {
          processedData.completionMetrics.sectionCompletion[subject] = {
            completionRate: subjectData.total > 0 ? 
              subjectData.attempted / subjectData.total : 0,
            timeUtilization: 0.75, // Default value
            efficiency: subjectData.attempted > 0 ? 
              subjectData.correct / subjectData.attempted : 0
          };
        }
      });
    }
    
    return processedData;
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      // Create a unique key for this fetch
      const fetchKey = `${paperId}-${currentAttemptId}`;
      
      // Skip if we've already fetched this combination or if a fetch is in progress
      if (fetchRef.current[fetchKey] || isFetchingRef.current) {
        return;
      }
      
      // Mark this fetch as in progress
      isFetchingRef.current = true;
      fetchRef.current[fetchKey] = true;

      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        // Look for the attemptId in local storage in case it was redirected from test submission
        const storedAttemptId = localStorage.getItem('currentAttemptId');
        
        // Determine which attempt ID to use
        const attemptIdToUse = currentAttemptId || storedAttemptId;
        
        // Build the URL with both parameters if available
        const queryParams = new URLSearchParams();
        queryParams.append('paperId', paperId);
        if (attemptIdToUse) {
          queryParams.append('attemptId', attemptIdToUse);
        }
        
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/attempted-tests/analysis?${queryParams.toString()}`;

        const response = await fetch(
          apiUrl,
          {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch analysis');
        }

        const data = await response.json();
        
        // If we have attempts in the response data, save them
        if (data.data?.attempts && Array.isArray(data.data.attempts)) {
          setAttemptsData(data.data.attempts);
          
          // If this is our first load and no attempt ID is set, use the current attempt
          if (!currentAttemptId && data.data.testInfo?.attemptId) {
            setCurrentAttemptId(data.data.testInfo.attemptId);
          }
        }
        
        const processedData = processAnalysisData(data.data);
        
        dispatch(setAnalysisData(processedData));
        setLocalAnalysisData(processedData);
      } catch (err) {
        console.error("Error fetching analysis:", err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analysis';
        dispatch(setError(errorMessage));
      } finally {
        dispatch(setLoading(false));
        isFetchingRef.current = false;
      }
    };

    if (paperId) {
      fetchAnalysis();
    }
  }, [dispatch, paperId, currentAttemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <ClipLoader size={50} color="#3B82F6" />
          <p className="mt-4 text-gray-700">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-700 font-medium text-lg mb-2">Error loading analysis</div>
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => router.push(`/exam/${examType}/mock-test/${paperId}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Return to Test
          </button>
        </div>
      </div>
    );
  }

  if (!testInfo || (!analysisData && !contextAnalysisData)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-50 p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-yellow-700 font-medium text-lg mb-2">No test data found</div>
          <div className="text-yellow-600 mb-4">
            We couldn't find any test data for this paper. You may need to attempt the test first.
          </div>
          <button 
            onClick={() => router.push(`/exam/${examType}/mock-test/${paperId}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Go to Test
          </button>
        </div>
      </div>
    );
  }

  const subjects = Object.keys(analysisData?.subjectWise || {});

  const getActiveComponent = () => {
    switch (activeTab) {
      case 'Performance':
        return PerformanceAnalysis;
      case 'Overall':
        return PerformanceAnalysis;
      case 'Strategy':
        return StrategyAnalysis;
      case 'Questions':
        return QuestionAnalysis;
      case 'Time':
        return QualityTimeSpent;
      case 'SubjectTime':
        return SubjectWiseTime;
      default:
        return SubjectAnalysis;
    }
  };

  const ActiveComponent = getActiveComponent();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        testInfo={{
          ...analysisData?.testInfo || {},
          paperId: paperId,
          examType: examType,
          // Format attempts for the dropdown
          attempts: attemptsData.map(a => `Attempt ${a.number}`),
          // Pass the full attempts data for ID lookup
          attemptsList: attemptsData
        }} 
        onAttemptChange={(attemptId) => {
          console.log("Switching to attempt:", attemptId);
          setCurrentAttemptId(attemptId);
        }}
      />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('Overall')}
                className={`${
                  activeTab === 'Overall'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overall
              </button>
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setActiveTab(subject)}
                  className={`${
                    activeTab === subject
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {subject}
                </button>
              ))}
              <button
                onClick={() => setActiveTab('Performance')}
                className={`${
                  activeTab === 'Performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Performance
              </button>
              <button
                onClick={() => setActiveTab('Strategy')}
                className={`${
                  activeTab === 'Strategy'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Strategy
              </button>
              <button
                onClick={() => setActiveTab('Questions')}
                className={`${
                  activeTab === 'Questions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Questions
              </button>
              <button
                onClick={() => setActiveTab('Time')}
                className={`${
                  activeTab === 'Time'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Time
              </button>
              <button
                onClick={() => setActiveTab('SubjectTime')}
                className={`${
                  activeTab === 'SubjectTime'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Subject Time
              </button>
            </nav>
          </div>
          <div className="p-6">
            {(() => {
              switch (ActiveComponent) {
                case SubjectAnalysis:
                  return <SubjectAnalysis id={activeTab} subjectWise={analysisData.subjectWise} />;
                case PerformanceAnalysis:
                  return <PerformanceAnalysis data={analysisData} />;
                case StrategyAnalysis:
                  return <StrategyAnalysis completionMetrics={analysisData?.progressionMetrics || analysisData?.strategyMetrics || {}} />;
                case QuestionAnalysis:
                  return <QuestionAnalysis id={activeTab} />;
                case QualityTimeSpent:
                  return <QualityTimeSpent />;
                case SubjectWiseTime:
                  return <SubjectWiseTime />;
                default:
                  return null;
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, color }: { title: string; value: string; color: string }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-lg p-6`}>
      <h3 className="text-sm font-medium opacity-75">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
};

const SubjectButton = ({ 
  subject, 
  isActive, 
  onClick 
}: { 
  subject: string; 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 rounded-full text-sm font-medium transition-all
      ${isActive 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
    `}
  >
    {subject}
  </button>
);

// Helper function to format time
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

export default AnalysisWindow;
