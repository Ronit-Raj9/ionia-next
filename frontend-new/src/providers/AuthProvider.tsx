// ==========================================
// 🌐 AUTH PROVIDER LAYER - GLOBAL CONTEXT
// ==========================================

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';

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
    enableDebugLogs = false,
    onAuthError,
  } = config;

  // Local state for provider configuration
  const [providerState, setProviderState] = React.useState({
    sessionWarningEnabled,
    isInitialized: true,
    initializationError: null as string | null,
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

        // Basic initialization - can be extended later
        setProviderState(prev => ({ 
          ...prev, 
          isInitialized: true,
          initializationError: null
        }));

        if (enableDebugLogs) {
          console.log('✅ AuthProvider: Authentication system initialized successfully');
        }
      } catch (error) {
        console.error('❌ AuthProvider: Failed to initialize authentication:', error);
        setProviderState(prev => ({ 
          ...prev, 
          isInitialized: true,
          initializationError: error instanceof Error ? error.message : 'Unknown error'
        }));
        onAuthError?.(error as Error);
      }
    };

    initializeAuth();
  }, [enableDebugLogs, onAuthError]);

  // ==========================================
  // 🛠️ PROVIDER CONTEXT VALUE
  // ==========================================

  const contextValue: AuthProviderContextType = {
    isInitialized: providerState.isInitialized,
    initializationError: providerState.initializationError,
    sessionWarningEnabled: providerState.sessionWarningEnabled,
    
    toggleSessionWarning: (enabled: boolean) => {
      setProviderState(prev => ({ ...prev, sessionWarningEnabled: enabled }));
    },
    
    refreshApp: () => {
      window.location.reload();
    },
    
    clearAllData: async () => {
      // Clear any app data here
      localStorage.clear();
      sessionStorage.clear();
    },
  };

  // ==========================================
  // 📱 RENDER PROVIDER
  // ==========================================

  // Show loading state during initialization
  if (!providerState.isInitialized && !providerState.initializationError) {
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
  if (providerState.initializationError) {
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
            Failed to initialize authentication system: {providerState.initializationError}
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
  // For now, just render children - can be enhanced when auth store is available
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
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      console.log('🧪 Dev: Auth debug tools available');
    }
  }, [enabled]);

  return <>{children}</>;
};

// ==========================================
// 📤 EXPORTS
// ==========================================

export {
  AuthProvider as default,
};

// ==========================================
// 🎯 TYPE EXPORTS
// ==========================================

export type {
  AuthProviderConfig,
  AuthProviderContextType,
};