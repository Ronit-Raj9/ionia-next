// ==========================================
// 🔐 ENHANCED AUTH PROVIDER WITH SESSION MONITORING
// ==========================================

'use client';

import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import SessionWarning from '@/features/auth/components/SessionWarning';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { 
    initializeAuth, 
    isInitialized, 
    isAuthenticated,
    updateActivity,
    checkSessionStatus,
    extendSession,
    logout,
    sessionWarning
  } = useAuthStore();
  
  const [isHydrated, setHydrated] = useState(false);
  const [sessionStatus, setSessionStatus] = useState({ isExpiring: false, timeRemaining: 0 });

  // Handle store hydration
  useEffect(() => {
    // Set hydrated to true after mount to avoid hydration mismatch
    setHydrated(true);
    
    const unsubscribe = useAuthStore.persist?.onFinishHydration?.(() => {
      // Additional hydration logic if needed
    });
    
    return unsubscribe;
  }, []);

  // Initialize auth after hydration
  useEffect(() => {
    if (isHydrated && !isInitialized) {
      console.log('🚀 Starting auth initialization...');
      initializeAuth();
    }
  }, [isHydrated, isInitialized, initializeAuth]);

  // Session monitoring
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) return;

    const checkSession = () => {
      const status = checkSessionStatus();
      setSessionStatus(status);
      
      // Auto logout if session expired
      if (status.timeRemaining <= 0) {
        logout('expired');
      }
    };

    // Check session status every minute
    const interval = setInterval(checkSession, 60000);
    
    // Initial check
    checkSession();

    return () => clearInterval(interval);
  }, [isAuthenticated, isInitialized, checkSessionStatus, logout]);

  // Activity tracking
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => updateActivity();
    
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, updateActivity]);

  // Global error handler for authentication errors
  useEffect(() => {
    if (!isAuthenticated || !isInitialized) return;

    const handleGlobalError = (event: ErrorEvent) => {
      // Check if this is an authentication error from our API calls
      if (event.error && event.error.isRefreshFailed) {
        console.log('🔄 Global auth error detected, logging out...');
        logout('expired');
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, [isAuthenticated, isInitialized, logout]);

  // Format remaining time for display
  const formatTime = useCallback((ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const handleExtendSession = useCallback(() => {
    extendSession();
    // Get updated session status after extension
    const status = checkSessionStatus();
    setSessionStatus(status);
  }, [extendSession, checkSessionStatus]);

  const handleLogout = useCallback(() => {
    logout('manual');
  }, [logout]);

  // Show loading until hydrated and initialized
  if (!isHydrated || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {/* Session Warning */}
      {isAuthenticated && sessionWarning && sessionStatus.isExpiring && (
        <SessionWarning
          isVisible={true}
          onExtend={handleExtendSession}
          onLogout={handleLogout}
        />
      )}
      
      {children}
    </>
  );
};

export default AuthProvider;