"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardDocumentListIcon, 
  QuestionMarkCircleIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useAdminStore } from '../../store/adminStore';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import StatCard from './StatCard';
import ProgressBar from './ProgressBar';
import RecentItems from './RecentItems';

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const { 
    analytics, 
    loading, 
    error, 
    fetchAdminAnalytics
  } = useAdminStore();

  useEffect(() => {
    fetchAdminAnalytics();
  }, []);

  const isLoading = loading.has('analytics');
  const hasError = error.analytics;

  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString();
  };

  if (isLoading && !analytics) {
    return <LoadingSpinner message="Loading analytics data..." />;
  }

  if (hasError && !analytics) {
    return (
      <ErrorMessage 
        message={error.analytics || 'Failed to load analytics'}
        onRetry={() => {
          fetchAdminAnalytics();
        }}
      />
    );
  }

  // Main statistics cards data
  const mainStats = [
    { 
      name: 'Total Tests', 
      value: analytics?.totalTests ?? 0, 
      icon: ClipboardDocumentListIcon,
      color: 'blue',
      description: 'Total number of tests available'
    },
    { 
      name: 'Total Questions', 
      value: analytics?.totalQuestions ?? 0, 
      icon: QuestionMarkCircleIcon,
      color: 'green',
      description: 'Total questions in the database'
    },
    { 
      name: 'Active Users', 
      value: analytics?.activeUsers ?? 0, 
      icon: UserGroupIcon,
      color: 'purple',
      description: 'Users active in last 30 days'
    },
    { 
      name: 'Total Students', 
      value: analytics?.totalStudents ?? 0, 
      icon: AcademicCapIcon,
      color: 'indigo',
      description: 'Total registered students'
    }
  ];



  return (
    <div className={`p-6 space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <motion.h1 
          className="text-3xl font-bold text-gray-900"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Analytics Dashboard
        </motion.h1>
        <motion.p 
          className="mt-2 text-sm text-gray-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {hasError ? 'Showing cached data - Unable to fetch latest data' : 'Comprehensive overview of your platform\'s performance'}
        </motion.p>
        {hasError && (
          <motion.div 
            className="mt-2 text-sm text-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {error.analytics || error.userAnalytics}
          </motion.div>
        )}
      </div>

      {/* Main Statistics Grid */}
      <motion.div 
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {mainStats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <StatCard
              name={stat.name}
              value={formatValue(stat.value)}
              icon={stat.icon}
              color={stat.color}
              description={stat.description}
              isLoading={isLoading}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Subject and User Role Statistics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Questions by Subject */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BookOpenIcon className="h-5 w-5 mr-2 text-blue-600" />
            Questions by Subject
          </h3>
          <div className="space-y-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 mx-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-12 h-4 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : error.analytics || !analytics || Object.keys(analytics.testsBySubject).length === 0 ? (
              <div className="text-center py-6">
                <ExclamationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No subject data available</p>
              </div>
            ) : (
              Object.entries(analytics.testsBySubject).map(([subject, count]) => (
                <ProgressBar
                  key={subject}
                  label={subject}
                  value={count}
                  maxValue={analytics.totalQuestions || 1}
                  color="blue"
                />
              ))
            )}
          </div>
        </motion.div>

        {/* Users by Role */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-green-600" />
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
            ) : (
              <div className="text-center py-6">
                <ExclamationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">User role analytics not available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <RecentItems
            title="Recent Questions"
            items={analytics?.recentQuestions || []}
            isLoading={loading.has('analytics')}
            error={error.analytics}
            type="questions"
            icon={QuestionMarkCircleIcon}
          />
        </motion.div>

        {/* Recent Tests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <RecentItems
            title="Recent Tests"
            items={analytics?.recentTests || []}
            isLoading={loading.has('analytics')}
            error={error.analytics}
            type="tests"
            icon={ClipboardDocumentListIcon}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;