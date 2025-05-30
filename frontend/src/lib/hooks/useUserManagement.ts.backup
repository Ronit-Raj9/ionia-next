import { useState, useEffect, useCallback } from 'react';
import { API } from '../api';
import { useAuth } from './useAuth';

interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: string;
  updatedAt: string;
  analytics?: {
    totalTests: number;
    testsThisWeek: number;
    averageScore: number;
    accuracy: number;
  };
}

interface UserAnalytics {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: {
    user: number;
    admin: number;
    superadmin: number;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Filters {
  page: number;
  limit: number;
  search: string;
  role: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function useUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const updateFilters = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
        queryParams.append('sortOrder', filters.sortOrder);
      }
      
      const response = await API.admin.getUsers(queryParams.toString());
      
      if (response.data) {
        setUsers(response.data.docs || []);
        setPagination({
          currentPage: response.data.page,
          totalPages: response.data.totalPages,
          totalUsers: response.data.totalDocs,
          hasNextPage: response.data.hasNextPage,
          hasPrevPage: response.data.hasPrevPage,
        });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, filters]);

  const fetchUserAnalytics = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      const response = await API.admin.getUserAnalytics();
      if (response.data) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.error('Error fetching user analytics:', err);
    }
  }, [isAdmin]);

  const fetchUserDetails = useCallback(async (userId: string) => {
    if (!isAdmin) return;
    
    try {
      const response = await API.admin.getUserDetails(userId);
      if (response.data) {
        setSelectedUser(response.data);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to fetch user details.');
    }
  }, [isAdmin]);

  const changeUserRole = useCallback(async (userId: string, newRole: 'user' | 'admin') => {
    if (!isSuperAdmin) return;
    
    setIsUpdatingRole(true);
    try {
      const response = await API.admin.updateUserRole(userId, newRole);
      
      if (response.data) {
        // Update users list
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, role: newRole } : user
          )
        );
        
        // Update selected user if it's the same one
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser({ ...selectedUser, role: newRole });
        }
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role.');
    } finally {
      setIsUpdatingRole(false);
    }
  }, [isSuperAdmin, selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUserAnalytics();
  }, [fetchUserAnalytics]);

  return {
    users,
    loading,
    error,
    pagination,
    analytics,
    selectedUser,
    isUpdatingRole,
    isSuperAdmin,
    isAdmin,
    filters,
    updateFilters,
    fetchUsers,
    fetchUserDetails,
    changeUserRole,
  };
} 