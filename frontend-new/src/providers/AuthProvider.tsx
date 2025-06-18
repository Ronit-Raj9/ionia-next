// ==========================================
// 🌐 AUTH PROVIDER LAYER - GLOBAL CONTEXT
// ==========================================

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import { AuthService } from '../services/authService';
import { TokenUtils } from '../utils/tokenUtils';
import { SessionWarning } from '../components/auth/AuthComponents';

// ==========================================
// 🎯 AUTH PROVIDER CONTEXT
// ==========================================

interface AuthProviderContextType {
  // Core authentication state
  isInitialized: boolean;
  initializationError: string | null;
  
  // Session management
  sessionWarningEnabled: boolean;
  toggleSessionWarning: (enabled: boolean) => void;
  
  // Global auth actions
  refreshApp: () => void;
  clearAllData: () => void;
}

const AuthProviderContext = createContext<AuthProviderContextType | null>(null);

// ==========================================
// 🔧 AUTH PROVIDER CONFIGURATION
// ==========================================

interface AuthProviderConfig {
  // Session management
  sessionWarningEnabled?: boolean;
  sessionWarningThreshold?: number; // milliseconds
  autoRefreshTokens?: boolean;
  refreshTokenThreshold?: number; // milliseconds before expiry
  
  // Error handling
  onAuthError?: (error: Error) => void;
  onSessionExpired?: () => void;
  onTokenRefreshFailed?: (error: Error) => void;
  
  // Development settings
  enableDebugLogs?: boolean;
  apiBaseUrl?: string;
  
  // UI settings
  showSessionWarning?: boolean;
  sessionWarningPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface AuthProviderProps {
  children: ReactNode;
  config?: AuthProviderConfig;
}

// ==========================================
// 🚀 MAIN AUTH PROVIDER COMPONENT
// ==========================================

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  config = {},
}) => {
  const {
    sessionWarningEnabled = true,
    sessionWarningThreshold = 5 * 60 * 1000, // 5 minutes
    autoRefreshTokens = true,
    refreshTokenThreshold = 10 * 60 * 1000, // 10 minutes
    onAuthError,
    onSessionExpired,
    onTokenRefreshFailed,
    enableDebugLogs = false,
    apiBaseUrl,
    showSessionWarning = true,
    sessionWarningPosition = 'top-right',
  } = config;

  // Zustand store state
  const {
    isInitialized,
    initializationError,
    user,
    isAuthenticated,
    tokens,
    sessionData,
    initialize,
    logout,
    refreshTokens,
    clearAuthState,
  } = useAuthStore();

  // Local state for provider configuration
  const [providerState, setProviderState] = React.useState({
    sessionWarningEnabled,
    isRefreshing: false,
  });

  // ==========================================
  // 🔄 INITIALIZATION EFFECT
  // ==========================================

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (enableDebugLogs) {
          console.log('🔐 AuthProvider: Initializing authentication system...');
        }

        // Set API base URL if provided
        if (apiBaseUrl) {
          AuthService.setBaseUrl(apiBaseUrl);
        }

        // Initialize the auth store
        await initialize();

        if (enableDebugLogs) {
          console.log('✅ AuthProvider: Authentication system initialized successfully');
        }
      } catch (error) {
        console.error('❌ AuthProvider: Failed to initialize authentication:', error);
        onAuthError?.(error as Error);
      }
    };

    if (!isInitialized && !initializationError) {
      initializeAuth();
    }
  }, [initialize, isInitialized, initializationError, apiBaseUrl, enableDebugLogs, onAuthError]);

  // ==========================================
  // 🔄 TOKEN REFRESH EFFECT
  // ==========================================

  useEffect(() => {
    if (!autoRefreshTokens || !isAuthenticated || !tokens?.accessToken) {
      return;
    }

    const checkAndRefreshToken = async () => {
      try {
        const { shouldRefresh, timeUntilExpiry } = TokenUtils.shouldRefreshToken(
          tokens.accessToken,
          refreshTokenThreshold
        );

        if (shouldRefresh && !providerState.isRefreshing) {
          if (enableDebugLogs) {
            console.log('🔄 AuthProvider: Auto-refreshing tokens...');
          }

          setProviderState(prev => ({ ...prev, isRefreshing: true }));
          
          await refreshTokens();
          
          setProviderState(prev => ({ ...prev, isRefreshing: false }));

          if (enableDebugLogs) {
            console.log('✅ AuthProvider: Tokens refreshed successfully');
          }
        }
      } catch (error) {
        console.error('❌ AuthProvider: Token refresh failed:', error);
        setProviderState(prev => ({ ...prev, isRefreshing: false }));
        onTokenRefreshFailed?.(error as Error);
        
        // If refresh fails, logout the user
        await logout();
        onSessionExpired?.();
      }
    };

    // Check immediately
    checkAndRefreshToken();

    // Set up interval to check periodically
    const interval = setInterval(checkAndRefreshToken, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [
    autoRefreshTokens,
    isAuthenticated,
    tokens,
    refreshTokens,
    logout,
    refreshTokenThreshold,
    providerState.isRefreshing,
    enableDebugLogs,
    onTokenRefreshFailed,
    onSessionExpired,
  ]);

  // ==========================================
  // 🎯 SESSION EXPIRY MONITORING
  // ==========================================

  useEffect(() => {
    if (!isAuthenticated || !sessionData?.expiresAt) {
      return;
    }

    const checkSessionExpiry = () => {
      const now = Date.now();
      const expiryTime = new Date(sessionData.expiresAt).getTime();
      const timeUntilExpiry = expiryTime - now;

      // If session has expired
      if (timeUntilExpiry <= 0) {
        if (enableDebugLogs) {
          console.log('⏰ AuthProvider: Session expired, logging out user');
        }
        logout();
        onSessionExpired?.();
        return;
      }
    };

    // Check immediately
    checkSessionExpiry();

    // Set up interval to check session expiry
    const interval = setInterval(checkSessionExpiry, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, sessionData, logout, enableDebugLogs, onSessionExpired]);

  // ==========================================
  // 🛠️ PROVIDER CONTEXT VALUE
  // ==========================================

  const contextValue: AuthProviderContextType = {
    isInitialized,
    initializationError,
    sessionWarningEnabled: providerState.sessionWarningEnabled,
    
    toggleSessionWarning: (enabled: boolean) => {
      setProviderState(prev => ({ ...prev, sessionWarningEnabled: enabled }));
    },
    
    refreshApp: () => {
      window.location.reload();
    },
    
    clearAllData: async () => {
      await clearAuthState();
      // Clear any additional app data here
      localStorage.clear();
      sessionStorage.clear();
    },
  };

  // ==========================================
  // 📱 RENDER PROVIDER
  // ==========================================

  // Show loading state during initialization
  if (!isInitialized && !initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Failed to initialize authentication system: {initializationError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthProviderContext.Provider value={contextValue}>
      {children}
      
      {/* Session Warning Component */}
      {showSessionWarning && providerState.sessionWarningEnabled && isAuthenticated && (
        <div className={`fixed z-50 ${getSessionWarningPositionClasses(sessionWarningPosition)}`}>
          <SessionWarning
            threshold={sessionWarningThreshold}
            onExtend={() => {
              if (enableDebugLogs) {
                console.log('🔄 AuthProvider: Session extended by user');
              }
            }}
            onLogout={() => {
              if (enableDebugLogs) {
                console.log('🚪 AuthProvider: User chose to logout from session warning');
              }
            }}
          />
        </div>
      )}
    </AuthProviderContext.Provider>
  );
};

// ==========================================
// 🎨 HELPER FUNCTIONS
// ==========================================

const getSessionWarningPositionClasses = (position: string): string => {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'bottom-right':
      return 'bottom-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    default:
      return 'top-4 right-4';
  }
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
// 🛡️ ADMIN PROVIDER - ENHANCED FOR ADMIN FEATURES
// ==========================================

interface AdminProviderProps {
  children: ReactNode;
  requireSuperAdmin?: boolean;
  fallback?: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({
  children,
  requireSuperAdmin = false,
  fallback,
}) => {
  const { user, isAuthenticated } = useAuthStore();

  // Check if user has admin privileges
  const hasAdminAccess = isAuthenticated && user && (
    user.role === 'admin' || 
    user.role === 'superadmin' ||
    (!requireSuperAdmin && user.role === 'moderator')
  );

  // Check for super admin specifically
  const hasSuperAdminAccess = isAuthenticated && user?.role === 'superadmin';

  if (requireSuperAdmin && !hasSuperAdminAccess) {
    return <>{fallback || <div>Super Admin access required</div>}</>;
  }

  if (!hasAdminAccess) {
    return <>{fallback || <div>Admin access required</div>}</>;
  }

  return <>{children}</>;
};

// ==========================================
// 🔧 DEVELOPMENT PROVIDER - DEV TOOLS
// ==========================================

interface DevProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export const DevProvider: React.FC<DevProviderProps> = ({
  children,
  enabled = process.env.NODE_ENV === 'development',
}) => {
  const authStore = useAuthStore();

  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      // Add auth store to window for debugging
      (window as any).__AUTH_STORE__ = authStore;
      
      // Add helper functions for development
      (window as any).__AUTH_DEBUG__ = {
        getState: () => authStore,
        clearAuth: () => authStore.clearAuthState(),
        simulateExpiry: () => {
          // Simulate token expiry for testing
          const expiredToken = TokenUtils.createMockToken({ exp: Math.floor(Date.now() / 1000) - 1 });
          console.log('🧪 Dev: Simulating token expiry', expiredToken);
        },
        testPermissions: (role: string) => {
          console.log('🧪 Dev: Testing permissions for role:', role);
          return authStore.user?.role === role;
        }
      };

      console.log('🧪 Dev: Auth debug tools available on window.__AUTH_DEBUG__');
    }

    return () => {
      if (enabled && typeof window !== 'undefined') {
        delete (window as any).__AUTH_STORE__;
        delete (window as any).__AUTH_DEBUG__;
      }
    };
  }, [enabled, authStore]);

  return <>{children}</>;
};

// ==========================================
// 📤 EXPORTS
// ==========================================

export {
  AuthProvider as default,
  useAuthProvider,
  AdminProvider,
  DevProvider,
};

// ==========================================
// 🎯 TYPE EXPORTS
// ==========================================

export type {
  AuthProviderConfig,
  AuthProviderContextType,
};