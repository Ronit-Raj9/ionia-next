// ==========================================
// 🌐 SIMPLIFIED AUTH PROVIDER - ZUSTAND-BASED
// ==========================================

'use client';

import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback, useRef } from 'react';
import { useAuthStore, useSessionStatus } from '@/features/auth/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { areCookiesEnabled } from '@/features/auth/utils/authUtils';

// ==========================================
// 🎯 AUTH PROVIDER CONTEXT
// ==========================================

interface AuthProviderContextType {
  // Core authentication state
  isInitialized: boolean;
  isHydrated: boolean;
  
  // Global auth actions
  logout: () => void;
  
  // Session management (UI only)
  sessionWarning: {
    show: boolean;
    timeRemaining: string;
    extendSession: () => void;
    endSession: () => void;
  };
  
  // Cookie status
  cookieStatus: {
    supported: boolean;
    message: string;
  };
}

const AuthProviderContext = createContext<AuthProviderContextType | null>(null);

// ==========================================
// 🔧 AUTH PROVIDER CONFIGURATION
// ==========================================

interface AuthProviderProps {
  children: ReactNode;
  showSessionWarnings?: boolean;
  sessionWarningThreshold?: number; // in milliseconds
}

// ==========================================
// 🎨 LOADING COMPONENT
// ==========================================

const AuthLoadingScreen: React.FC<{ message?: string }> = ({ message = 'Initializing...' }) => (
  <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center space-y-4"
    >
      <div className="relative">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-emerald-400 rounded-full animate-ping mx-auto"></div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ionia</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </motion.div>
  </div>
);

// ==========================================
// ⚠️ SESSION WARNING COMPONENT
// ==========================================

interface SessionWarningProps {
  isVisible: boolean;
  timeRemaining: string;
  onExtend: () => void;
  onLogout: () => void;
}

const SessionWarning: React.FC<SessionWarningProps> = ({
  isVisible,
  timeRemaining,
  onExtend,
  onLogout,
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-medium">Your session is about to expire</p>
                <p className="text-sm opacity-90">Time remaining: {timeRemaining}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onExtend}
                className="px-4 py-2 bg-white text-yellow-600 rounded-md hover:bg-gray-100 transition-colors font-medium"
              >
                Extend Session
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ==========================================
// 🍪 COOKIE NOTICE COMPONENT
// ==========================================

interface CookieNoticeProps {
  isVisible: boolean;
  onAccept: () => void;
}

const CookieNotice: React.FC<CookieNoticeProps> = ({ isVisible, onAccept }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-red-600 text-white shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-medium">Cookies Required</p>
                <p className="text-sm opacity-90">
                  This application requires cookies for authentication. Please enable cookies in your browser.
                </p>
              </div>
            </div>
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-white text-red-600 rounded-md hover:bg-gray-100 transition-colors font-medium"
            >
              Check Again
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ==========================================
// 🚀 MAIN AUTH PROVIDER COMPONENT
// ==========================================

/**
 * Simplified AuthProvider for Zustand-based authentication
 */
const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  showSessionWarnings = true,
  sessionWarningThreshold = 5 * 60 * 1000, // 5 minutes
}) => {
  const {
    isInitialized,
    initializeAuth,
    logout,
    isAuthenticated,
    isLoading,
  } = useAuthStore();

  const {
    isExpiring,
    formattedRemainingTime,
    extendSession,
    endSession,
  } = useSessionStatus();

  const [isHydrated, setHydrated] = useState(useAuthStore.persist?.hasHydrated() ?? false);
  const [initError, setInitError] = useState<string | null>(null);
  const [cookiesSupported, setCookiesSupported] = useState(true);
  const [showCookieNotice, setShowCookieNotice] = useState(false);

  // ==========================================
  // 🔄 STORE HYDRATION EFFECT
  // ==========================================

  useEffect(() => {
    if (!useAuthStore.persist) {
      console.warn('🏪 Auth store persist is not available');
      setHydrated(true);
      return;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      console.log('🏪 Auth store hydrated');
      setHydrated(true);
    });
    
    return unsubscribe;
  }, []);

  // ==========================================
  // 🍪 COOKIE SUPPORT CHECK
  // ==========================================

  useEffect(() => {
    const checkCookies = () => {
      const supported = areCookiesEnabled();
      setCookiesSupported(supported);
      setShowCookieNotice(!supported);
      
      if (!supported) {
        console.warn('🍪 Cookies are not supported or disabled');
      } else {
        console.log('🍪 Cookies are supported and enabled');
      }
    };

    checkCookies();
  }, []);

  // ==========================================
  // 🚀 AUTH INITIALIZATION EFFECT
  // ==========================================

  useEffect(() => {
    if (isHydrated && !isInitialized && !isLoading && cookiesSupported) {
      const performInitialization = async () => {
        try {
          console.log('🚀 Starting auth initialization...');
          setInitError(null);
          await initializeAuth();
          console.log('✅ Auth initialization completed');
        } catch (error) {
          console.error('❌ Auth initialization failed:', error);
          setInitError('Failed to initialize authentication');
        }
      };

      performInitialization();
    }
  }, [isHydrated, isInitialized, isLoading, cookiesSupported, initializeAuth]);

  // ==========================================
  // 🔄 PROACTIVE REFRESH MANAGEMENT
  // ==========================================

  // Set up proactive refresh interval
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Use the store's proactive refresh mechanism
      useAuthStore.getState().startProactiveRefresh();
      
      // Also refresh on window focus/visibility change
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          useAuthStore.getState().performProactiveRefresh();
        }
      };
      
      const handleFocus = () => {
        useAuthStore.getState().performProactiveRefresh();
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        useAuthStore.getState().stopProactiveRefresh();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      // Stop proactive refresh when not authenticated
      useAuthStore.getState().stopProactiveRefresh();
    }
  }, [isAuthenticated, isLoading]);

  // ==========================================
  // 🛠️ PROVIDER ACTIONS
  // ==========================================

  const handleLogout = useCallback(() => {
    console.log('🚪 Logout requested from provider');
    logout('manual');
  }, [logout]);

  const handleExtendSession = useCallback(() => {
    console.log('⏰ Session extension requested');
    extendSession();
  }, [extendSession]);

  const handleEndSession = useCallback(() => {
    console.log('🔚 Session end requested');
    endSession();
  }, [endSession]);

  const handleCookieCheck = useCallback(() => {
    const supported = areCookiesEnabled();
    setCookiesSupported(supported);
    setShowCookieNotice(!supported);
  }, []);

  // ==========================================
  // 🛠️ PROVIDER CONTEXT VALUE
  // ==========================================

  const contextValue: AuthProviderContextType = {
    isInitialized,
    isHydrated,
    logout: handleLogout,
    sessionWarning: {
      show: showSessionWarnings && isExpiring && isAuthenticated,
      timeRemaining: formattedRemainingTime,
      extendSession: handleExtendSession,
      endSession: handleEndSession,
    },
    cookieStatus: {
      supported: cookiesSupported,
      message: cookiesSupported 
        ? 'Cookies are enabled and working correctly'
        : 'Cookies are disabled or not supported. Please enable cookies to use authentication features.',
    },
  };

  // ==========================================
  // 📱 LOADING STATE RENDERING
  // ==========================================

  if (!isHydrated) {
    return <AuthLoadingScreen message="Loading your session..." />;
  }

  if (!cookiesSupported) {
    return (
      <>
        <AuthLoadingScreen message="Cookies required for authentication" />
        <CookieNotice
          isVisible={showCookieNotice}
          onAccept={handleCookieCheck}
        />
      </>
    );
  }

  if (!isInitialized && isLoading) {
    return <AuthLoadingScreen message="Verifying authentication..." />;
  }

  if (initError) {
    return <AuthLoadingScreen message="Authentication error occurred" />;
  }

  // ==========================================
  // 📱 MAIN RENDER
  // ==========================================

  return (
    <AuthProviderContext.Provider value={contextValue}>
      {/* Session Warning Overlay */}
      <SessionWarning
        isVisible={contextValue.sessionWarning.show}
        timeRemaining={contextValue.sessionWarning.timeRemaining}
        onExtend={contextValue.sessionWarning.extendSession}
        onLogout={contextValue.sessionWarning.endSession}
      />
      
      {/* Cookie Notice */}
      <CookieNotice
        isVisible={showCookieNotice}
        onAccept={handleCookieCheck}
      />
      
      {/* Main App Content */}
      {children}
    </AuthProviderContext.Provider>
  );
};

// ==========================================
// 🎯 PROVIDER CONTEXT HOOK
// ==========================================

export const useAuthProvider = (): AuthProviderContextType => {
  const context = useContext(AuthProviderContext);
  
  if (!context) {
    throw new Error('useAuthProvider must be used within an AuthProvider');
  }
  
  return context;
};

// ==========================================
// 🛡️ SIMPLIFIED AUTH GUARD COMPONENT
// ==========================================

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'user' | 'admin' | 'superadmin';
  requiredPermissions?: string[];
  showLoader?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback = null,
  requireAuth = true,
  requiredRole,
  requiredPermissions = [],
  showLoader = true,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const { isInitialized } = useAuthProvider();

  if (!isInitialized) {
    return showLoader ? <AuthLoadingScreen message="Checking permissions..." /> : null;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Check role hierarchy for admin access
    const roleHierarchy = { user: 1, admin: 2, superadmin: 3 };
    const userLevel = roleHierarchy[user?.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole];
    
    if (userLevel < requiredLevel) {
      return <>{fallback}</>;
    }
  }

  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission =>
      user?.permissions?.includes(permission as any)
    );
    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// ==========================================
// 📤 EXPORTS
// ==========================================

export default AuthProvider;

// ==========================================
// 🎯 TYPE EXPORTS
// ==========================================

export type {
  AuthProviderContextType,
  AuthProviderProps,
};