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
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { useAdminStore } from '../../store/adminStore';
import { useUserManagementStore } from '../../store/userManagementStore';
import { useAnalyticsCache } from '../../hooks/useAnalyticsCache';
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
    fetchAdminAnalytics,
    refreshAdminAnalytics
  } = useAdminStore();

  const {
    userAnalytics,
    loading: userLoading,
    error: userError,
    fetchUserAnalytics
  } = useUserManagementStore();

  // Use cache hook for smart data management
  const { 
    hasCachedData, 
    lastFetched, 
    isStale,
    shouldRefresh,
    getCacheInfo
  } = useAnalyticsCache();

  useEffect(() => {
    // Only fetch if we don't have cached data or it's stale
    if (!hasCachedData || shouldRefresh) {
      console.log('📊 Analytics: Fetching data - cache status:', getCacheInfo());
      fetchAdminAnalytics();
    } else {
      console.log('📊 Analytics: Using cached data - cache status:', getCacheInfo());
    }
    
    // Fetch user analytics separately to avoid blocking
    fetchUserAnalytics();
  }, []); // Empty dependency array - only run once on mount

  const isLoading = loading.has('analytics') || userLoading.has('userAnalytics');
  const hasError = error.analytics || userError.userAnalytics;

  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString();
  };

  const formatCacheAge = (timestamp: number | null): string => {
    if (!timestamp) return 'Unknown';
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleRefresh = () => {
    refreshAdminAnalytics();
  };

  // Show loading only if we have no data at all (not even cached)
  if (isLoading && !analytics && !hasCachedData) {
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
        <motion.div
          className="flex items-center justify-center space-x-4 mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>
        
        <motion.div 
          className="flex items-center justify-center space-x-4 text-sm text-gray-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span>
            {hasError ? 'Showing cached data - Unable to fetch latest data' : 'Comprehensive overview of your platform\'s performance'}
          </span>
          {hasCachedData && (
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="text-xs">
                Data cached {formatCacheAge(lastFetched)}
              </span>
            </div>
          )}
          {isStale && (
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-yellow-600">
                Data may be outdated
              </span>
            </div>
          )}
        </motion.div>
        
        {hasError && (
          <motion.div 
            className="mt-2 text-sm text-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {error.analytics || userError.userAnalytics}
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
            {userLoading.has('userAnalytics') ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 mx-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-12 h-4 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : userError.userAnalytics || !userAnalytics || !userAnalytics.usersByRole ? (
              <div className="text-center py-6">
                <ExclamationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {userError.userAnalytics || 'User role analytics not available'}
                </p>
              </div>
            ) : (
              Object.entries(userAnalytics.usersByRole).map(([role, count]) => (
                <ProgressBar
                  key={role}
                  label={role.charAt(0).toUpperCase() + role.slice(1)}
                  value={count}
                  maxValue={userAnalytics.totalUsers || 1}
                  color="green"
                />
              ))
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