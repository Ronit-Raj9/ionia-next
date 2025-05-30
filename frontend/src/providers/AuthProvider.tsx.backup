'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore, startTokenMonitoring, stopTokenMonitoring, startTabSynchronization, trackUserActivity } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { API } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SessionSync from '@/components/auth/SessionSync';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { 
    user, 
    isAuthenticated, 
    setUser, 
    setLoading, 
    setError, 
    logout,
    refreshToken,
    isRefreshing 
  } = useAuthStore();
  const { setGlobalLoading, addNotification } = useUIStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setGlobalLoading(true);
        setLoading(true);

        // Start all monitoring services
        startTokenMonitoring();
        
        // Start tab synchronization
        const tabSyncCleanup = startTabSynchronization();
        
        // Start activity tracking
        const activityCleanup = trackUserActivity();

        // If user is marked as authenticated, verify with the server
        if (isAuthenticated && !user) {
          try {
            const response = await API.auth.getCurrentUser();
            if (response.data) {
              setUser(response.data);
            }
          } catch (error) {
            console.warn('Failed to get current user, attempting token refresh:', error);
            // Try to refresh token before giving up
            const refreshed = await refreshToken();
            if (refreshed) {
              try {
                const response = await API.auth.getCurrentUser();
                if (response.data) {
                  setUser(response.data);
                }
              } catch (retryError) {
                console.error('Auth verification failed after refresh:', retryError);
                logout();
              }
            }
          }
        }

        // Initialize theme
        const { setTheme } = useUIStore.getState();
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
        setTheme(savedTheme);

        // Check for expired session on app load
        if (isAuthenticated) {
          const lastActivity = localStorage.getItem('lastActivity');
          if (lastActivity) {
            const inactiveTime = Date.now() - parseInt(lastActivity);
            // If inactive for more than 24 hours, force logout
            if (inactiveTime > 24 * 60 * 60 * 1000) {
              console.log('Session expired due to prolonged inactivity');
              logout();
              addNotification({
                type: 'warning',
                title: 'Session Expired',
                message: 'You have been logged out due to inactivity.',
                duration: 5000,
              });
            }
          }
        }

        // Store cleanup functions for later
        if (typeof window !== 'undefined') {
          (window as any).__authCleanup = () => {
            stopTokenMonitoring();
            if (tabSyncCleanup) tabSyncCleanup();
            if (activityCleanup) activityCleanup();
          };
        }

      } catch (error) {
        console.error('Auth initialization failed:', error);
        setError('Failed to initialize authentication');
        addNotification({
          type: 'error',
          title: 'Initialization Error',
          message: 'Failed to initialize authentication. Please refresh the page.',
          duration: 10000,
        });
      } finally {
        setLoading(false);
        setGlobalLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined' && (window as any).__authCleanup) {
        (window as any).__authCleanup();
      }
    };
  }, []); // Remove dependencies to run only once

  // Handle tab focus to check auth status and refresh if needed
  useEffect(() => {
    const handleFocus = async () => {
      if (isAuthenticated && user && !isRefreshing) {
        try {
          // Check if token needs refresh
          const { checkTokenExpiration } = useAuthStore.getState();
          if (checkTokenExpiration()) {
            console.log('Token expiring soon, refreshing on focus...');
            await refreshToken();
          }
          
          // Silently verify user is still authenticated
          await API.auth.getCurrentUser();
        } catch (error) {
          console.warn('Auth check on focus failed:', error);
          // Try to refresh token
          const refreshed = await refreshToken();
          if (!refreshed) {
            addNotification({
              type: 'warning',
              title: 'Session Expired',
              message: 'Your session has expired. Please log in again.',
              duration: 5000,
            });
          }
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user, isRefreshing, refreshToken, addNotification]);

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      addNotification({
        type: 'success',
        title: 'Connection Restored',
        message: 'You are back online!',
        duration: 3000,
      });
      
      // Try to refresh auth state when back online
      if (isAuthenticated) {
        refreshToken().catch(console.warn);
      }
    };

    const handleOffline = () => {
      addNotification({
        type: 'warning',
        title: 'Connection Lost',
        message: 'You are currently offline. Some features may not work.',
        duration: 5000,
        persistent: true,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification, isAuthenticated, refreshToken]);

  // Handle page visibility change for better security
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Page became visible, update activity
        const { updateActivity } = useAuthStore.getState();
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <SessionSync />
      {children}
    </ErrorBoundary>
  );
}

// Enhanced hook to get authentication status
export function useAuth() {
  const authStore = useAuthStore();
  
  return {
    ...authStore,
    // Computed properties
    isAdmin: authStore.hasRole('admin'),
    isSuperAdmin: authStore.hasRole('superadmin'),
    // Helper methods
    login: API.auth.login,
    logout: API.auth.logout,
    register: API.auth.register,
  };
}

// Enhanced hook to check if user has specific permissions
export function usePermissions() {
  const { hasRole, hasAnyRole, user } = useAuthStore();
  
  return {
    hasRole,
    hasAnyRole,
    canAccessAdmin: hasRole('admin'),
    canAccessSuperAdmin: hasRole('superadmin'),
    isOwner: (resourceUserId: string) => user?.id === resourceUserId,
    canManageUsers: hasRole('admin'),
    canManageTests: hasAnyRole(['admin', 'superadmin']),
    canViewAnalytics: hasAnyRole(['admin', 'superadmin']),
  };
}

// Hook for route protection logic
export function useRouteProtection() {
  const { isAuthenticated, isLoading, hasRole } = useAuthStore();
  
  return {
    isAuthenticated,
    isLoading,
    requireAuth: (redirectTo = '/auth/login') => {
      if (!isLoading && !isAuthenticated) {
        if (typeof window !== 'undefined') {
          window.location.href = `${redirectTo}?returnUrl=${window.location.pathname}`;
        }
        return false;
      }
      return true;
    },
    requireRole: (role: 'user' | 'admin' | 'superadmin', redirectTo = '/dashboard') => {
      if (!isLoading && (!isAuthenticated || !hasRole(role))) {
        if (typeof window !== 'undefined') {
          window.location.href = redirectTo;
        }
        return false;
      }
      return true;
    },
  };
} 