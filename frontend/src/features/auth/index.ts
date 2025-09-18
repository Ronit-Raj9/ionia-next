// ==========================================
// 📤 ENHANCED AUTH FEATURE EXPORTS
// ==========================================

// Main Auth Store
export { useAuthStore } from './store/authStore';

// Auth API
export { authAPI } from './api/authApi';

// Auth Provider
export { default as AuthProvider } from '../../providers/AuthProvider';

// Auth Components
export * from './components';

// Auth Error Boundary
export { default as AuthErrorBoundary } from './components/AuthErrorBoundary';

// Auth Hooks
// useAuthStore is already exported above from store

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
  ApiResponse,
  LoginResponse
} from './types';

// Auth Utils
export {
  createAuthError,
  isValidEmail,
  validatePassword,
  areCookiesEnabled,
  getUserDisplayName,
  getUserInitials,
  getRoleLevel,
  isMinimumRoleLevel,
  getAllPermissionsForRole,
  roleHasPermission,
  canAccessResource,
  getEffectivePermissions,
  getRoleDisplayName,
  getRoleColor,
  formatLastLogin,
  // JWT utilities
  decodeJWT,
  getTokenExpiry,
  isTokenExpiringSoon,
  getTimeUntilExpiry
} from './utils/authUtils';

// Logger
export { authLogger } from './utils/logger';