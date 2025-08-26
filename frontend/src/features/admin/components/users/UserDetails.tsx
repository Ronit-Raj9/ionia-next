"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useUserManagementStore } from '../../store/userManagementStore';
import LoadingSpinner from '../analytics/LoadingSpinner';
import ErrorMessage from '../analytics/ErrorMessage';
import type { User } from '../../types';

interface UserDetailsProps {
  userId: string;
  onClose: () => void;
  className?: string;
}

const UserDetails: React.FC<UserDetailsProps> = ({ userId, onClose, className = '' }) => {
  const {
    selectedUser,
    loading,
    error,
    fetchUserDetails,
    clearError
  } = useUserManagementStore();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    fetchUserDetails(userId);
  }, [userId, fetchUserDetails]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const isLoading = loading.has('userDetails');
  const errorMessage = error['userDetails'];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <ErrorMessage message={errorMessage} onRetry={() => fetchUserDetails(userId)} />
          <button
            onClick={handleClose}
            className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!selectedUser) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'superadmin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'superadmin':
        return ShieldCheckIcon;
      default:
        return UserIcon;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const RoleIcon = getRoleIcon(selectedUser.role);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: isVisible ? 1 : 0.9, opacity: isVisible ? 1 : 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xl font-medium text-gray-700">
                  {(selectedUser.username || selectedUser.fullName || selectedUser.email)?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedUser.fullName || selectedUser.username || 'No Name'}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                  <RoleIcon className="h-3 w-3 mr-1" />
                  {selectedUser.role}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {selectedUser.email}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Joined {formatDate(selectedUser.createdAt)}
                </div>
                {selectedUser.lastLogin && (
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Last login: {formatDate(selectedUser.lastLogin)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Statistics */}
          {selectedUser.stats && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Performance Statistics
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedUser.stats.testsCompleted}
                  </div>
                  <div className="text-sm text-gray-600">Tests Completed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedUser.stats.accuracy}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedUser.stats.totalCorrect}
                  </div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {selectedUser.stats.totalWrong}
                  </div>
                  <div className="text-sm text-gray-600">Wrong Answers</div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Account Status</h4>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Active</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">User ID</h4>
              <p className="text-sm text-gray-600 font-mono">{selectedUser._id}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserDetails;

