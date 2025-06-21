"use client";

import { useEffect } from 'react';
import { 
  ClipboardDocumentListIcon, 
  QuestionMarkCircleIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  PlusIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  ExclamationCircleIcon,
  BookOpenIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";
import Link from 'next/link';
import { useAdminStore } from '@/features/admin/store/adminStore';

interface StatItem {
  name: string;
  value: number;
  icon: React.ElementType;
  color: string;
  description: string;
}

export default function AdminPage() {
  const { 
    analytics, 
    userAnalytics,
    loading, 
    error, 
    fetchAdminAnalytics,
    fetchUserAnalytics
  } = useAdminStore();

  useEffect(() => {
    fetchAdminAnalytics();
    fetchUserAnalytics();
  }, [fetchAdminAnalytics, fetchUserAnalytics]);

  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString();
  };

  const mainStats: StatItem[] = [
    { 
      name: 'Total Tests', 
      value: analytics?.totalTests ?? 0, 
      icon: ClipboardDocumentListIcon,
      color: 'blue-600',
      description: 'Total number of tests available'
    },
    { 
      name: 'Total Questions', 
      value: analytics?.totalQuestions ?? 0, 
      icon: QuestionMarkCircleIcon,
      color: 'green-600',
      description: 'Total questions in the database'
    },
    { 
      name: 'Active Users', 
      value: analytics?.activeUsers ?? 0, 
      icon: UserGroupIcon,
      color: 'purple-600',
      description: 'Users active in last 30 days'
    },
    { 
      name: 'Total Students', 
      value: analytics?.totalStudents ?? 0, 
      icon: AcademicCapIcon,
      color: 'indigo-600',
      description: 'Total registered students'
    },
    {
      name: 'Total Users',
      value: userAnalytics?.totalUsers ?? 0,
      icon: UserGroupIcon,
      color: 'yellow-600',
      description: 'All registered users'
    },
    {
      name: 'New Users (Month)',
      value: userAnalytics?.newUsersThisMonth ?? 0,
      icon: UserPlusIcon,
      color: 'pink-600',
      description: 'New users in the last 30 days'
    }
  ];

  const totalUsersByRole = userAnalytics ? Object.values(userAnalytics.usersByRole).reduce((sum, count) => sum + count, 0) : 0;


  const errorKey = Object.keys(error).find(k => error[k]);
  const errorMessage = errorKey ? error[errorKey] : null;

  if (errorMessage && !loading.size) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Data</h3>
          <p className="mt-1 text-sm text-gray-500">{errorMessage}</p>
          <div className="mt-6">
            <button
              onClick={() => {
                fetchAdminAnalytics();
                fetchUserAnalytics();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              {errorMessage ? 'Unable to fetch latest data' : 'Comprehensive overview of your platform\'s performance'}
            </p>
            {errorMessage && (
              <div className="mt-2 text-sm text-red-600">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {mainStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <dt>
                    <div className={`absolute rounded-lg bg-${stat.color} p-3`}>
                      <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="ml-16 truncate text-xs text-gray-400">{stat.description}</p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pt-2">
                    {loading.has('analytics') || loading.has('userAnalytics') ? (
                      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatValue(stat.value)}
                      </p>
                    )}
                  </dd>
                </div>
              );
            })}
          </div>

          {/* Subject and Exam Statistics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Subject Statistics */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Questions by Subject
              </h3>
              <div className="space-y-4">
                {loading.has('analytics') ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center">
                      <div className="w-24 h-4 bg-gray-200 rounded"></div>
                      <div className="flex-1 mx-4 h-4 bg-gray-200 rounded"></div>
                      <div className="w-12 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))
                ) : error.analytics || !analytics || Object.keys(analytics.testsBySubject).length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">No subject data available</p>
                  </div>
                ) : (
                  Object.entries(analytics.testsBySubject).map(([subject, count]) => (
                    <div key={subject} className="flex items-center">
                      <span className="w-24 text-sm text-gray-600 capitalize">{subject}</span>
                      <div className="flex-1 mx-4">
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${(count / (analytics.totalQuestions || 1) * 100) || 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Users by Role */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Users by Role
              </h3>
              <div className="space-y-4">
                {loading.has('userAnalytics') ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center">
                      <div className="w-24 h-4 bg-gray-200 rounded"></div>
                      <div className="flex-1 mx-4 h-4 bg-gray-200 rounded"></div>
                      <div className="w-12 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))
                ) : error.userAnalytics || !userAnalytics || totalUsersByRole === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500">No user role data available</p>
                  </div>
                ) : (
                  Object.entries(userAnalytics.usersByRole).map(([role, count]) => (
                    <div key={role} className="flex items-center">
                      <span className="w-24 text-sm text-gray-600 capitalize">{role}</span>
                      <div className="flex-1 mx-4">
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-600 rounded-full"
                            style={{ width: `${(count / totalUsersByRole) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-sm rounded-xl">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Link 
                  href="/admin/tests/create"
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Test
                </Link>
                <Link 
                  href="/admin/questions/add"
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  <PencilSquareIcon className="h-5 w-5 mr-2" />
                  Add Questions
                </Link>
                <Link 
                  href="/admin/analytics"
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Analytics
                </Link>
                <Link 
                  href="/admin/users"
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Manage Users
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Tests */}
          <div className="bg-white shadow-sm rounded-xl">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Tests</h3>
              <div className="overflow-hidden">
                <div className="flow-root">
                  {loading.has('analytics') ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-100 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : error.analytics || !analytics || analytics.recentTests.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500">No tests available</p>
                    </div>
                  ) : (
                    <ul role="list" className="divide-y divide-gray-200">
                      {analytics.recentTests.map((test) => (
                        <li key={test.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {test.title}
                              </p>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className="flex items-center text-sm text-gray-600">
                                  <DocumentCheckIcon className="h-4 w-4 mr-1" />
                                  {test.questions} questions
                                </span>
                                <span className="flex items-center text-sm text-gray-600">
                                  <UserGroupIcon className="h-4 w-4 mr-1" />
                                  {test.attempts} attempts
                                </span>
                                <span className="text-sm text-gray-600">
                                  Created {new Date(test.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/admin/tests/${test.id}`}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                              >
                                View
                              </Link>
                              <Link
                                href={`/admin/tests/${test.id}/edit`}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                              >
                                Edit
                              </Link>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Questions */}
          <div className="bg-white shadow-sm rounded-xl">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Questions</h3>
              <div className="overflow-hidden">
                <div className="flow-root">
                  {loading.has('analytics') ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-100 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : error.analytics || !analytics || analytics.recentQuestions.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500">No questions available</p>
                    </div>
                  ) : (
                    <ul role="list" className="divide-y divide-gray-200">
                      {analytics.recentQuestions.map((question) => (
                        <li key={question.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {question.title}
                              </p>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className="flex items-center text-sm text-gray-600">
                                  <BookOpenIcon className="h-4 w-4 mr-1" />
                                  {question.subject}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Added {new Date(question.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/admin/questions/${question.id}`}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                              >
                                View
                              </Link>
                              <Link
                                href={`/admin/questions/${question.id}/edit`}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                              >
                                Edit
                              </Link>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
