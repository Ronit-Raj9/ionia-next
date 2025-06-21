// ==========================================
// 🎣 AUTH HOOKS LAYER - REACT INTEGRATION
// ==========================================

import { useMemo } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  canAccessResource,
  getAllPermissionsForRole,
  isMinimumRoleLevel,
  type PermissionContext,
} from '../utils/authUtils';
import type { UserRole, Permission } from '../types';

// ==========================================
// 🎯 MAIN AUTH HOOK
// ==========================================

/**
 * A clean, selector-based hook to access authentication state and actions.
 * This hook is intentionally simple and does not contain any side-effects,
 * routing logic, or timers. It's a pure interface to the authStore.
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
 * Hook for permission and role checking based on the current user's state.
 */
export const usePermissions = (): PermissionHookReturn => {
  const { user } = useAuthStore();

  const userRole = user?.role;
  const userPermissions = useMemo(
    () => (userRole ? getAllPermissionsForRole(userRole) : []),
    [userRole]
  );

  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => userPermissions.includes(permission));
  };

  const canAccess = (context: PermissionContext): boolean => {
    if (!userRole) return false;
    return canAccessResource(userRole, context, userPermissions);
  };

  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return userRole ? roles.includes(userRole) : false;
  };

  const isMinimumRole = (minimumRole: UserRole): boolean => {
    if (!userRole) return false;
    return isMinimumRoleLevel(userRole, minimumRole);
  };

  const getRoleLevel = (): number => {
    if (!userRole) return 0;
    return require('../utils/authUtils').getRoleLevel(userRole);
  };

  const getAllPermissions = (): Permission[] => {
    return userPermissions;
  };

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