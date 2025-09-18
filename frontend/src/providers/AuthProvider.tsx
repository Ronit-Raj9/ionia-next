// ==========================================
// 🔐 SIMPLIFIED AUTH PROVIDER - JWT ONLY
// ==========================================

'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import AuthErrorBoundary from '@/features/auth/components/AuthErrorBoundary';
import { authLogger } from '@/features/auth/utils/logger';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    initializeAuth, 
    isInitialized, 
    isAuthenticated,
    handleRefreshExpiry,
    setupCrossTabSync
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 Starting auth initialization...');
      
      // 🔥 INITIALIZE CSRF TOKEN HANDLING
      const initializeCSRF = () => {
        // Check if CSRF token exists in cookies
        const cookies = document.cookie.split(';');
        const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='));
        if (csrfCookie) {
          console.log('🔒 CSRF token found in cookies');
        } else {
          console.log('⚠️ No CSRF token found - will be set on login');
        }
      };
      
      initializeCSRF();
      authLogger.authFlow('provider initialization started', {});
      initializeAuth().catch((error) => {
        authLogger.error('Provider initialization failed', { error: error.message }, 'AUTH');
      });
    }
  }, [isInitialized, initializeAuth]);

  // Setup cross-tab sync
  useEffect(() => {
    const cleanup = setupCrossTabSync();
    authLogger.crossTabSync('setup completed', {});
    
    return cleanup;
  }, [setupCrossTabSync]);

  // Global error handler for authentication failures
  useEffect(() => {
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

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleRefreshExpiry]);

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