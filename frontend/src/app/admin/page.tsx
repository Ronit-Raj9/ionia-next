"use client";

import { useEffect, useState } from 'react';
import { 
  ClipboardDocumentListIcon, 
  QuestionMarkCircleIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  PlusIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { fetchTestAnalytics } from './utils/analytics';
import Link from 'next/link';
import { TestAnalytics } from './utils/analytics';

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<TestAnalytics>({
    totalTests: 0,
    totalQuestions: 0,
    activeUsers: 0,
    testsBySubject: {},
    completionRates: {},
    recentTests: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await fetchTestAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const stats = [
    { name: 'Total Tests', value: analytics.totalTests, icon: ClipboardDocumentListIcon },
    { name: 'Total Questions', value: analytics.totalQuestions, icon: QuestionMarkCircleIcon },
    { name: 'Active Users', value: analytics.activeUsers, icon: UserGroupIcon },
  ];

  return (
    <div className="min-h-screen bg-green-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-800">Welcome back, Admin!</h1>
            <p className="mt-2 text-sm text-green-600">
              Here's what's happening with your test series platform today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-green-100 hover:shadow-md transition-shadow duration-200"
              >
                <dt>
                  <div className="absolute rounded-lg bg-green-600 p-3">
                    <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-green-700">{stat.name}</p>
                </dt>
                <dd className="ml-16 flex items-baseline">
                  <p className="text-2xl font-semibold text-green-900">
                    {loading ? '...' : stat.value.toLocaleString()}
                  </p>
                </dd>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow-sm rounded-xl border border-green-100">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium leading-6 text-green-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link 
                  href="/admin/tests/create"
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Test
                </Link>
                <Link 
                  href="/admin/questions/add"
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  <PencilSquareIcon className="h-5 w-5 mr-2" />
                  Add Questions
                </Link>
                <Link 
                  href="/admin/analytics"
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View Analytics
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Tests */}
          <div className="bg-white shadow-sm rounded-xl border border-green-100">
            <div className="px-6 py-5">
              <h3 className="text-lg font-medium leading-6 text-green-800 mb-4">Recent Tests</h3>
              <div className="mt-4">
                <div className="flow-root">
                  {loading ? (
                    <div className="flex justify-center py-6">
                      <p className="text-green-600">Loading recent tests...</p>
                    </div>
                  ) : (
                    <ul role="list" className="divide-y divide-green-100">
                      {analytics.recentTests.map((test) => (
                        <li key={test.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-green-900 truncate">{test.title}</p>
                              <p className="text-sm text-green-600 mt-1">
                                {test.questions} questions • {test.attempts} attempts • Created on {new Date(test.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Link
                                href={`/admin/tests/${test.id}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-green-700 bg-green-100 hover:bg-green-200 transition-colors duration-200"
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
