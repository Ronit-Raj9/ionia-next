// ==========================================
// 🛠️ AUTH UTILITIES LAYER - JWT ONLY
// ==========================================

import { authLogger } from './logger';

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

// Note: Session utilities removed - using JWT-only authentication

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
 * Enhanced error types for better error differentiation
 */
export type ErrorType = 
  | 'network' 
  | 'auth' 
  | 'csrf' 
  | 'rate_limit' 
  | 'account_locked' 
  | 'validation' 
  | 'server' 
  | 'permission'
  | 'refresh_failed'
  | 'session_expired';

export interface EnhancedAuthError {
  type: ErrorType;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  retryable: boolean;
  userFriendlyMessage: string;
  suggestedAction?: string;
}

/**
 * Create enhanced auth error object with better categorization
 */
export const createAuthError = (
  type: ErrorType,
  message: string,
  context?: Record<string, any>
): EnhancedAuthError => {
  const errorConfig = getErrorConfig(type, message);
  
  authLogger.error(`Auth error: ${type}`, { message, context }, 'ERROR');
  
  return {
    type,
    message,
    timestamp: Date.now(),
    context,
    retryable: errorConfig.retryable,
    userFriendlyMessage: errorConfig.userFriendlyMessage,
    suggestedAction: errorConfig.suggestedAction,
  };
};

/**
 * Get error configuration based on error type
 */
const getErrorConfig = (type: ErrorType, originalMessage: string) => {
  switch (type) {
    case 'network':
      return {
        retryable: true,
        userFriendlyMessage: 'Network connection issue. Please check your internet connection.',
        suggestedAction: 'Try again in a moment or check your internet connection.'
      };
      
    case 'auth':
      return {
        retryable: false,
        userFriendlyMessage: 'Authentication failed. Please log in again.',
        suggestedAction: 'Please log in again to continue.'
      };
      
    case 'csrf':
      return {
        retryable: true,
        userFriendlyMessage: 'Security token mismatch. Please refresh the page.',
        suggestedAction: 'Refresh the page and try again.'
      };
      
    case 'rate_limit':
      return {
        retryable: true,
        userFriendlyMessage: 'Too many attempts. Please wait before trying again.',
        suggestedAction: 'Wait a few minutes before trying again.'
      };
      
    case 'account_locked':
      return {
        retryable: false,
        userFriendlyMessage: 'Account temporarily locked due to security concerns.',
        suggestedAction: 'Contact support or try again later.'
      };
      
    case 'validation':
      return {
        retryable: false,
        userFriendlyMessage: 'Please check your input and try again.',
        suggestedAction: 'Review the form and correct any errors.'
      };
      
    case 'server':
      return {
        retryable: true,
        userFriendlyMessage: 'Server error. Please try again later.',
        suggestedAction: 'Try again in a few minutes or contact support if the problem persists.'
      };
      
    case 'permission':
      return {
        retryable: false,
        userFriendlyMessage: 'You don\'t have permission to perform this action.',
        suggestedAction: 'Contact your administrator if you believe this is an error.'
      };
      
    case 'refresh_failed':
      return {
        retryable: false,
        userFriendlyMessage: 'Session expired. Please log in again.',
        suggestedAction: 'Please log in again to continue.'
      };
      
    case 'session_expired':
      return {
        retryable: false,
        userFriendlyMessage: 'Your session has expired. Please log in again.',
        suggestedAction: 'Please log in again to continue.'
      };
      
    default:
      return {
        retryable: false,
        userFriendlyMessage: originalMessage,
        suggestedAction: 'Please try again or contact support.'
      };
  }
};

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
// 🔐 TOKEN REUSE DETECTION
// ==========================================

/**
 * Check if error indicates token reuse/compromise
 */
export const isTokenReuseError = (error: any): boolean => {
  if (!error) return false;
  
  // Check for specific error codes/messages that indicate token reuse
  const reuseIndicators = [
    'token_reuse',
    'refresh_token_reuse',
    'compromised',
    'security_breach',
    'invalid_refresh_token',
    'refresh_token_revoked'
  ];
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  const errorType = error.type?.toLowerCase() || '';
  
  return reuseIndicators.some(indicator => 
    errorMessage.includes(indicator) || 
    errorCode.includes(indicator) ||
    errorType.includes(indicator)
  );
};

/**
 * Handle token reuse detection
 */
export const handleTokenReuse = (error: any, authStore: any): void => {
  authLogger.securityEvent('Token reuse detected', { error: error.message });
  
  // Track security event
  if (typeof window !== 'undefined' && (window as any).errorTracker) {
    (window as any).errorTracker.trackAuthEvent('token_reuse_detected', {
      error: error.message,
      code: error.code,
      type: error.type,
      timestamp: new Date().toISOString()
    });
  }
  
  // Force logout from all devices
  authStore.logoutFromAllDevices().catch((logoutError: any) => {
    authLogger.error('Failed to logout after token reuse', { error: logoutError.message }, 'SECURITY');
  });
  
  // Show security warning to user
  authStore.setError({
    type: 'security_breach',
    message: 'Security Alert: Your account may have been compromised. You have been logged out from all devices for your security.',
    userFriendlyMessage: 'Security Alert: Your account may have been compromised. You have been logged out from all devices for your security.',
    retryable: false,
    suggestedAction: 'Please log in again and change your password if you suspect unauthorized access.'
  });
};

/**
 * Enhanced error classification for token reuse
 */
export const classifyAuthError = (error: any): {
  isTokenReuse: boolean;
  isSecurityBreach: boolean;
  isRefreshFailure: boolean;
  isNetworkError: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
} => {
  const isTokenReuse = isTokenReuseError(error);
  const isSecurityBreach = isTokenReuse || error.type === 'security_breach';
  const isRefreshFailure = error.message?.includes('refresh') || error.type === 'refresh_failed';
  const isNetworkError = !navigator.onLine || error.message?.includes('network') || error.type === 'network';
  
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  if (isTokenReuse) {
    severity = 'critical';
  } else if (isSecurityBreach) {
    severity = 'high';
  } else if (isRefreshFailure) {
    severity = 'medium';
  } else if (isNetworkError) {
    severity = 'low';
  }
  
  return {
    isTokenReuse,
    isSecurityBreach,
    isRefreshFailure,
    isNetworkError,
    severity
  };
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
// 🔐 JWT UTILITIES
// ==========================================

/**
 * Decode JWT token (client-side only, no verification)
 * Used for extracting expiry information
 */
export const decodeJWT = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/**
 * Extract token expiry from JWT
 */
export const getTokenExpiry = (token: string): number | null => {
  const decoded = decodeJWT(token);
  return decoded?.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
};

/**
 * Check if token is expired or will expire soon
 */
export const isTokenExpiringSoon = (token: string, bufferSeconds: number = 30): boolean => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  
  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;
  return expiry - now <= bufferMs;
};

/**
 * Get time until token expires (in seconds)
 */
export const getTimeUntilExpiry = (token: string): number => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;
  
  const now = Date.now();
  return Math.max(0, Math.floor((expiry - now) / 1000));
};

// ==========================================
// 📤 EXPORTS
// ==========================================

// JWT utilities are already exported above as individual functions

// Types are already exported above, no need to re-export