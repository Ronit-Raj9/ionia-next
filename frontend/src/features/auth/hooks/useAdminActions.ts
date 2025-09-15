// ==========================================
// 🛡️ ADMIN ACTIONS HOOK
// ==========================================

'use client';

import { useState, useCallback } from 'react';
import { authAPI } from '../api/authApi';

interface AdminActionsState {
  isLoading: boolean;
  error: string | null;
}

export const useAdminActions = () => {
  const [state, setState] = useState<AdminActionsState>({
    isLoading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const unlockAccount = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.unlockAccount(userId);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to unlock account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserActivityLogs = useCallback(async (userId: string, limit = 50) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.getUserActivityLogs(userId, limit);
      return result.logs;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch user activity logs';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, role: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.updateUserRole(userId, role);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update user role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUsersAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.getUsersAnalytics();
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch user analytics';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllUsers = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.getAllUsers(params);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch users';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserDetails = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authAPI.getUserDetails(userId);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch user details';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    ...state,
    actions: {
      unlockAccount,
      getUserActivityLogs,
      updateUserRole,
      getUsersAnalytics,
      getAllUsers,
      getUserDetails,
    },
    clearError,
  };
};

export default useAdminActions;
