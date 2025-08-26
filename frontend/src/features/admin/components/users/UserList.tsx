"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useUserManagementStore } from '../../store/userManagementStore';
import type { User } from '../../types';
import LoadingSpinner from '../analytics/LoadingSpinner';
import ErrorMessage from '../analytics/ErrorMessage';
import UserDetails from './UserDetails';

interface UserFilters {
  search: string;
  role: string;
  status: string;
}

interface UserListProps {
  className?: string;
}

const UserList: React.FC<UserListProps> = ({ className = '' }) => {
  const {
    users,
    usersPagination,
    loading,
    error,
    fetchUsers,
    updateUserRole,
    clearError
  } = useUserManagementStore();

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = () => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    fetchUsers(queryParams.toString());
  };

  const handleRoleUpdate = async (userId: string, newRole: 'user' | 'admin') => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        await updateUserRole(userId, newRole);
      } catch (error) {
        console.error('Failed to update user role:', error);
      }
    }
  };

  const updateFilter = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: ''
    });
  };

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
      month: 'short',
      day: 'numeric'
    });
  };

  const isLoading = loading.has('users');
  const hasError = error.users;

  if (isLoading && users.length === 0) {
    return <LoadingSpinner message="Loading users..." />;
  }

  if (hasError && users.length === 0) {
    return (
      <ErrorMessage 
        message={hasError}
        onRetry={loadUsers}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => updateFilter('role', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Users ({usersPagination?.totalDocs || users.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-6">
            <LoadingSpinner message="Loading users..." />
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map((user: User, index: number) => {
              const RoleIcon = getRoleIcon(user.role);
              return (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {(user.username || user.fullName || user.email)?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.fullName || user.username || 'No Name'}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {user.role}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            {user.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Joined {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedUserId(user._id)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 flex items-center space-x-1"
                      >
                        <EyeIcon className="h-3 w-3" />
                        View
                      </button>
                      
                      {user.role !== 'superadmin' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleRoleUpdate(user._id, 'user')}
                            disabled={user.role === 'user'}
                            className={`px-3 py-1 text-xs font-medium rounded ${
                              user.role === 'user'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            User
                          </button>
                          <button
                            onClick={() => handleRoleUpdate(user._id, 'admin')}
                            disabled={user.role === 'admin'}
                            className={`px-3 py-1 text-xs font-medium rounded ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-700 cursor-not-allowed'
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                          >
                            Admin
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {usersPagination && usersPagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((usersPagination.page - 1) * usersPagination.limit) + 1} to{' '}
              {Math.min(usersPagination.page * usersPagination.limit, usersPagination.totalDocs)} of{' '}
              {usersPagination.totalDocs} results
            </div>
            
            <div className="flex space-x-2">
              <button
                disabled={!usersPagination.hasPrevPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={!usersPagination.hasNextPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUserId && (
        <UserDetails
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
};

export default UserList;