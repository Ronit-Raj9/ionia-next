"use client";
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        console.log("🔍 Fetching analysis for:", { paperId });
        console.log("🌐 API URL:", `${process.env.NEXT_PUBLIC_API_URL}/attempted-tests/analysis?paperId=${paperId}`);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/attempted-tests/analysis?paperId=${paperId}`,
          {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        console.log("📡 Response status:", response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("❌ API error response:", errorData);
          throw new Error(errorData.message || 'Failed to fetch analysis');
        }

        const data = await response.json();
        console.log("📊 Raw API response:", data);
        
        // Ensure all required properties exist to prevent runtime errors
        const processedData = {
          testInfo: data.data?.testInfo || {},
          performance: data.data?.performance || {
            totalQuestions: 0,
            totalCorrectAnswers: 0,
            totalWrongAnswers: 0,
            totalVisitedQuestions: 0,
            accuracy: 0
          },
          answers: data.data?.answers || [],
          metadata: data.data?.metadata || {
            questions: []
          },
          subjectWise: data.data?.subjectWise || {},
          // Add default values for other properties
          questionAnalytics: data.data?.questionAnalytics || {},
          timeAnalytics: data.data?.timeAnalytics || {
            totalTimeSpent: 0,
            averageTimePerQuestion: 0,
            questionTimeDistribution: {
              lessThan30Sec: [],
              between30To60Sec: [],
              between1To2Min: [],
              moreThan2Min: []
            },
            peakPerformancePeriods: [],
            fatiguePeriods: []
          },
          errorAnalytics: data.data?.errorAnalytics || {
            commonMistakes: [],
            errorPatterns: {
              conceptualErrors: [],
              calculationErrors: [],
              timeManagementErrors: [],
              carelessMistakes: []
            }
          },
          behavioralAnalytics: data.data?.behavioralAnalytics || {
            revisitPatterns: [],
            sectionTransitions: [],
            confidenceMetrics: {
              quickAnswers: [],
              longDeliberations: [],
              multipleRevisions: []
            }
          },
          navigationHistory: data.data?.navigationHistory || [],
          progressionMetrics: data.data?.progressionMetrics || {
            accuracyTrend: [],
            speedTrend: [],
            subjectProgression: {}
          },
          strategyMetrics: data.data?.strategyMetrics || {
            questionSequencing: {
              optimalChoices: 0,
              backtracking: 0,
              subjectSwitching: 0
            },
            timeOptimization: {
              timeWastedOnIncorrect: 0,
              timeSpentOnCorrect: 0,
              unusedTime: 0
            },
            markingStrategy: {
              correctlyMarkedReview: 0,
              unnecessaryReviews: 0,
              effectiveRevisions: 0
            }
          },
          difficultyMetrics: data.data?.difficultyMetrics || {
            perceivedDifficulty: {},
            difficultyDistribution: {
              easy: [],
              medium: [],
              hard: [],
              veryHard: []
            }
          },
          completionMetrics: data.data?.completionMetrics || {
            paceAnalysis: {
              plannedPace: 0,
              actualPace: 0,
              paceVariation: []
            },
            sectionCompletion: {},
            timeManagementScore: 0
          }
        };
        
        console.log("🔄 Processed analysis data:", processedData);
        console.log("ℹ️ Test info:", processedData.testInfo);
        console.log("📈 Performance data:", processedData.performance);
        console.log("📊 Subject data:", processedData.subjectWise);
        
        dispatch(setAnalysisData(processedData));
        setLocalAnalysisData(processedData);
      } catch (err) {
        console.error("❌ Error fetching analysis:", err);
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analysis';
        const errorStack = err instanceof Error ? err.stack : '';
        
        console.error("🔍 Error details:", {
          message: errorMessage,
          stack: errorStack
        });
        
        dispatch(setError(errorMessage));
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (paperId) {
      fetchAnalysis();
    } else {
      console.warn("⚠️ No paperId provided for analysis fetch");
    }
  }, [dispatch, paperId]);

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
            onClick={() => router.push(`/exam/${examType}/previous-year-paper/${paperId}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Return to Test
          </button>
        </div>
      </div>
    );
  }

  if (!testInfo) {
    return null;
  }

  const subjects = Object.keys(analysisData?.subjectWise || {});

  const getActiveComponent = () => {
    switch (activeTab) {
      case 'Performance':
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
      <Header testInfo={analysisData?.testInfo || {}} />
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
                  return <StrategyAnalysis completionMetrics={analysisData.progressionMetrics} />;
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
