// ==========================================
// 📦 AUTH FEATURE INDEX - CENTRALIZED EXPORTS
// ==========================================

// API Layer
export * from './api/authApi';

// Components Layer
export * from './components';

// Hooks Layer - explicit imports to avoid module resolution issues
export {
  useAuth,
  useTokenManager,
  usePermissions,
  useSession,
  useProtectedRoute,
  useAutoRefresh,
} from './hooks/useAuth';

// Services Layer
export * from './services/authService';

// Store Layer
export * from './store/authStore';

// Utils Layer - selective exports to avoid conflicts
export {
  validateToken,
  shouldRefreshToken,
  getTokenExpiryInfo,
  parseJWT,
  getRoleLevel,
  isMinimumRoleLevel,
  getAllPermissionsForRole,
  roleHasPermission,
  canAccessResource,
  getEffectivePermissions,
  getSessionRemainingTime,
  isSessionExpiring,
  isSessionExpired,
  formatRemainingTime,
  formatDateTime,
  generateDeviceId,
  getDeviceInfo,
  createAuthError,
  isAuthError,
  getUserFromToken,
  isValidEmail,
  validatePassword,
  sanitizeInput,
  deepClone,
  ROLE_HIERARCHY,
  DEFAULT_PERMISSIONS,
  SESSION_TIMEOUT,
  INACTIVITY_WARNING_TIME,
} from './utils/authUtils';

// Types - selective exports to avoid conflicts with other modules
export type {
  User,
  UserRole,
  Permission,
  AuthError,
  LogoutReason,
  AuthResult,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  RefreshResponse,
} from './types';

// Utils types that don't conflict
export type {
  TokenValidation,
  TokenExpiryInfo,
  PermissionContext,
} from './utils/authUtils';

export type {
  UseAuthOptions,
  AuthState,
  AuthActions,
  TokenInfo,
  SessionInfo,
  PermissionHookReturn,
} from './hooks/useAuth';