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
  formatRemainingTime,
  getRoleDisplayName,
  getRoleColor,
  formatLastLogin
} from './utils/authUtils';