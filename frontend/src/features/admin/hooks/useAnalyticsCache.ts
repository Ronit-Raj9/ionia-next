import { useEffect } from 'react';
import { useAnalyticsCacheStore, analyticsCacheUtils } from '@/stores/analyticsCacheStore';
import { useAdminStore } from '../store/adminStore';

/**
 * Hook to manage analytics cache initialization and hydration
 */
export const useAnalyticsCache = () => {
  const { analytics, loading } = useAdminStore();
  const cacheState = useAnalyticsCacheStore();

  // Initialize cache on mount - only run once
  useEffect(() => {
    const initializeCache = async () => {
      // Check if we have cached data and it's still fresh
      const cachedData = analyticsCacheUtils.getCachedData();
      
      if (cachedData && !loading.has('analytics')) {
        console.log('📊 Analytics: Hydrating store with cached data');
        useAdminStore.setState({ analytics: cachedData });
      } else if (!loading.has('analytics') && !analytics) {
        // Only fetch if not already loading and no data in store
        console.log('📊 Analytics: Fetching fresh data on initialization');
        useAdminStore.getState().fetchAdminAnalytics();
      }
    };

    initializeCache();
  }, []); // Empty dependency array - only run once

  // Sync store data with cache when analytics changes - but only if different
  useEffect(() => {
    if (analytics && !loading.has('analytics')) {
      // Only update cache if data is different from cached data
      const cachedData = analyticsCacheUtils.getCachedData();
      if (!cachedData || JSON.stringify(cachedData) !== JSON.stringify(analytics)) {
        analyticsCacheUtils.updateCache(analytics);
      }
    }
  }, [analytics]); // Removed loading from dependencies to prevent unnecessary updates

  return {
    // Cache utilities - memoized to prevent unnecessary re-renders
    shouldRefresh: analyticsCacheUtils.shouldRefreshData(),
    clearCache: analyticsCacheUtils.clearCache,
    markStale: analyticsCacheUtils.markStale,
    getCacheInfo: analyticsCacheUtils.getCacheInfo,
    
    // Cache state
    hasCachedData: !!cacheState.analytics,
    lastFetched: cacheState.lastFetched,
    isStale: cacheState.isStale,
  };
};

/**
 * Hook for components that need to refresh analytics data
 */
export const useAnalyticsRefresh = () => {
  const { fetchAdminAnalytics, refreshAdminAnalytics } = useAdminStore();
  const { clearCache } = useAnalyticsCacheStore();

  const refresh = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      return refreshAdminAnalytics();
    } else {
      return fetchAdminAnalytics();
    }
  };

  const forceRefresh = () => refresh(true);
  const clearCacheAndRefresh = () => {
    clearCache();
    return refresh(true);
  };

  return {
    refresh,
    forceRefresh,
    clearCacheAndRefresh,
    markAsStale: () => useAnalyticsCacheStore.getState().markAsStale(),
  };
};
