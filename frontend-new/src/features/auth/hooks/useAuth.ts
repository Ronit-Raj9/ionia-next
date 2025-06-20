// ==========================================
// 🎣 ENHANCED AUTH HOOKS LAYER - REACT INTEGRATION
// ==========================================

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import { 
  validateToken, 
  shouldRefreshToken, 
  getTokenExpiryInfo,
  canAccessResource,
  getAllPermissionsForRole,
  isMinimumRoleLevel,
  getSessionRemainingTime,
  isSessionExpiring,
  formatRemainingTime,
  type PermissionContext,
  type TokenValidation,
  type TokenExpiryInfo 
} from '../utils/authUtils';
import type { UserRole, Permission, User, AuthError, LogoutReason } from '../types';

// ==========================================
// 🏷️ HOOK TYPES & INTERFACES
// ==========================================

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  roles?: UserRole[];
  permissions?: Permission[];
  onAuthError?: (error: AuthError) => void;
  onSessionExpiring?: (remainingTime: number) => void;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: Permission[];
  role: UserRole | null;
  lastActivity: number;
}

interface AuthActions {
  login: (email: string, password: string, options?: { rememberMe?: boolean }) => Promise<{ success: boolean; error?: AuthError }>;
  logout: (reason?: LogoutReason) => Promise<void>;
  register: (userData: any) => Promise<{ success: boolean; error?: AuthError }>;
  refreshAuth: () => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: AuthError }>;
  clearError: () => void;
  updateLastActivity: () => void;
}

interface TokenInfo {
  isValid: boolean;
  isExpired: boolean;
  isExpiring: boolean;
  expiresAt: Date | null;
  expiresIn: number;
  formattedExpiry: string;
  shouldRefresh: boolean;
}

interface SessionInfo {
  isActive: boolean;
  isExpiring: boolean;
  remainingTime: number;
  formattedRemainingTime: string;
  lastActivity: Date;
}

interface PermissionHookReturn {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccess: (context: PermissionContext) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isMinimumRole: (minimumRole: UserRole) => boolean;
  getRoleLevel: () => number;
  getAllPermissions: () => Permission[];
}

// ==========================================
// 🎯 MAIN AUTH HOOK
// ==========================================

/**
 * Main authentication hook with comprehensive state and actions
 */
export const useAuth = (options: UseAuthOptions = {}): AuthState & AuthActions => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Get auth state from store
  const authStore = useAuthStore();
  
  // Local state for UI-specific concerns
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Memoized state
  const authState = useMemo((): AuthState => ({
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading || isInitializing,
    error: authStore.error,
    accessToken: authStore.accessToken?.token || null,
    refreshToken: authStore.refreshToken?.token || null,
    permissions: authStore.user?.permissions || [],
    role: authStore.user?.role || null,
    lastActivity: authStore.lastActivity,
  }), [authStore, isInitializing]);

  // Memoized actions
  const authActions = useMemo((): AuthActions => ({
    login: async (email: string, password: string, loginOptions = {}) => {
      try {
        const result = await authStore.login({
          email,
          password,
          rememberMe: loginOptions.rememberMe || false,
          deviceInfo: {
            userAgent: navigator.userAgent,
            type: 'web',
            name: 'web-browser',
            browser: navigator.userAgent.split(' ')[0] || 'unknown',
          }
        });
        
        return result;
      } catch (error: any) {
        const authError: AuthError = {
          type: 'auth',
          message: error.message || 'Login failed',
          timestamp: Date.now(),
          context: { email }
        };
        
        if (options.onAuthError) {
          options.onAuthError(authError);
        }
        
        return { success: false, error: authError };
      }
    },

    logout: async (reason: LogoutReason = 'manual') => {
      await authStore.logout(reason);
      
      // Redirect after logout if specified
      if (options.redirectTo) {
        router.push(options.redirectTo);
      }
    },

    register: async (userData: any) => {
      try {
        return await authStore.register(userData);
      } catch (error: any) {
        const authError: AuthError = {
          type: 'auth',
          message: error.message || 'Registration failed',
          timestamp: Date.now(),
          context: { email: userData.email }
        };
        
        if (options.onAuthError) {
          options.onAuthError(authError);
        }
        
        return { success: false, error: authError };
      }
    },

    refreshAuth: async () => {
      try {
        const result = await authStore.refreshAuth();
        return result;
      } catch (error) {
        return false;
      }
    },

    updateProfile: async (updates: Partial<User>) => {
      try {
        // This would call your user update API
        // For now, just update the store
        if (authStore.user) {
          authStore.setUser({ ...authStore.user, ...updates });
        }
        return { success: true };
      } catch (error: any) {
        const authError: AuthError = {
          type: 'auth',
          message: error.message || 'Profile update failed',
          timestamp: Date.now(),
        };
        
        return { success: false, error: authError };
      }
    },

    clearError: () => {
      authStore.clearError();
    },

    updateLastActivity: () => {
      authStore.updateActivity();
    },
  }), [authStore, router, options]);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await authStore.initializeAuth();
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  // Handle auth requirements
  useEffect(() => {
    if (isInitializing) return;

    // Check if auth is required
    if (options.requireAuth && !authState.isAuthenticated) {
      const redirectUrl = options.redirectTo || '/auth/login';
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectUrl}?returnUrl=${returnUrl}`);
      return;
    }

    // Check role requirements
    if (options.roles && authState.user && !options.roles.includes(authState.user.role)) {
      if (options.onAuthError) {
        options.onAuthError({
          type: 'permission',
          message: 'Insufficient permissions',
          timestamp: Date.now(),
          context: { requiredRoles: options.roles, userRole: authState.user.role }
        });
      }
      return;
    }

    // Check permission requirements
    if (options.permissions && authState.user) {
      const userPermissions = getAllPermissionsForRole(authState.user.role);
      const hasRequiredPermissions = options.permissions.every(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasRequiredPermissions) {
        if (options.onAuthError) {
          options.onAuthError({
            type: 'permission',
            message: 'Insufficient permissions',
            timestamp: Date.now(),
            context: { requiredPermissions: options.permissions, userPermissions }
          });
        }
        return;
      }
    }
  }, [isInitializing, authState.isAuthenticated, authState.user, pathname, router, options]);

  // Handle session expiring warning
  useEffect(() => {
    if (!authState.isAuthenticated || !options.onSessionExpiring) return;

    const checkSession = () => {
      const remainingTime = getSessionRemainingTime(authState.lastActivity);
      
      if (isSessionExpiring(authState.lastActivity)) {
        options.onSessionExpiring!(remainingTime);
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.lastActivity, options]);

  return {
    ...authState,
    ...authActions,
  };
};

// ==========================================
// 🔐 TOKEN MANAGEMENT HOOK
// ==========================================

/**
 * Hook for token management and monitoring
 */
export const useTokenManager = (): TokenInfo & {
  refreshToken: () => Promise<boolean>;
  isTokenValid: () => boolean;
  getTimeUntilExpiry: () => number;
} => {
  const authStore = useAuthStore();
  const accessTokenString = authStore.accessToken?.token || null;
  
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    isValid: false,
    isExpired: true,
    isExpiring: false,
    expiresAt: null,
    expiresIn: 0,
    formattedExpiry: 'No token',
    shouldRefresh: false,
  });

  // Update token info when token changes
  useEffect(() => {
    if (!accessTokenString) {
      setTokenInfo({
        isValid: false,
        isExpired: true,
        isExpiring: false,
        expiresAt: null,
        expiresIn: 0,
        formattedExpiry: 'No token',
        shouldRefresh: false,
      });
      return;
    }

    const validation = validateToken(accessTokenString);
    const expiryInfo = getTokenExpiryInfo(accessTokenString);
    const shouldRefresh = shouldRefreshToken(accessTokenString);

    setTokenInfo({
      isValid: validation.isValid,
      isExpired: validation.isExpired,
      isExpiring: validation.isExpiring,
      expiresAt: expiryInfo.expiresAt,
      expiresIn: expiryInfo.expiresIn,
      formattedExpiry: expiryInfo.formattedExpiry,
      shouldRefresh,
    });
  }, [accessTokenString]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const result = await authStore.refreshAuth();
      return result;
    } catch (error) {
      return false;
    }
  }, [authStore]);

  const isTokenValid = useCallback((): boolean => {
    if (!accessTokenString) return false;
    const validation = validateToken(accessTokenString);
    return validation.isValid;
  }, [accessTokenString]);

  const getTimeUntilExpiry = useCallback((): number => {
    if (!accessTokenString) return 0;
    const validation = validateToken(accessTokenString);
    return validation.expiresIn;
  }, [accessTokenString]);

  return {
    ...tokenInfo,
    refreshToken,
    isTokenValid,
    getTimeUntilExpiry,
  };
};

// ==========================================
// 👤 PERMISSIONS & ROLES HOOK
// ==========================================

/**
 * Hook for permission and role checking
 */
export const usePermissions = (): PermissionHookReturn => {
  const { user } = useAuthStore();
  
  const userRole = user?.role;
  const userPermissions = useMemo(() => 
    userRole ? getAllPermissionsForRole(userRole) : [], 
    [userRole]
  );

  const hasPermission = useCallback((permission: Permission): boolean => {
    return userPermissions.includes(permission);
  }, [userPermissions]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(permission => userPermissions.includes(permission));
  }, [userPermissions]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(permission => userPermissions.includes(permission));
  }, [userPermissions]);

  const canAccess = useCallback((context: PermissionContext): boolean => {
    if (!userRole) return false;
    return canAccessResource(userRole, context, userPermissions);
  }, [userRole, userPermissions]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return userRole === role;
  }, [userRole]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return userRole ? roles.includes(userRole) : false;
  }, [userRole]);

  const isMinimumRole = useCallback((minimumRole: UserRole): boolean => {
    if (!userRole) return false;
    return isMinimumRoleLevel(userRole, minimumRole);
  }, [userRole]);

  const getRoleLevel = useCallback((): number => {
    if (!userRole) return 0;
    return require('../utils/authUtils').getRoleLevel(userRole);
  }, [userRole]);

  const getAllPermissions = useCallback((): Permission[] => {
    return userPermissions;
  }, [userPermissions]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    hasRole,
    hasAnyRole,
    isMinimumRole,
    getRoleLevel,
    getAllPermissions,
  };
};

// ==========================================
// ⏱️ SESSION MANAGEMENT HOOK
// ==========================================

/**
 * Hook for session management and monitoring
 */
export const useSession = (options: {
  onSessionExpiring?: (remainingTime: number) => void;
  onSessionExpired?: () => void;
  warningThreshold?: number;
} = {}): SessionInfo & {
  extendSession: () => void;
  endSession: () => Promise<void>;
} => {
  const { lastActivity, updateActivity, logout, isAuthenticated } = useAuthStore();
  const { warningThreshold = 5 * 60 * 1000 } = options; // 5 minutes default
  
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isActive: false,
    isExpiring: false,
    remainingTime: 0,
    formattedRemainingTime: '0s',
    lastActivity: new Date(),
  });

  // Update session info
  useEffect(() => {
    if (!isAuthenticated) {
      setSessionInfo({
        isActive: false,
        isExpiring: false,
        remainingTime: 0,
        formattedRemainingTime: '0s',
        lastActivity: new Date(),
      });
      return;
    }

    const updateSessionInfo = () => {
      const remainingTime = getSessionRemainingTime(lastActivity);
      const isActive = remainingTime > 0;
      const isExpiring = isSessionExpiring(lastActivity, warningThreshold);
      
      setSessionInfo({
        isActive,
        isExpiring,
        remainingTime,
        formattedRemainingTime: formatRemainingTime(remainingTime),
        lastActivity: new Date(lastActivity),
      });

      // Trigger callbacks
      if (isExpiring && options.onSessionExpiring) {
        options.onSessionExpiring(remainingTime);
      }
      
      if (!isActive && options.onSessionExpired) {
        options.onSessionExpired();
      }
    };

    updateSessionInfo();
    const interval = setInterval(updateSessionInfo, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, warningThreshold, options]);

  const extendSession = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  const endSession = useCallback(async () => {
    await logout('manual');
  }, [logout]);

  return {
    ...sessionInfo,
    extendSession,
    endSession,
  };
};

// ==========================================
// 🔒 PROTECTED ROUTE HOOK
// ==========================================

/**
 * Hook for protecting routes with authentication and authorization
 */
export const useProtectedRoute = (options: {
  requireAuth?: boolean;
  roles?: UserRole[];
  permissions?: Permission[];
  redirectTo?: string;
  onUnauthorized?: () => void;
} = {}) => {
  const { requireAuth = true, roles, permissions, redirectTo = '/auth/login', onUnauthorized } = options;
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { hasAnyRole, hasAllPermissions } = usePermissions();
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthorization = () => {
      if (isLoading) {
        setIsChecking(true);
        return;
      }

      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        setIsAuthorized(false);
        setIsChecking(false);
        const returnUrl = encodeURIComponent(pathname);
        router.push(`${redirectTo}?returnUrl=${returnUrl}`);
        return;
      }

      // Check role requirements
      if (roles && user && !hasAnyRole(roles)) {
        setIsAuthorized(false);
        setIsChecking(false);
        if (onUnauthorized) {
          onUnauthorized();
        }
        return;
      }

      // Check permission requirements
      if (permissions && user && !hasAllPermissions(permissions)) {
        setIsAuthorized(false);
        setIsChecking(false);
        if (onUnauthorized) {
          onUnauthorized();
        }
        return;
      }

      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuthorization();
  }, [isLoading, isAuthenticated, user, requireAuth, roles, permissions, pathname, router, redirectTo, onUnauthorized, hasAnyRole, hasAllPermissions]);

  return {
    isAuthorized,
    isChecking,
    user,
    isAuthenticated,
  };
};

// ==========================================
// 🔄 AUTO REFRESH HOOK
// ==========================================

/**
 * Hook for automatic token refresh
 */
export const useAutoRefresh = (options: {
  enabled?: boolean;
  refreshThreshold?: number;
  onRefreshSuccess?: () => void;
  onRefreshError?: (error: any) => void;
} = {}) => {
  const { enabled = true, refreshThreshold = 10 * 60 * 1000 } = options; // 10 minutes default
  const { accessToken, refreshAuth } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled || !accessToken?.token) return;

    const checkAndRefresh = async () => {
      if (isRefreshing) return;

      const validation = validateToken(accessToken.token);
      if (validation.isValid && validation.expiresIn <= refreshThreshold) {
        setIsRefreshing(true);
        
        try {
          const result = await refreshAuth();
          if (result) {
            setLastRefresh(new Date());
            if (options.onRefreshSuccess) {
              options.onRefreshSuccess();
            }
          }
        } catch (error) {
          if (options.onRefreshError) {
            options.onRefreshError(error);
          }
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    const interval = setInterval(checkAndRefresh, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [enabled, accessToken, refreshThreshold, isRefreshing, refreshAuth, options]);

  return {
    isRefreshing,
    lastRefresh,
    manualRefresh: refreshAuth,
  };
};

// ==========================================
// 📤 EXPORTS
// ==========================================

// Export types
export type {
  UseAuthOptions,
  AuthState,
  AuthActions,
  TokenInfo,
  SessionInfo,
  PermissionHookReturn,
};