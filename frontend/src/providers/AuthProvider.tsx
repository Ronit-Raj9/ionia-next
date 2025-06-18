'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore, startTokenMonitoring, stopTokenMonitoring } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { API } from '@/lib/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
    logout 
  } = useAuthStore();
  const { setGlobalLoading, addNotification } = useUIStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setGlobalLoading(true);
        setLoading(true);

        // Start token monitoring
        startTokenMonitoring();

        // If user is marked as authenticated, verify with the server
        if (isAuthenticated && !user) {
          try {
            const response = await API.auth.getCurrentUser();
            if (response.data) {
              setUser(response.data);
            }
          } catch (error) {
            console.warn('Failed to get current user:', error);
            // Don't logout here, let the token monitoring handle expired tokens
          }
        }

        // Initialize theme
        const { setTheme } = useUIStore.getState();
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
        setTheme(savedTheme);

      } catch (error) {
        console.error('Auth initialization failed:', error);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
        setGlobalLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      stopTokenMonitoring();
    };
  }, [isAuthenticated, user, setUser, setLoading, setError, setGlobalLoading]);

  // Handle tab focus to check auth status
  useEffect(() => {
    const handleFocus = async () => {
      if (isAuthenticated && user) {
        try {
          // Silently check if user is still authenticated
          await API.auth.getCurrentUser();
        } catch (error) {
          console.warn('Auth check on focus failed:', error);
          // Token monitoring will handle logout if needed
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, user]);

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      addNotification({
        type: 'success',
        title: 'Connection Restored',
        message: 'You are back online!',
        duration: 3000,
      });
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
  }, [addNotification]);

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
      {children}
    </ErrorBoundary>
  );
}

// Hook to get authentication status
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

// Hook to check if user has specific permissions
export function usePermissions() {
  const { hasRole, hasAnyRole, user } = useAuthStore();
  
  return {
    hasRole,
    hasAnyRole,
    canAccessAdmin: hasRole('admin'),
    canAccessSuperAdmin: hasRole('superadmin'),
    isOwner: (resourceUserId: string) => user?.id === resourceUserId,
  };
} 
 
 