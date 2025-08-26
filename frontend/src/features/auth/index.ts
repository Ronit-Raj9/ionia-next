// ==========================================
// 📤 SIMPLIFIED AUTH FEATURE EXPORTS - COOKIE-BASED
// ==========================================

// Main Auth Store
export { 
  useAuthStore,
  useAuthState,
  useAuthPermissions,
  authSelectors 
} from './store/authStore';

// Auth API
export { 
  authAPI,
  fetchWithAuth
} from './api/authApi';

// Auth Store Selectors
export {
  useAuthStore,
  useAuthState,
  useAuthPermissions,
  useSessionStatus
} from './store/authStore';

// Auth Provider
export { 
  default as AuthProvider
} from '../../providers/AuthProvider';

// Auth Types
export type {
  User,
  UserRole,
  Permission,
  AuthError,
  LoginCredentials,
  RegisterData,
  AuthResult,
  LogoutReason,
  PermissionContext,
  ApiResponse,
  LoginResponse,
  RefreshResponse,
  RegisterResponse,
  CookieStatus,
  AuthConfig,
  AuthHookReturn,
  PermissionHookReturn,
  AuthStatus,
  AuthStatusInfo
} from './types';

// Auth Utils
export {
  ROLE_HIERARCHY,
  DEFAULT_PERMISSIONS,
  getRoleLevel,
  isMinimumRoleLevel,
  getAllPermissionsForRole,
  roleHasPermission,
  canAccessResource,
  getEffectivePermissions,
  createAuthError,
  isAuthError,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  areCookiesEnabled,
  getCookie,
  hasAuthCookies,
  getUserDisplayName,
  getUserInitials,
  isProfileComplete,
  getRoleDisplayName,
  getRoleColor,
  formatLastLogin
} from './utils/authUtils';

// ==========================================
// 🎯 CONVENIENCE EXPORTS
// ==========================================

// Quick auth status check
export const getAuthStatus = () => {
  const { useAuthStore } = require('./store/authStore');
  const state = useAuthStore.getState();
  return {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
  };
};

// Quick user check
export const getCurrentUser = () => {
  const { useAuthStore } = require('./store/authStore');
  const state = useAuthStore.getState();
  return state.user;
};

// Quick auth check
export const isAuthenticated = () => {
  const { useAuthStore } = require('./store/authStore');
  const state = useAuthStore.getState();
  return state.isAuthenticated;
};

// Quick role check
export const hasRole = (role: import('./types').UserRole) => {
  const { useAuthStore } = require('./store/authStore');
  const state = useAuthStore.getState();
  return state.hasRole(role);
};

// Quick permission check
export const hasPermission = (permission: import('./types').Permission) => {
  const { useAuthStore } = require('./store/authStore');
  const state = useAuthStore.getState();
  return state.hasPermission(permission);
};