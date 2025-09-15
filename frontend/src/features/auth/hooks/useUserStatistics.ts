// ==========================================
// 📊 USER STATISTICS HOOK
// ==========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

interface UserStats {
  totalTests: number;
  averageScore: number;
  testsThisWeek: number;
  accuracy: number;
}

interface UserStatisticsState {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

export const useUserStatistics = (autoFetch = true, cacheTime = 5 * 60 * 1000) => {
  const { getUserStatistics, isAuthenticated } = useAuthStore();
  const [state, setState] = useState<UserStatisticsState>({
    stats: null,
    isLoading: false,
    error: null,
    lastFetched: null,
  });

  const fetchStatistics = useCallback(async (force = false) => {
    if (!isAuthenticated) return;

    // Check cache
    const now = Date.now();
    if (!force && state.lastFetched && (now - state.lastFetched) < cacheTime) {
      return state.stats;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const stats = await getUserStatistics();
      setState({
        stats,
        isLoading: false,
        error: null,
        lastFetched: now,
      });
      return stats;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch user statistics',
      }));
      throw error;
    }
  }, [getUserStatistics, isAuthenticated, state.lastFetched, state.stats, cacheTime]);

  const refresh = useCallback(() => {
    return fetchStatistics(true);
  }, [fetchStatistics]);

  const reset = useCallback(() => {
    setState({
      stats: null,
      isLoading: false,
      error: null,
      lastFetched: null,
    });
  }, []);

  // Auto-fetch on mount and auth status change
  useEffect(() => {
    if (autoFetch && isAuthenticated && !state.stats && !state.isLoading) {
      fetchStatistics();
    }
  }, [autoFetch, isAuthenticated, state.stats, state.isLoading, fetchStatistics]);

  // Reset when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      reset();
    }
  }, [isAuthenticated, reset]);

  return {
    ...state,
    fetch: fetchStatistics,
    refresh,
    reset,
    isStale: state.lastFetched ? (Date.now() - state.lastFetched) > cacheTime : true,
  };
};

export default useUserStatistics;
