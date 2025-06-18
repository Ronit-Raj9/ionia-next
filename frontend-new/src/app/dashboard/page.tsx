"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useTestResults } from "@/features/tests/store/testStore";
import { Card } from "@/features/dashboard/components/card";
import PerformanceChart, { PerformanceData } from "@/features/dashboard/components/PerformanceChart";
import SubjectPerformance, { SubjectData } from "@/features/dashboard/components/SubjectPerformance";
import { FiRefreshCw, FiAlertTriangle, FiActivity, FiCalendar, FiCheckCircle, FiTarget } from "react-icons/fi";
import { ClipLoader } from "react-spinners";

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { testHistory, fetchTestHistory } = useTestResults();

  // Memoize the fetch function to prevent infinite loops
  const loadTestHistory = useCallback(async () => {
    try {
      await fetchTestHistory();
    } catch (error) {
      console.error('Failed to fetch test history:', error);
    }
  }, [fetchTestHistory]);

  // Transform test history object into array for performance chart
  const performanceChartData = useMemo(() => {
    return Object.entries(testHistory).map(([testId, result]) => ({
      date: new Date(parseInt(testId)).toLocaleDateString(),
      score: result.score,
      accuracy: (result.correctAnswers / (result.correctAnswers + result.incorrectAnswers)) * 100
    })) as PerformanceData[];
  }, [testHistory]);

  // Create data for subject performance chart with mock subjects
  const subjectChartData = useMemo(() => {
    // Create an array of sample subjects since our TestResults doesn't include subjects
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    
    // Convert test history to array with mock subjects for the SubjectPerformance chart
    return Object.entries(testHistory).map(([testId, result], index) => ({
      subject: subjects[index % subjects.length], // Assign mock subjects in a cycle
      score: result.score,
      accuracy: (result.correctAnswers / (result.correctAnswers + result.incorrectAnswers)) * 100
    })) as SubjectData[];
  }, [testHistory]);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTestHistory();
    }
  }, [isAuthenticated, loadTestHistory]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ClipLoader color="#10B981" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate statistics
  const totalTests = Object.keys(testHistory).length;
  const averageScore = totalTests > 0
    ? Math.round(Object.values(testHistory).reduce((acc, test) => acc + test.score, 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...Object.values(testHistory).map(test => test.score))
    : 0;
  const lastTestDate = totalTests > 0
    ? new Date(Math.max(...Object.keys(testHistory).map(id => parseInt(id)))).toLocaleDateString()
    : 'Never';

  return (
    <div className="p-6 max-w-full">
      {/* Welcome Section */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Dashboard Overview
        </h1>
        <p className="text-base text-gray-600 mt-2">
          Track your test performance and progress
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tests Card */}
          <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <FiActivity className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-600">Total Tests</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-700">{totalTests}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Average Score Card */}
          <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <FiCheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-600">Average Score</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-700">{averageScore}%</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Best Score Card */}
          <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <FiTarget className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-600">Best Score</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-700">{bestScore}%</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Last Test Card */}
          <Card className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <FiCalendar className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-600">Last Test</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-700">{lastTestDate}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="px-6 pt-6 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Performance Trend</h3>
              <button
                onClick={() => fetchTestHistory()}
                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[300px] sm:h-[400px]">
              {performanceChartData.length > 0 ? (
                <PerformanceChart data={performanceChartData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No performance data available
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Subject Performance */}
        <Card>
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="px-6 pt-6 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Subject Performance</h3>
              <button
                onClick={() => fetchTestHistory()}
                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[300px] sm:h-[400px]">
              {subjectChartData.length > 0 ? (
                <SubjectPerformance data={subjectChartData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No subject performance data available
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-blue-900">Take Practice Test</h4>
                <p className="text-sm text-blue-600 mt-1">Start a new practice session</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FiActivity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <button
              onClick={() => router.push('/exam')}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Tests
            </button>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-purple-900">View Analytics</h4>
                <p className="text-sm text-purple-600 mt-1">Detailed performance insights</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FiTarget className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/analytics')}
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Analytics
            </button>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border border-green-100 hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-green-900">Test History</h4>
                <p className="text-sm text-green-600 mt-1">Review past attempts</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FiCalendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/tests')}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              View History
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
