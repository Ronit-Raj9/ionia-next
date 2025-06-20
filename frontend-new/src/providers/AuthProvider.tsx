// ==========================================
// 🌐 AUTH PROVIDER LAYER - GLOBAL CONTEXT
// ==========================================

'use client';

import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

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

/**
 * This provider is responsible for initializing the authentication state when the application loads.
 * It waits for the Zustand store to be rehydrated from storage before attempting to validate
 * the user's session, thus preventing race conditions.
 */
const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  config = {},
}) => {
  const {
    sessionWarningEnabled = true,
    enableDebugLogs = false,
    onAuthError,
  } = config;

  const [isHydrated, setHydrated] = useState(false);
  const { isInitialized, initializeAuth } = useAuthStore();

  // ==========================================
  // 🔄 INITIALIZATION EFFECT
  // ==========================================

  // This effect waits for the Zustand store to finish rehydrating from localStorage/sessionStorage.
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Also set hydrated if it's already done.
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Once the store is hydrated, we can safely initialize our auth state.
  useEffect(() => {
    if (isHydrated && !isInitialized) {
      initializeAuth();
    }
  }, [isHydrated, isInitialized, initializeAuth]);

  // ==========================================
  // 🛠️ PROVIDER CONTEXT VALUE
  // ==========================================

  const contextValue: AuthProviderContextType = {
    isInitialized: isInitialized,
    initializationError: null,
    sessionWarningEnabled: sessionWarningEnabled,
    
    toggleSessionWarning: (enabled: boolean) => {
      // Implementation needed
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

  // While hydrating and initializing, we can show a global loader here
  // to prevent layout shifts or components flashing.
  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>
        {/* You can replace this with a more sophisticated loader component */}
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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

export default AuthProvider;

// ==========================================
// 🎯 TYPE EXPORTS
// ==========================================

export type {
  AuthProviderConfig,
  AuthProviderContextType,
};