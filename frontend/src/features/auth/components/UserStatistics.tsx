// ==========================================
// 📊 USER STATISTICS COMPONENT
// ==========================================

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { 
  HiOutlineChartBar, 
  HiOutlineClipboardList, 
  HiOutlineTrendingUp, 
  HiRefresh
} from 'react-icons/hi';
import { HiOutlineTag } from 'react-icons/hi';

interface UserStatisticsProps {
  className?: string;
  showRefreshButton?: boolean;
}

export const UserStatistics: React.FC<UserStatisticsProps> = ({
  className = '',
  showRefreshButton = true
}) => {
  const { getUserStatistics } = useAuthStore();
  const [stats, setStats] = useState<{
    totalTests: number;
    averageScore: number;
    testsThisWeek: number;
    accuracy: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  
  const isStale = lastFetched ? Date.now() - lastFetched > 5 * 60 * 1000 : false; // 5 minutes
  
  const refresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserStatistics();
      setStats(data);
      setLastFetched(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!stats) {
      refresh();
    }
  }, []);

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    suffix = '', 
    color = 'emerald' 
  }: {
    icon: React.ElementType;
    title: string;
    value: number;
    suffix?: string;
    color?: 'emerald' | 'blue' | 'purple' | 'orange';
  }) => {
    const colorClasses = {
      emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400',
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value.toFixed(suffix === '%' ? 1 : 0)}{suffix}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading && !stats) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <HiOutlineChartBar className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
          <p className="text-red-600 dark:text-red-400 text-sm">
            Failed to load statistics: {error}
          </p>
          <button
            onClick={() => refresh()}
            className="ml-auto text-red-600 dark:text-red-400 hover:text-red-500"
          >
            <HiRefresh className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
          No statistics available
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your Statistics
        </h3>
        {showRefreshButton && (
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className={`
              flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md border transition-colors
              ${isLoading 
                ? 'text-gray-400 border-gray-300 cursor-not-allowed' 
                : isStale
                  ? 'text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
            title={isStale ? 'Data is outdated, click to refresh' : 'Refresh statistics'}
          >
            <HiRefresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={HiOutlineClipboardList}
          title="Total Tests"
          value={stats.totalTests}
          color="blue"
        />
        
        <StatCard
          icon={HiOutlineTrendingUp}
          title="Average Score"
          value={stats.averageScore}
          suffix="%"
          color="emerald"
        />
        
        <StatCard
          icon={HiOutlineTag}
          title="Accuracy"
          value={stats.accuracy}
          suffix="%"
          color="purple"
        />
        
        <StatCard
          icon={HiOutlineChartBar}
          title="Tests This Week"
          value={stats.testsThisWeek}
          color="orange"
        />
      </div>

      {isStale && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md"
        >
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ This data may be outdated. Click refresh to get the latest statistics.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default UserStatistics;
