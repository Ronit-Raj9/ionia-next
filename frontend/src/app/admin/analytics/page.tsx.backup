"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen,
  ClipboardList,
  GraduationCap,
  Clock,
  Users,
  BarChart,
  Loader2,
  AlertCircle,
  RefreshCcw,
  User
} from "lucide-react";
import { fetchAnalytics } from "../utils/api";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { IUser } from "@/redux/slices/authSlice";

interface Question {
  _id: string;
  subject: string;
  examType: string;
  difficulty: string;
  year: string;
}

interface Test {
  _id: string;
  title: string;
  examType: string;
  year: number;
  questions: string[];
  createdAt: string;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    questions: Question[];
    tests: Test[];
  }>({
    questions: [],
    tests: []
  });

  // Get user data from Redux store
  const user = useSelector((state: RootState) => state.auth.user);

  // Function to safely get user display values
  const getUserDisplayData = () => {
    // Check if user is in the expected IUser format
    if (user && 'fullName' in user) {
      return {
        fullName: user.fullName,
        email: user.email
      };
    }
    
    // Check for nested data structure with proper typing
    if (user && typeof user === 'object' && 'data' in user) {
      // Use explicit type for user with optional data property
      type UserWithData = { data?: { fullName?: string; email?: string } };
      // Apply the type
      const userData = user as UserWithData;
      
      return {
        fullName: userData.data?.fullName || 'Admin User',
        email: userData.data?.email || 'admin@example.com'
      };
    }
    
    // Default values
    return {
      fullName: 'Admin User',
      email: 'admin@example.com'
    };
  };

  const userDisplay = getUserDisplayData();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAnalytics();
      console.log('Fetched Analytics Data:', data); // Debug log
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics Error:', error); // Debug log
      setError(error instanceof Error ? error.message : "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if we have data
  if (!analytics.questions || !analytics.tests) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No data available</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalQuestions = analytics.questions.length;
  const totalTests = analytics.tests.length;
  const averageQuestionsPerTest = totalTests > 0 
    ? Math.round((totalQuestions / totalTests) * 10) / 10 
    : 0;

  // Calculate subject distribution
  const subjectCounts = analytics.questions.reduce((acc, question) => {
    acc[question.subject] = (acc[question.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate difficulty distribution
  const difficultyDistribution = analytics.questions.reduce((acc, question) => {
    acc[question.difficulty] = (acc[question.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const metrics = [
    {
      name: 'Total Questions',
      value: totalQuestions,
      icon: BookOpen,
      color: 'bg-emerald-500'
    },
    {
      name: 'Total Tests',
      value: totalTests,
      icon: ClipboardList,
      color: 'bg-blue-500'
    },
    {
      name: 'Questions per Test',
      value: averageQuestionsPerTest,
      icon: BarChart,
      color: 'bg-purple-500'
    },
    {
      name: 'Exam Types',
      value: new Set(analytics.questions.map(q => q.examType)).size,
      icon: GraduationCap,
      color: 'bg-orange-500'
    },
  ];

  // Get recent tests
  const recentTests = [...analytics.tests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="p-6">
      {/* Admin Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-emerald-50 rounded-full">
            <User className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{userDisplay.fullName}</h2>
            <p className="text-sm text-gray-500">{userDisplay.email}</p>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your test platform's questions and tests.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-gray-200 sm:px-6 sm:py-6"
          >
            <dt>
              <div className={`absolute rounded-md ${metric.color} p-3`}>
                <metric.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{metric.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Distribution Cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Subject Distribution */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Distribution</h3>
          <div className="space-y-4">
            {Object.entries(subjectCounts).map(([subject, count]) => (
              <div key={subject}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{subject}</span>
                  <span className="text-gray-900 font-medium">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(count / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Difficulty Distribution</h3>
          <div className="space-y-4">
            {Object.entries(difficultyDistribution).map(([difficulty, count]) => (
              <div key={difficulty}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{difficulty}</span>
                  <span className="text-gray-900 font-medium">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      difficulty === 'Easy' ? 'bg-green-500' :
                      difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(count / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tests */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-5">
          <h3 className="text-lg font-medium text-gray-900">Recent Tests</h3>
          <div className="mt-5">
            <div className="flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {recentTests.map((test) => (
                  <li key={test._id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <ClipboardList className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {test.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {test.examType} • {test.year} • {test.questions.length} questions
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 