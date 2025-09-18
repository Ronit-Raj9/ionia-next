// ==========================================
// 🛠️ AUTH UTILITIES LAYER - TOKEN & ROLE UTILITIES
// ==========================================

import type { UserRole, Permission } from '../types';

// ==========================================
// 🏷️ UTILITY TYPES
// ==========================================

// Note: Token-related interfaces removed as we use cookie-based auth

export interface PermissionContext {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// Note: Token validation removed as we use cookie-based auth

// ==========================================
// 👥 ROLE & PERMISSION UTILITIES
// ==========================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'user:profile:read',
    'user:profile:update',
    'user:tests:take',
    'user:results:view'
  ],
  admin: [
    'user:profile:read',
    'user:profile:update',
    'user:tests:take',
    'user:results:view',
    'admin:users:read',
    'admin:users:update',
    'admin:tests:create',
    'admin:tests:update',
    'admin:tests:delete',
    'admin:analytics:view'
  ],
  superadmin: [
    'user:profile:read',
    'user:profile:update',
    'user:tests:take',
    'user:results:view',
    'admin:users:read',
    'admin:users:update',
    'admin:users:delete',
    'admin:tests:create',
    'admin:tests:update',
    'admin:tests:delete',
    'admin:analytics:view',
    'superadmin:system:config',
    'superadmin:admins:manage',
    'superadmin:logs:view',
    'superadmin:security:manage'
  ],
};

/**
 * Get role hierarchy level
 */
export const getRoleLevel = (role: UserRole): number => {
  return ROLE_HIERARCHY[role] || 0;
};

/**
 * Check if user role meets minimum requirement
 */
export const isMinimumRoleLevel = (userRole: UserRole, minimumRole: UserRole): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(minimumRole);
};

/**
 * Get all permissions for a role
 */
export const getAllPermissionsForRole = (role: UserRole): Permission[] => {
  return DEFAULT_PERMISSIONS[role] || [];
};

/**
 * Check if role has specific permission
 */
export const roleHasPermission = (role: UserRole, permission: Permission): boolean => {
  const rolePermissions = getAllPermissionsForRole(role);
  return rolePermissions.includes(permission);
};

/**
 * Check if user can access a resource with specific action
 */
export const canAccessResource = (
  userRole: UserRole,
  context: PermissionContext,
  userPermissions?: Permission[]
): boolean => {
  // Admin and superadmin have broad access
  if (userRole === 'admin' || userRole === 'superadmin') {
    return true;
  }

  // Check specific permission
  const permissionKey = `${context.resource}:${context.action}` as Permission;
  const permissions = userPermissions || getAllPermissionsForRole(userRole);
  
  return permissions.includes(permissionKey);
};

/**
 * Get user's effective permissions (role-based + custom)
 */
export const getEffectivePermissions = (
  role: UserRole,
  customPermissions: Permission[] = []
): Permission[] => {
  const rolePermissions = getAllPermissionsForRole(role);
  const allPermissions = Array.from(new Set([...rolePermissions, ...customPermissions]));
  return allPermissions;
};

// ==========================================
// ⏱️ SESSION UTILITIES
// ==========================================

// Session timeout: 15 days for persistent sessions
export const SESSION_TIMEOUT = 15 * 24 * 60 * 60 * 1000; // 15 days
export const INACTIVITY_WARNING_TIME = 14 * 24 * 60 * 60 * 1000; // 14 days (1 day before expiry)

// Short session timeout for non-remember me logins
export const SHORT_SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
export const SHORT_INACTIVITY_WARNING_TIME = 23 * 60 * 60 * 1000; // 23 hours

/**
 * Get remaining session time
 */
export const getSessionRemainingTime = (lastActivity: number, isRememberMe = true): number => {
  const elapsed = Date.now() - lastActivity;
  const timeout = isRememberMe ? SESSION_TIMEOUT : SHORT_SESSION_TIMEOUT;
  const remaining = timeout - elapsed;
  return Math.max(0, remaining);
};

/**
 * Check if session is expiring soon
 */
export const isSessionExpiring = (
  lastActivity: number, 
  isRememberMe = true,
  warningThreshold?: number
): boolean => {
  const elapsed = Date.now() - lastActivity;
  const timeout = isRememberMe ? SESSION_TIMEOUT : SHORT_SESSION_TIMEOUT;
  const warning = warningThreshold || (isRememberMe ? INACTIVITY_WARNING_TIME : SHORT_INACTIVITY_WARNING_TIME);
  
  return elapsed >= warning && elapsed < timeout;
};

/**
 * Check if session has expired
 */
export const isSessionExpired = (lastActivity: number, isRememberMe = true): boolean => {
  const elapsed = Date.now() - lastActivity;
  const timeout = isRememberMe ? SESSION_TIMEOUT : SHORT_SESSION_TIMEOUT;
  return elapsed >= timeout;
};

/**
 * Calculate session expiry time based on remember me setting
 */
export const calculateSessionExpiryTime = (isRememberMe: boolean): number => {
  const now = Date.now();
  return now + (isRememberMe ? SESSION_TIMEOUT : SHORT_SESSION_TIMEOUT);
};

/**
 * Format remaining time for display
 */
export const formatRemainingTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return '0s';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// ==========================================
// 🔧 UTILITY FUNCTIONS
// ==========================================

/**
 * Format date and time for display
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

// Note: Device info functions removed - not currently used

/**
 * Create auth error object
 */
export const createAuthError = (
  type: 'auth' | 'network' | 'validation' | 'server' | 'permission',
  message: string,
  context?: Record<string, any>
) => ({
  type,
  message,
  timestamp: Date.now(),
  context,
});

/**
 * Check if error is auth-related
 */
export const isAuthError = (error: any): boolean => {
  return error?.type === 'auth' || 
         error?.status === 401 || 
         error?.code === 'UNAUTHORIZED';
};

// Note: getUserFromToken removed as we use cookie-based auth

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Note: deepClone removed - use structuredClone or lodash if needed

// ==========================================
// 🍪 COOKIE UTILITIES
// ==========================================

/**
 * Check if cookies are enabled in the browser
 */
export const areCookiesEnabled = (): boolean => {
  try {
    document.cookie = 'test_cookie=1; SameSite=Lax';
    const enabled = document.cookie.indexOf('test_cookie=1') !== -1;
    // Clean up test cookie
    document.cookie = 'test_cookie=1; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    return enabled;
  } catch {
    return false;
  }
};

/**
 * Get cookie by name (for debugging purposes)
 * Note: Auth cookies are httpOnly and not accessible via JS
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

/**
 * Check if user is likely authenticated based on any non-httpOnly cookies
 * This is for UI hints only - real auth status comes from API calls
 */
export const hasAuthCookies = (): boolean => {
  // Since our auth cookies are httpOnly, we can't directly check them
  // This could check for any indicator cookies if we set them
  return areCookiesEnabled();
};

// ==========================================
// 🎯 USER UTILITIES
// ==========================================

/**
 * Get user display name
 */
export const getUserDisplayName = (user: any): string => {
  if (!user) return 'Guest';
  return user.fullName || user.username || user.email || 'User';
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (user: any): string => {
  if (!user) return 'G';
  
  const name = user.fullName || user.username || user.email || 'User';
  const parts = name.split(' ');
  
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  
  return name.substring(0, 2).toUpperCase();
};

/**
 * Check if user has completed profile
 */
export const isProfileComplete = (user: any): boolean => {
  if (!user) return false;
  
  return !!(
    user.fullName &&
    user.email &&
    user.username &&
    user.emailVerified
  );
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames = {
    user: 'User',
    admin: 'Administrator',
    superadmin: 'Super Administrator',
  };
  
  return roleNames[role] || 'Unknown';
};

// ==========================================
// 🎨 UI UTILITIES
// ==========================================

/**
 * Get role color for UI display
 */
export const getRoleColor = (role: UserRole): string => {
  const roleColors = {
    user: 'blue',
    admin: 'green',
    superadmin: 'purple',
  };
  
  return roleColors[role] || 'gray';
};

/**
 * Format user last login time
 */
export const formatLastLogin = (lastLogin: string | undefined): string => {
  if (!lastLogin) return 'Never';
  
  const date = new Date(lastLogin);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// ==========================================
// 📤 EXPORTS
// ==========================================

// Types are already exported above, no need to re-export