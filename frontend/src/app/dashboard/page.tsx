"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks/hooks";
import { getCurrentUser } from "@/redux/slices/authSlice";
import { fetchTestHistory } from "@/redux/slices/testSlice";
import { RootState } from "@/redux/store";
import { Card } from "@/components/dashboard/card";
import PerformanceChart, { PerformanceData } from "@/components/dashboard/PerformanceChart";
import SubjectPerformance, { SubjectData } from "@/components/dashboard/SubjectPerformance";
import { FiRefreshCw, FiAlertTriangle, FiActivity, FiCalendar, FiCheckCircle, FiTarget } from "react-icons/fi";
import { ClipLoader } from "react-spinners";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAppSelector((state: RootState) => state.auth);
  const { testHistory, loading: testHistoryLoading } = useAppSelector((state: RootState) => state.test);

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
      dispatch(getCurrentUser());
      dispatch(fetchTestHistory());
    }
  }, [dispatch, isAuthenticated]);

  if (authLoading || testHistoryLoading) {
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
                onClick={() => dispatch(fetchTestHistory())}
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
                onClick={() => dispatch(fetchTestHistory())}
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
                  No performance data available
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
