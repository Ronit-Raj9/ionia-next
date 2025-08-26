"use client";

import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { getQuestionStatistics } from '@/features/admin/api/questionApi';

interface QuestionStatisticsProps {
  questionId: string;
}

interface StatisticsData {
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  averageTime: number;
  averageScore: number;
  difficultyRating: number;
  successRate: number;
  timeDistribution: {
    fast: number;
    medium: number;
    slow: number;
  };
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

const QuestionStatistics: React.FC<QuestionStatisticsProps> = ({ questionId }) => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getQuestionStatistics(questionId);
        setStatistics(data);
      } catch (err) {
        console.error('Error fetching question statistics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchStatistics();
    }
  }, [questionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg inline-block">
          <p className="text-sm font-medium">Error loading statistics</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!statistics || statistics.totalAttempts === 0) {
    return (
      <div className="text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">No Statistics Available</p>
        <p className="text-sm text-gray-500">
          This question has not been attempted by any students yet.
        </p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Question Statistics</h2>
        <p className="text-sm text-gray-500">Performance metrics and student engagement data</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-blue-600">T</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Attempts</p>
              <p className="text-2xl font-bold text-blue-900">{statistics.totalAttempts}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-green-600">S</span>
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-900">{statistics.successRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-purple-600">T</span>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600">Avg. Time</p>
              <p className="text-2xl font-bold text-purple-900">{formatTime(statistics.averageTime)}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-orange-600">S</span>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-600">Avg. Score</p>
              <p className="text-2xl font-bold text-orange-900">{statistics.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attempt Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Attempt Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Correct Attempts</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${formatPercentage(statistics.correctAttempts, statistics.totalAttempts)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{statistics.correctAttempts}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Incorrect Attempts</span>
              <div className="flex items-center">
                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${formatPercentage(statistics.incorrectAttempts, statistics.totalAttempts)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{statistics.incorrectAttempts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Time Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fast (&lt; 60s)</span>
              <span className="text-sm font-medium text-gray-900">{statistics.timeDistribution.fast}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Medium (60-120s)</span>
              <span className="text-sm font-medium text-gray-900">{statistics.timeDistribution.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Slow (&gt; 120s)</span>
              <span className="text-sm font-medium text-gray-900">{statistics.timeDistribution.slow}</span>
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Score Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Excellent (90-100%)</span>
              <span className="text-sm font-medium text-gray-900">{statistics.scoreDistribution.excellent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Good (70-89%)</span>
              <span className="text-sm font-medium text-gray-900">{statistics.scoreDistribution.good}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average (50-69%)</span>
              <span className="text-sm font-medium text-gray-900">{statistics.scoreDistribution.average}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Poor (&lt; 50%)</span>
              <span className="text-sm font-medium text-gray-900">{statistics.scoreDistribution.poor}</span>
            </div>
          </div>
        </div>

        {/* Difficulty Rating */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Difficulty Rating</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">{statistics.difficultyRating}/10</div>
            <div className="flex justify-center">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full mx-1 ${
                    i < statistics.difficultyRating ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Based on student performance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionStatistics; 