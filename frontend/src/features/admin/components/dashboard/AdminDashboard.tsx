"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ClipboardDocumentListIcon, 
  QuestionMarkCircleIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  ChartPieIcon,
  UsersIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import { useAdminStore } from '../../store/adminStore';

interface AdminDashboardProps {
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number | undefined;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  href?: string;
  isLoading?: boolean;
  error?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor, 
  bgColor, 
  href,
  isLoading = false,
  error
}) => {
  const content = (
    <div className={`${bgColor} p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className={`p-2 rounded-lg ${iconColor.includes('blue') ? 'bg-blue-100' : 
              iconColor.includes('green') ? 'bg-green-100' :
              iconColor.includes('purple') ? 'bg-purple-100' : 'bg-indigo-100'}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <span className="ml-3 text-sm font-medium text-gray-600">{title}</span>
          </div>
          
          {error ? (
            <div className="text-sm text-red-500">Could not fetch</div>
          ) : isLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {value?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-500">{subtitle}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

const QuickActionButton: React.FC<{
  title: string;
  href: string;
  icon: React.ElementType;
  color: string;
}> = ({ title, href, icon: Icon, color }) => (
  <Link href={href}>
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${color} text-white px-6 py-4 rounded-lg font-medium text-center hover:opacity-90 transition-opacity duration-200 flex items-center justify-center space-x-2`}
    >
      <Icon className="h-5 w-5" />
      <span>{title}</span>
    </motion.div>
  </Link>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ className = '' }) => {
  const { 
    analytics, 
    loading, 
    error,
    fetchAdminAnalytics 
  } = useAdminStore();

  useEffect(() => {
    fetchAdminAnalytics();
  }, [fetchAdminAnalytics]);

  const isLoading = loading.has('analytics');
  const hasError = error.analytics;

  // Calculate analytics overview data
  const questionsBySubject = analytics?.testsBySubject || {};
  const subjectData = Object.entries(questionsBySubject).map(([subject, count]) => ({
    subject,
    count: count as number
  }));

  return (
    <div className={`p-6 space-y-8 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Comprehensive overview of your platform's performance</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Tests"
          value={analytics?.totalTests}
          subtitle="Total number of test..."
          icon={ClipboardDocumentListIcon}
          iconColor="text-blue-600"
          bgColor="bg-white"
          href="/admin/tests"
          isLoading={isLoading}
          error={hasError ? "Could not fetch" : undefined}
        />
        <StatCard
          title="Total Questions"
          value={analytics?.totalQuestions}
          subtitle="Total questions in th..."
          icon={QuestionMarkCircleIcon}
          iconColor="text-green-600"
          bgColor="bg-white"
          href="/admin/questions"
          isLoading={isLoading}
          error={hasError ? "Could not fetch" : undefined}
        />
        <StatCard
          title="Active Users"
          value={analytics?.activeUsers}
          subtitle="Users active in last 3..."
          icon={UserGroupIcon}
          iconColor="text-purple-600"
          bgColor="bg-white"
          href="/admin/users"
          isLoading={isLoading}
          error={hasError ? "Could not fetch" : undefined}
        />
        <StatCard
          title="Total Students"
          value={analytics?.totalStudents}
          subtitle="Total registered stud..."
          icon={AcademicCapIcon}
          iconColor="text-indigo-600"
          bgColor="bg-white"
          href="/admin/users"
          isLoading={isLoading}
          error={hasError ? "Could not fetch" : undefined}
        />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Questions by Subject Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Questions by Subject</h3>
            <Link href="/admin/analytics" className="text-blue-600 text-sm font-medium hover:text-blue-700">
              View Detailed Analytics
            </Link>
          </div>
          
          {hasError ? (
            <div className="text-center py-8 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Could not fetch chart data</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="flex-1 mx-4">
                    <div className="h-4 bg-blue-200 rounded animate-pulse" style={{ width: `${Math.random() * 60 + 20}%` }}></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {subjectData.map((item) => (
                <div key={item.subject} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.subject}
                  </span>
                  <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min((item.count / Math.max(...subjectData.map(d => d.count))) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Test Completion Rates */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Test Completion Rates</h3>
          <div className="text-center py-8 text-gray-500">
            <ChartPieIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No completion rate data available</p>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            title="Create Test"
            href="/admin/tests/create"
            icon={PlusIcon}
            color="bg-blue-600"
          />
          <QuickActionButton
            title="Add Questions"
            href="/admin/questions/add"
            icon={PencilIcon}
            color="bg-green-600"
          />
          <QuickActionButton
            title="Analytics"
            href="/admin/analytics"
            icon={ChartBarIcon}
            color="bg-purple-600"
          />
          <QuickActionButton
            title="Manage Users"
            href="/admin/users"
            icon={UsersIcon}
            color="bg-indigo-600"
          />
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Recent Tests */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tests</h3>
          <div className="text-center py-8 text-gray-500">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No tests available</p>
          </div>
        </div>

        {/* Recent Questions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Questions</h3>
          {hasError ? (
            <div className="text-center py-8 text-gray-500">
              <QuestionMarkCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Could not fetch questions</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-6 w-12 bg-blue-200 rounded animate-pulse"></div>
                    <div className="h-6 w-12 bg-green-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {analytics?.recentQuestions?.slice(0, 4).map((question: any) => (
                <div key={question.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {question.title || 'Untitled Question'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {question.subject} • Added {new Date(question.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Link 
                      href={`/admin/questions/${question.id}`}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View
                    </Link>
                    <Link 
                      href={`/admin/questions/edit/${question.id}`}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <QuestionMarkCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent questions</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Questions Today</span>
              <span className="text-sm font-semibold text-gray-900">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tests Created</span>
              <span className="text-sm font-semibold text-gray-900">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Users</span>
              <span className="text-sm font-semibold text-gray-900">0</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;