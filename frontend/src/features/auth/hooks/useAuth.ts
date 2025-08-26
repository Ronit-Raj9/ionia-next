"use client";

// ==========================================
// 🎣 SIMPLIFIED AUTH HOOKS - COOKIE-BASED
// ==========================================

import { useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  canAccessResource,
  getAllPermissionsForRole,
  isMinimumRoleLevel,
  type PermissionContext,
} from '../utils/authUtils';
import type { User, UserRole, Permission, LoginCredentials, RegisterData } from '../types';

// ==========================================
// 🎯 MAIN AUTH HOOK
// ==========================================

/**
 * Main auth hook for cookie-based authentication
 */
export const useAuth = () => {
  return useAuthStore(
    (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      isInitialized: state.isInitialized,
      error: state.error,
      login: state.login,
      logout: state.logout,
      register: state.register,
      clearError: state.clearError,
      validateAuth: state.validateAuth,
      initializeAuth: state.initializeAuth,
    }),
  );
};

// ==========================================
// 👤 PERMISSIONS & ROLES HOOK
// ==========================================

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

/**
 * Hook for permission and role checking
 */
export const usePermissions = (): PermissionHookReturn => {
  const { user } = useAuthStore();

  const userRole = user?.role;
  const userPermissions = useMemo(
    () => (userRole ? getAllPermissionsForRole(userRole) : []),
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
    const { getRoleLevel } = require('../utils/authUtils');
    return getRoleLevel(userRole);
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
// 🚪 PROTECTED ROUTE HOOK
// ==========================================

interface UseProtectedRouteOptions {
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  redirectTo?: string;
  requireAuth?: boolean;
}

export const useProtectedRoute = (options: UseProtectedRouteOptions = {}) => {
  const {
    requiredRole,
    requiredPermissions = [],
    redirectTo = '/auth/login',
    requireAuth = true,
  } = options;

  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized, user } = useAuth();
  const { hasRole, hasAllPermissions, isMinimumRole } = usePermissions();

  useEffect(() => {
    // Don't redirect until auth is initialized
    if (!isInitialized || isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?returnUrl=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    // Check role requirement
    if (requiredRole && !hasRole(requiredRole) && !isMinimumRole(requiredRole)) {
      router.push('/unauthorized');
      return;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
      router.push('/unauthorized');
      return;
    }
  }, [
    isInitialized,
    isLoading,
    isAuthenticated,
    requireAuth,
    requiredRole,
    requiredPermissions,
    redirectTo,
    router,
    hasRole,
    hasAllPermissions,
    isMinimumRole,
  ]);

  return {
    isLoading: isLoading || !isInitialized,
    isAuthenticated,
    user,
    canAccess: isInitialized && !isLoading && (
      !requireAuth || 
      (isAuthenticated && 
       (!requiredRole || hasRole(requiredRole) || isMinimumRole(requiredRole)) &&
       (requiredPermissions.length === 0 || hasAllPermissions(requiredPermissions)))
    ),
  };
};

// ==========================================
// 👥 USER PROFILE HOOK
// ==========================================

export const useUserProfile = () => {
  const { user, updateUser } = useAuthStore();

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    updateUser(updates);
  }, [user, updateUser]);

  return {
    user,
    updateProfile,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin',
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
    avatar: user?.avatar,
    role: user?.role,
    permissions: user?.permissions || [],
    emailVerified: user?.emailVerified || false,
    lastLogin: user?.lastLogin,
    createdAt: user?.createdAt,
  };
};

// ==========================================
// 🔄 AUTH INITIALIZATION HOOK
// ==========================================

export const useAuthInitialization = () => {
  const { isInitialized, initializeAuth, isLoading } = useAuth();

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeAuth();
    }
  }, [isInitialized, isLoading, initializeAuth]);

  return {
    isInitialized,
    isLoading,
  };
};

// ==========================================
// 📱 AUTH ACTIONS HOOK
// ==========================================

export const useAuthActions = () => {
  const { login, logout, register, clearError } = useAuth();
  const router = useRouter();

  const handleLogin = useCallback(
    async (credentials: LoginCredentials, redirectTo?: string) => {
      clearError();
      
      try {
        const result = await login(credentials);
        
        if (result.success) {
          const urlParams = new URLSearchParams(window.location.search);
          const returnUrl = urlParams.get('returnUrl');
          const finalRedirect = redirectTo || returnUrl || '/dashboard';
          router.push(finalRedirect);
        }
        
        return result;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    [login, clearError, router]
  );

  const handleLogout = useCallback(
    async (redirectTo: string = '/auth/login') => {
      try {
        await logout();
        router.push(redirectTo);
      } catch (error) {
        console.error('Logout error:', error);
        router.push(redirectTo);
      }
    },
    [logout, router]
  );

  const handleRegister = useCallback(
    async (userData: RegisterData, redirectTo: string = '/auth/login') => {
      clearError();
      
      try {
        const result = await register(userData);
        
        if (result.success) {
          router.push(redirectTo);
        }
        
        return result;
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    [register, clearError, router]
  );

  return {
    handleLogin,
    handleLogout,
    handleRegister,
  };
};

// ==========================================
// 🔍 AUTH STATUS HOOK
// ==========================================

export const useAuthStatus = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    isInitialized, 
    user, 
    error 
  } = useAuth();

  const status = useMemo(() => {
    if (!isInitialized) return 'initializing';
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (isAuthenticated && user) return 'authenticated';
    return 'unauthenticated';
  }, [isInitialized, isLoading, error, isAuthenticated, user]);

  return {
    status,
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    error,
    isReady: isInitialized && !isLoading,
  };
};

// ==========================================
// 🍪 COOKIE MANAGEMENT HOOK
// ==========================================

export const useCookieAuth = () => {
  const checkCookieSupport = useCallback((): boolean => {
    try {
      document.cookie = 'test_cookie=1; SameSite=Lax';
      const supported = document.cookie.indexOf('test_cookie=1') !== -1;
      document.cookie = 'test_cookie=1; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
      return supported;
    } catch {
      return false;
    }
  }, []);

  const getCookieStatus = useCallback(() => {
    return {
      supported: checkCookieSupport(),
      message: checkCookieSupport() 
        ? 'Cookies are enabled and working correctly'
        : 'Cookies are disabled or not supported. Please enable cookies to use authentication features.',
    };
  }, [checkCookieSupport]);

  return {
    checkCookieSupport,
    getCookieStatus,
  };
};