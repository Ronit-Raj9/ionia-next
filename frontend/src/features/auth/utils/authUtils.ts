// ==========================================
// 🛠️ AUTH UTILITIES LAYER - TOKEN & ROLE UTILITIES
// ==========================================

import type { UserRole, Permission } from '../types';

// ==========================================
// 🏷️ UTILITY TYPES
// ==========================================

export interface TokenValidation {
  isValid: boolean;
  isExpired: boolean;
  isExpiring: boolean;
  expiresIn: number;
  expiresAt: Date | null;
}

export interface TokenExpiryInfo {
  expiresAt: Date | null;
  expiresIn: number;
  formattedExpiry: string;
  isExpired: boolean;
  isExpiring: boolean;
}

export interface PermissionContext {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// ==========================================
// 🔍 TOKEN VALIDATION UTILITIES
// ==========================================

/**
 * Parse JWT token and extract payload
 */
export const parseJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Invalid JWT token:', error);
    return null;
  }
};

/**
 * Validate JWT token structure and expiry
 */
export const validateToken = (token: string | null): TokenValidation => {
  if (!token) {
    return {
      isValid: false,
      isExpired: true,
      isExpiring: false,
      expiresIn: 0,
      expiresAt: null,
    };
  }

  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) {
      return {
        isValid: false,
        isExpired: true,
        isExpiring: false,
        expiresIn: 0,
        expiresAt: null,
      };
    }

    const now = Date.now();
    const expiresAt = new Date(payload.exp * 1000);
    const expiresIn = expiresAt.getTime() - now;
    const isExpired = expiresIn <= 0;
    const isExpiring = expiresIn <= 5 * 60 * 1000; // 5 minutes

    return {
      isValid: !isExpired,
      isExpired,
      isExpiring: isExpiring && !isExpired,
      expiresIn: Math.max(0, expiresIn),
      expiresAt,
    };
  } catch (error) {
    return {
      isValid: false,
      isExpired: true,
      isExpiring: false,
      expiresIn: 0,
      expiresAt: null,
    };
  }
};

/**
 * Check if token should be refreshed
 */
export const shouldRefreshToken = (token: string | null, thresholdMinutes = 10): boolean => {
  const validation = validateToken(token);
  if (!validation.isValid) return false;
  
  const threshold = thresholdMinutes * 60 * 1000;
  return validation.expiresIn <= threshold;
};

/**
 * Get detailed token expiry information
 */
export const getTokenExpiryInfo = (token: string | null): TokenExpiryInfo => {
  const validation = validateToken(token);
  
  return {
    expiresAt: validation.expiresAt,
    expiresIn: validation.expiresIn,
    formattedExpiry: validation.expiresAt 
      ? formatDateTime(validation.expiresAt)
      : 'Invalid token',
    isExpired: validation.isExpired,
    isExpiring: validation.isExpiring,
  };
};

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

export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
export const INACTIVITY_WARNING_TIME = 25 * 60 * 1000; // 25 minutes

/**
 * Get remaining session time
 */
export const getSessionRemainingTime = (lastActivity: number): number => {
  const elapsed = Date.now() - lastActivity;
  const remaining = SESSION_TIMEOUT - elapsed;
  return Math.max(0, remaining);
};

/**
 * Check if session is expiring soon
 */
export const isSessionExpiring = (
  lastActivity: number, 
  warningThreshold = INACTIVITY_WARNING_TIME
): boolean => {
  const elapsed = Date.now() - lastActivity;
  return elapsed >= warningThreshold && elapsed < SESSION_TIMEOUT;
};

/**
 * Check if session has expired
 */
export const isSessionExpired = (lastActivity: number): boolean => {
  const elapsed = Date.now() - lastActivity;
  return elapsed >= SESSION_TIMEOUT;
};

/**
 * Format remaining time for display
 */
export const formatRemainingTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return '0s';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
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

/**
 * Generate secure device ID
 */
export const generateDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

/**
 * Get browser and device information
 */
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server',
      platform: 'server',
      language: 'en',
      timezone: 'UTC',
    };
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

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

/**
 * Extract user info from token
 */
export const getUserFromToken = (token: string): any => {
  const payload = parseJWT(token);
  if (!payload) return null;

  return {
    id: payload.sub || payload.userId,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions || [],
    exp: payload.exp,
    iat: payload.iat,
  };
};

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

/**
 * Deep clone object (for state management)
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any };
    for (const key in obj) {
      clonedObj[key] = deepClone(obj[key]);
    }
    return clonedObj as T;
  }
  return obj;
};

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