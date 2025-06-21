// ==========================================
// 🌐 AUTH PROVIDER LAYER - GLOBAL CONTEXT
// ==========================================

'use client';

import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { clearAllCachedData } from '@/features/auth/api/authApi';

// ==========================================
// 🎯 AUTH PROVIDER CONTEXT
// ==========================================

interface AuthProviderContextType {
  // Core authentication state
  isInitialized: boolean;
  
  // Global auth actions
  logout: () => void;
}

const AuthProviderContext = createContext<AuthProviderContextType | null>(null);

// ==========================================
// 🔧 AUTH PROVIDER CONFIGURATION
// ==========================================

interface AuthProviderProps {
  children: ReactNode;
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
  children
}) => {
  const { isInitialized, initializeAuth, logout } = useAuthStore();
  const [isHydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());

  // ==========================================
  // 🔄 INITIALIZATION EFFECT
  // ==========================================

  // This effect waits for the Zustand store to finish rehydrating from localStorage/sessionStorage.
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    
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
    logout: () => {
      logout('manual');
      clearAllCachedData();
    }
  };

  // ==========================================
  // 📱 RENDER PROVIDER
  // ==========================================

  // While hydrating and initializing, we can show a global loader here
  // to prevent layout shifts or components flashing.
  if (!isHydrated || !isInitialized) {
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
// 📤 EXPORTS
// ==========================================

export default AuthProvider;

// ==========================================
// 🎯 TYPE EXPORTS
// ==========================================

export type {
  AuthProviderContextType,
};