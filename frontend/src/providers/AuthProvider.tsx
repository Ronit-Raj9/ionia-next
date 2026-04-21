// ==========================================
// 🔐 SIMPLIFIED AUTH PROVIDER - JWT ONLY
// ==========================================

'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import AuthErrorBoundary from '@/features/auth/components/AuthErrorBoundary';
import { authLogger } from '@/features/auth/utils/logger';
import { getAuthApiBaseUrl } from '@/features/auth/utils/apiBaseUrl';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    initializeAuth, 
    isInitialized, 
    isAuthenticated,
    handleRefreshExpiry,
    setupCrossTabSync,
    cleanupCrossTabSync,
    processOfflineQueue,
    isOnline,
    startBackgroundRefresh,
    stopBackgroundRefresh,
    cleanup
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      authLogger.authFlow('Starting auth initialization', {});
      
      // 🔥 INITIALIZE CSRF TOKEN HANDLING
      const initializeCSRF = () => {
        // Check if CSRF token exists in cookies
        const cookies = document.cookie.split(';');
        const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='));
        if (csrfCookie) {
          const token = csrfCookie.split('=')[1];
          // Enhanced token validation
          if (token && token.length > 10 && /^[a-zA-Z0-9_-]+$/.test(token)) {
            authLogger.info('CSRF token found and validated', {});
            // Store validated token for future use
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('csrf_token_validated', 'true');
            }
          } else {
            authLogger.warn('Invalid CSRF token format', {});
            // Clear invalid token
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('csrf_token_validated');
            }
          }
        } else {
          authLogger.warn('No CSRF token found - will be set on login', {});
          // Clear validation flag
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('csrf_token_validated');
          }
        }
      };
      
      initializeCSRF();
      authLogger.authFlow('provider initialization started', {});
      initializeAuth().catch((error: any) => {
        authLogger.error('Provider initialization failed', { error: error.message });
      });
    }
  }, [isInitialized, initializeAuth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      authLogger.info('Cleaning up AuthProvider', {});
      cleanup();
    };
  }, [cleanup]);

  // Setup cross-tab sync and online/offline detection - optimized single useEffect
  useEffect(() => {
    // Setup cross-tab sync
    setupCrossTabSync();
    authLogger.crossTabSync('setup completed', {});
    
    // Setup online/offline detection
    const handleOnline = () => {
      authLogger.info('Connection restored', {});
      
      // Process offline queue when connection is restored
      processOfflineQueue().catch((error: any) => {
        authLogger.error('Failed to process offline queue', { error: error.message });
      });
    };

    const handleOffline = () => {
      authLogger.info('Connection lost', {});
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      cleanupCrossTabSync();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Remove dependencies to prevent unnecessary re-renders


  // Global error handler and logout reliability setup - optimized single useEffect
  useEffect(() => {
    // Global error handler for authentication failures
    const handleGlobalError = (event: ErrorEvent) => {
      // Check if this is a refresh failure error
      if (event.error && event.error.isRefreshFailed) {
        authLogger.securityEvent('global refresh failure detected', { error: event.error.message });
        handleRefreshExpiry();
      }
    };

    // Listen for unhandled promise rejections (refresh failures)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.isRefreshFailed) {
        authLogger.securityEvent('unhandled refresh failure detected', { error: event.reason.message });
        handleRefreshExpiry();
      }
    };

    // Setup logout reliability with sendBeacon
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable logout on page unload
      if (isAuthenticated && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const apiBase = getAuthApiBaseUrl();
        const logoutUrl = `${apiBase}/users/logout`;
        
        authLogger.info('Sending logout beacon on page unload', {});
        navigator.sendBeacon(logoutUrl, '');
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Remove dependencies to prevent unnecessary re-renders

  // Show loading until initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthErrorBoundary>
      {children}
    </AuthErrorBoundary>
  );
};

export default AuthProvider;