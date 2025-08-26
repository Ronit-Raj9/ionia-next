"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChartBarIcon, UserGroupIcon, AcademicCapIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { useAdminStore } from '../../store/adminStore';

interface AnalyticsOverviewProps {
  className?: string;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ className = '' }) => {
  const { analytics, loading, error, fetchAdminAnalytics } = useAdminStore();

  useEffect(() => {
    if (!analytics) {
      fetchAdminAnalytics();
    }
  }, [analytics, fetchAdminAnalytics]);

  const isLoading = loading.has('analytics');

  // Format number values
  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  return (
    <motion.div 
      className={`bg-white rounded-xl shadow-sm p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Platform Overview</h3>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          <ChartBarIcon className="h-4 w-4 mr-2" />
          View Detailed Analytics
        </Link>
      </div>

      {isLoading && !analytics ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      ) : error.analytics ? (
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error.analytics}</p>
          <button
            onClick={() => fetchAdminAnalytics()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{formatValue(analytics?.totalQuestions)}</p>
            <p className="text-sm text-blue-600">Total Questions</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <UserGroupIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{formatValue(analytics?.activeUsers)}</p>
            <p className="text-sm text-green-600">Active Users</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <UserGroupIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">{formatValue(analytics?.totalStudents)}</p>
            <p className="text-sm text-purple-600">Total Students</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <QuestionMarkCircleIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-900">{formatValue(analytics?.totalTests)}</p>
            <p className="text-sm text-orange-600">Total Tests</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsOverview;