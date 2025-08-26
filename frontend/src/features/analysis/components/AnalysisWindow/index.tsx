"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ClipLoader } from 'react-spinners';

import { useAnalysisStore } from '@/features/analysis/store/analysisStore';
import { useAnalysisData } from '@/features/analysis/hooks/useAnalysisData';
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
import QualityTimeSpent from './QualityTimeSpent';
import SubjectWiseTime from './SubjectWiseTime';

interface AnalysisWindowProps {
  examType: string;
  paperId: string;
  subject?: string;
  attemptId?: string;
}

const AnalysisWindow: React.FC<AnalysisWindowProps> = ({ 
  examType, 
  paperId, 
  subject,
  attemptId 
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overall');
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(attemptId || null);
  const [attemptsData, setAttemptsData] = useState<{id: string, number: number}[]>([]);
  
  // Use the analysis store and custom hook
  const { 
    analysisData, 
    isLoading, 
    error, 
    isInitialized,
    refetch 
  } = useAnalysisData({ 
    attemptId: currentAttemptId || undefined, 
    paperId 
  });

  const {
    setSelectedSubject,
    setSelectedView,
    setShowRecommendations,
    clearAnalysis
  } = useAnalysisStore();

  // Process and enhance analysis data
  const processAnalysisData = (data: any) => {
    if (!data) return null;

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
      },
      errorAnalytics: data?.errorAnalytics || {
        commonMistakes: [],
        errorPatterns: {
          conceptualErrors: [],
          calculationErrors: [],
          timeManagementErrors: [],
          carelessMistakes: []
        }
      },
      behavioralAnalytics: data?.behavioralAnalytics || {
        revisitPatterns: [],
        sectionTransitions: [],
        confidenceMetrics: {
          quickAnswers: [],
          longDeliberations: [],
          multipleRevisions: []
        }
      },
      navigationHistory: data?.navigationHistory || []
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
      }
      
      // Calculate score based on marking scheme
      const correctScore = correctAnswers * markingScheme.correct;
      const incorrectScore = wrongAnswers * markingScheme.incorrect;
      const unattemptedScore = unattemptedAnswers * markingScheme.unattempted;
      const totalScore = correctScore + incorrectScore + unattemptedScore;
      
      // Update the performance data
      processedData.performance.totalCorrectAnswers = correctAnswers;
      processedData.performance.totalWrongAnswers = wrongAnswers;
      processedData.performance.totalUnattempted = unattemptedAnswers;
      processedData.performance.totalQuestions = totalQuestions;
      processedData.performance.score = totalScore;
      
      // Recalculate accuracy
      const attemptedAnswers = correctAnswers + wrongAnswers;
      if (attemptedAnswers > 0) {
        processedData.performance.accuracy = (correctAnswers / attemptedAnswers) * 100;
      }
    }
    
    // DIRECT FIX: Ensure we have proper time data from totalTimeTaken
    if (data?.performance?.totalTimeTaken) {
      const rawTimeTaken = data.performance.totalTimeTaken;
      
      // CRITICAL FIX: API returns time in milliseconds, convert to seconds
      const convertedTimeTaken = rawTimeTaken > 100 ? rawTimeTaken / 1000 : rawTimeTaken;
      
      // Directly set the timeAnalytics values
      processedData.timeAnalytics.totalTimeSpent = convertedTimeTaken;
      
      // Calculate average time per question
      const totalQuestions = data.performance.totalQuestions || 
                             processedData.answers.length ||
                             data.metadata?.questions?.length || 1;
                             
      processedData.timeAnalytics.averageTimePerQuestion = convertedTimeTaken / totalQuestions;
      
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
            
          // Calculate accuracy for subject
          subjectData.accuracy = subjectData.attempted > 0 ? 
              subjectData.correct / subjectData.attempted : 0;
        });
      }
    }
    
    // Process subject wise time data
    if (processedData.subjectWise) {
      Object.keys(processedData.subjectWise).forEach(subject => {
        const subjectData = processedData.subjectWise[subject];
        
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
          } else {
            // If we have total time but no breakdown, estimate based on question ratio
            if (processedData.timeAnalytics.totalTimeSpent && subjectData.total && processedData.performance?.totalQuestions) {
              const subjectRatio = subjectData.total / processedData.performance.totalQuestions;
              subjectData.timeSpent = processedData.timeAnalytics.totalTimeSpent * subjectRatio;
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

  // Process the analysis data when it changes
  const processedAnalysisData = processAnalysisData(analysisData);

  // Handle attempt change
  const handleAttemptChange = (newAttemptId: string) => {
    console.log("Switching to attempt:", newAttemptId);
    setCurrentAttemptId(newAttemptId);
  };

  // Update attempts data when analysis data changes
  useEffect(() => {
    if (analysisData?.attempts && Array.isArray(analysisData.attempts)) {
      setAttemptsData(analysisData.attempts);
      
      // If this is our first load and no attempt ID is set, use the current attempt
      if (!currentAttemptId && analysisData.testInfo?.attemptId) {
        setCurrentAttemptId(analysisData.testInfo.attemptId);
      }
    }
  }, [analysisData, currentAttemptId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnalysis();
    };
  }, [clearAnalysis]);

  if (isLoading) {
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

  if (!processedAnalysisData || !isInitialized) {
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

  const subjects = Object.keys(processedAnalysisData?.subjectWise || {});

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
      case 'Error':
        return ErrorAnalysis;
      case 'Behavioral':
        return BehavioralAnalysis;
      default:
        return SubjectAnalysis;
    }
  };

  const ActiveComponent = getActiveComponent();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        testInfo={{
          ...processedAnalysisData?.testInfo || {},
          paperId: paperId,
          examType: examType,
          // Format attempts for the dropdown
          attempts: attemptsData.map(a => `Attempt ${a.number}`),
          // Pass the full attempts data for ID lookup
          attemptsList: attemptsData
        }} 
        onAttemptChange={handleAttemptChange}
      />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
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
              <button
                onClick={() => setActiveTab('Error')}
                className={`${
                  activeTab === 'Error'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Error Analysis
              </button>
              <button
                onClick={() => setActiveTab('Behavioral')}
                className={`${
                  activeTab === 'Behavioral'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Behavioral
              </button>
            </nav>
          </div>
          <div className="p-6">
            {(() => {
              switch (ActiveComponent) {
                case SubjectAnalysis:
                  return <SubjectAnalysis id={activeTab} subjectWise={processedAnalysisData.subjectWise} />;
                case PerformanceAnalysis:
                  return <PerformanceAnalysis data={processedAnalysisData} />;
                case StrategyAnalysis:
                  return <StrategyAnalysis completionMetrics={processedAnalysisData?.completionMetrics || processedAnalysisData?.strategyMetrics || {}} />;
                case QuestionAnalysis:
                  return <QuestionAnalysis id={activeTab} />;
                case QualityTimeSpent:
                  return <QualityTimeSpent />;
                case SubjectWiseTime:
                  return <SubjectWiseTime />;
                case ErrorAnalysis:
                  return <ErrorAnalysis data={processedAnalysisData} />;
                case BehavioralAnalysis:
                  return <BehavioralAnalysis data={processedAnalysisData} />;
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

export default AnalysisWindow;
