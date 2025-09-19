import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminAnalytics } from '@/features/admin/types';

interface AnalyticsCacheState {
  // Cache data
  analytics: AdminAnalytics | null;
  lastFetched: number | null;
  isStale: boolean;
  
  // Cache settings
  cacheExpiryMinutes: number;
  
  // Actions
  setAnalytics: (analytics: AdminAnalytics) => void;
  clearCache: () => void;
  markAsStale: () => void;
  shouldRefresh: () => boolean;
  getCachedAnalytics: () => AdminAnalytics | null;
}

// Default cache expiry: 10 minutes (increased for better performance)
const DEFAULT_CACHE_EXPIRY_MINUTES = 10;

export const useAnalyticsCacheStore = create<AnalyticsCacheState>()(
  persist(
    (set, get) => ({
      // Initial state
      analytics: null,
      lastFetched: null,
      isStale: false,
      cacheExpiryMinutes: DEFAULT_CACHE_EXPIRY_MINUTES,

      // Actions
      setAnalytics: (analytics: AdminAnalytics) => {
        set({
          analytics,
          lastFetched: Date.now(),
          isStale: false,
        });
      },

      clearCache: () => {
        set({
          analytics: null,
          lastFetched: null,
          isStale: false,
        });
      },

      markAsStale: () => {
        set({ isStale: true });
      },

      shouldRefresh: () => {
        const state = get();
        const { lastFetched, cacheExpiryMinutes, isStale } = state;
        
        // If no data or explicitly marked as stale
        if (!lastFetched || isStale) {
          return true;
        }
        
        // Check if cache has expired
        const now = Date.now();
        const expiryTime = lastFetched + (cacheExpiryMinutes * 60 * 1000);
        
        return now >= expiryTime;
      },

      getCachedAnalytics: () => {
        const state = get();
        const { analytics, shouldRefresh } = state;
        
        // Return cached data if it's still fresh
        if (!shouldRefresh() && analytics) {
          return analytics;
        }
        
        return null;
      },
    }),
    {
      name: 'analytics-cache', // localStorage key
      // Only persist the data, not the computed values
      partialize: (state) => ({
        analytics: state.analytics,
        lastFetched: state.lastFetched,
        cacheExpiryMinutes: state.cacheExpiryMinutes,
      }),
      // Version for cache invalidation
      version: 1,
    }
  )
);

// Utility functions for external use
export const analyticsCacheUtils = {
  // Get cached data if fresh, otherwise return null
  getCachedData: (): AdminAnalytics | null => {
    const store = useAnalyticsCacheStore.getState();
    return store.getCachedAnalytics();
  },

  // Check if we should refresh the data
  shouldRefreshData: (): boolean => {
    const store = useAnalyticsCacheStore.getState();
    return store.shouldRefresh();
  },

  // Update cache with new data
  updateCache: (analytics: AdminAnalytics): void => {
    const store = useAnalyticsCacheStore.getState();
    store.setAnalytics(analytics);
  },

  // Clear all cached data
  clearCache: (): void => {
    const store = useAnalyticsCacheStore.getState();
    store.clearCache();
  },

  // Force mark cache as stale (useful when data might be outdated)
  markStale: (): void => {
    const store = useAnalyticsCacheStore.getState();
    store.markAsStale();
  },

  // Get cache info for debugging
  getCacheInfo: () => {
    const store = useAnalyticsCacheStore.getState();
    return {
      hasData: !!store.analytics,
      lastFetched: store.lastFetched,
      isStale: store.isStale,
      shouldRefresh: store.shouldRefresh(),
      cacheAge: store.lastFetched ? Date.now() - store.lastFetched : null,
    };
  },
};
