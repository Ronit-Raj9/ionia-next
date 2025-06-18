import { useAuthStore } from '@/stores/authStore';
import React from 'react';

// Define permission constants
export const PERMISSIONS = {
  // User permissions
  USER_READ_OWN_PROFILE: 'user:read:own_profile',
  USER_UPDATE_OWN_PROFILE: 'user:update:own_profile',
  USER_TAKE_TESTS: 'user:take:tests',
  USER_VIEW_OWN_RESULTS: 'user:view:own_results',
  
  // Admin permissions
  ADMIN_READ_USERS: 'admin:read:users',
  ADMIN_UPDATE_USERS: 'admin:update:users',
  ADMIN_DELETE_USERS: 'admin:delete:users',
  ADMIN_CREATE_TESTS: 'admin:create:tests',
  ADMIN_UPDATE_TESTS: 'admin:update:tests',
  ADMIN_DELETE_TESTS: 'admin:delete:tests',
  ADMIN_VIEW_ANALYTICS: 'admin:view:analytics',
  
  // Super admin permissions
  SUPERADMIN_MANAGE_ADMINS: 'superadmin:manage:admins',
  SUPERADMIN_SYSTEM_CONFIG: 'superadmin:system:config',
  SUPERADMIN_VIEW_LOGS: 'superadmin:view:logs',
} as const;

type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Define base permissions for each role
const USER_PERMISSIONS: PermissionType[] = [
    PERMISSIONS.USER_READ_OWN_PROFILE,
    PERMISSIONS.USER_UPDATE_OWN_PROFILE,
    PERMISSIONS.USER_TAKE_TESTS,
    PERMISSIONS.USER_VIEW_OWN_RESULTS,
];

const ADMIN_PERMISSIONS: PermissionType[] = [
    PERMISSIONS.ADMIN_READ_USERS,
    PERMISSIONS.ADMIN_UPDATE_USERS,
    PERMISSIONS.ADMIN_DELETE_USERS,
    PERMISSIONS.ADMIN_CREATE_TESTS,
    PERMISSIONS.ADMIN_UPDATE_TESTS,
    PERMISSIONS.ADMIN_DELETE_TESTS,
    PERMISSIONS.ADMIN_VIEW_ANALYTICS,
];

const SUPERADMIN_PERMISSIONS: PermissionType[] = [
    PERMISSIONS.SUPERADMIN_MANAGE_ADMINS,
    PERMISSIONS.SUPERADMIN_SYSTEM_CONFIG,
    PERMISSIONS.SUPERADMIN_VIEW_LOGS,
];

// Role-based permission mapping
export const ROLE_PERMISSIONS = {
  user: USER_PERMISSIONS,
  admin: [...USER_PERMISSIONS, ...ADMIN_PERMISSIONS],
  superadmin: [...USER_PERMISSIONS, ...ADMIN_PERMISSIONS, ...SUPERADMIN_PERMISSIONS],
} as const;

// Check if user has specific permission
export function hasPermission(permission: string): boolean {
  const { user } = useAuthStore.getState();
  
  if (!user?.role) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions?.includes(permission as any) ?? false;
}

// Check if user can access a specific resource
export function canAccessResource(resourceType: string, action: string, resourceOwnerId?: string): boolean {
  const { user } = useAuthStore.getState();
  
  if (!user) return false;
  
  // Check if user owns the resource
  if (resourceOwnerId && user.id === resourceOwnerId) {
    return true;
  }
  
  // Check role-based permissions
  const permission = `${user.role}:${action}:${resourceType}`;
  return hasPermission(permission);
}

// Route permission checker
export function canAccessRoute(route: string): boolean {
  const { user, hasRole } = useAuthStore.getState();
  
  if (!user) return false;
  
  // Define route access rules
  const routeRules: Record<string, string[]> = {
    '/dashboard': ['user', 'admin', 'superadmin'],
    '/profile': ['user', 'admin', 'superadmin'],
    '/tests': ['user', 'admin', 'superadmin'],
    '/admin': ['admin', 'superadmin'],
    '/admin/users': ['admin', 'superadmin'],
    '/admin/tests': ['admin', 'superadmin'],
    '/admin/analytics': ['admin', 'superadmin'],
    '/admin/system': ['superadmin'],
  };
  
  const allowedRoles = routeRules[route];
  if (!allowedRoles) return true; // Public route
  
  return allowedRoles.some(role => hasRole(role as any));
}

// Component permission wrapper
export function withPermission<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  requiredPermission: string
): React.FC<T> {
  return function PermissionWrapper(props: T) {
    const canAccess = hasPermission(requiredPermission);
    
    if (!canAccess) {
      return React.createElement('div', { className: 'p-4 bg-yellow-50 border border-yellow-200 rounded-lg' },
        React.createElement('p', { className: 'text-yellow-800' }, 'You don\'t have permission to access this feature.')
      );
    }
    
    return React.createElement(WrappedComponent, props);
  };
}

// Role-based component wrapper
export function withRole<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  allowedRoles: string[]
): React.FC<T> {
  return function RoleWrapper(props: T) {
    const { hasAnyRole } = useAuthStore.getState();
    const canAccess = hasAnyRole(allowedRoles);
    
    if (!canAccess) {
      return React.createElement('div', { className: 'p-4 bg-red-50 border border-red-200 rounded-lg' },
        React.createElement('p', { className: 'text-red-800' }, 'You don\'t have the required role to access this feature.')
      );
    }
    
    return React.createElement(WrappedComponent, props);
  };
}

// Permission context for complex permission checks
export interface PermissionContext {
  resource?: {
    type: string;
    id: string;
    ownerId?: string;
  };
  action: string;
}

export function checkPermissionWithContext(context: PermissionContext): boolean {
  const { user } = useAuthStore.getState();
  
  if (!user) return false;
  
  // If resource has an owner, check ownership
  if (context.resource?.ownerId && user.id === context.resource.ownerId) {
    return true;
  }
  
  // Check role-based permissions
  if (context.resource) {
    return canAccessResource(context.resource.type, context.action, context.resource.ownerId);
  }
  
  // For actions without specific resources, check general permissions
  const permission = `${user.role}:${context.action}`;
  return hasPermission(permission);
}

// Utility to get user's available actions for a resource
export function getAvailableActions(resourceType: string, resourceOwnerId?: string): string[] {
  const { user } = useAuthStore.getState();
  
  if (!user) return [];
  
  const actions: string[] = [];
  
  // Check all possible actions
  const possibleActions = ['read', 'create', 'update', 'delete', 'manage'];
  
  possibleActions.forEach(action => {
    if (canAccessResource(resourceType, action, resourceOwnerId)) {
      actions.push(action);
    }
  });
  
  return actions;
}

// Security helper for API calls
export function getAuthHeaders(): Record<string, string> {
  // This would typically get the access token
  // The actual implementation depends on how tokens are stored
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization header if available
  if (typeof window !== 'undefined') {
    const token = (window as any).__accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
} 