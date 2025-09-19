"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon,
  UserPlusIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useUserManagementStore } from '../../store/userManagementStore';
import LoadingSpinner from '../analytics/LoadingSpinner';
import ErrorMessage from '../analytics/ErrorMessage';

interface UserAnalyticsProps {
  className?: string;
}

const UserAnalytics: React.FC<UserAnalyticsProps> = ({ className = '' }) => {
  const {
    userAnalytics,
    loading,
    error,
    fetchUserAnalytics,
    clearError
  } = useUserManagementStore();

  useEffect(() => {
    fetchUserAnalytics();
  }, [fetchUserAnalytics]);

  const isLoading = loading.has('userAnalytics');
  const errorMessage = error['userAnalytics'];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (errorMessage) {
    return <ErrorMessage message={errorMessage} onRetry={() => fetchUserAnalytics()} />;
  }

  if (!userAnalytics) {
    return null;
  }

  const stats = [
    {
      name: 'Total Users',
      value: userAnalytics.totalUsers,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: null
    },
    {
      name: 'New This Week',
      value: userAnalytics.newUsersThisWeek,
      icon: UserPlusIcon,
      color: 'bg-green-500',
      change: null
    },
    {
      name: 'New This Month',
      value: userAnalytics.newUsersThisMonth,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      change: null
    }
  ];

  const roleStats = [
    { role: 'User', count: userAnalytics.usersByRole.user || 0, color: 'bg-gray-500' },
    { role: 'Admin', count: userAnalytics.usersByRole.admin || 0, color: 'bg-purple-500' },
    { role: 'Superadmin', count: userAnalytics.usersByRole.superadmin || 0, color: 'bg-red-500' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Role Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Users by Role</h3>
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {roleStats.map((roleStat, index) => (
            <div key={roleStat.role} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${roleStat.color}`} />
                <span className="text-sm font-medium text-gray-700">{roleStat.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900">{roleStat.count}</span>
                <span className="text-sm text-gray-500">
                  ({((roleStat.count / userAnalytics.totalUsers) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Signups */}
      {userAnalytics.recentSignups && userAnalytics.recentSignups.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Signups</h3>
          <div className="space-y-3">
            {userAnalytics.recentSignups.slice(0, 5).map((user, index) => (
              <div key={user._id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserAnalytics;

