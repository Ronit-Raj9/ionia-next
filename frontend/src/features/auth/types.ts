// ==========================================
// 🏷️ SIMPLIFIED AUTH TYPES - JWT ONLY
// ==========================================

export interface User {
  id: string;
  _id: string; // MongoDB's default _id field from backend
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  permissions: Permission[];
  avatar?: string;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  // 🔥 ACCOUNT SECURITY FIELDS
  failedLoginAttempts?: {
    count: number;
    lastAttempt?: string;
    lockedUntil?: string;
  };
  // 🔥 EMAIL VERIFICATION FIELDS
  emailVerificationToken?: string;
  emailVerificationExpires?: string;
  emailVerificationAttempts?: {
    count: number;
    lastAttempt?: string;
    blocked: boolean;
    blockedUntil?: string;
  };
  // 🔥 PASSWORD FIELD (for frontend validation)
  hasPassword?: boolean;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export type Permission = 
  // User permissions
  | 'user:profile:read' | 'user:profile:update' 
  | 'user:tests:take' | 'user:results:view'
  // Admin permissions
  | 'admin:users:read' | 'admin:users:update' | 'admin:users:delete'
  | 'admin:tests:create' | 'admin:tests:update' | 'admin:tests:delete'
  | 'admin:analytics:view'
  // Superadmin permissions
  | 'superadmin:system:config' | 'superadmin:admins:manage' 
  | 'superadmin:logs:view' | 'superadmin:security:manage';

export interface AuthError {
  type: 'auth' | 'network' | 'validation' | 'server' | 'permission' | 'csrf' | 'rate_limit' | 'account_locked' | 'refresh_failed' | 'session_expired';
  message: string;
  code?: string | number;
  timestamp: number;
  context?: Record<string, any>;
  retryable?: boolean;
  userFriendlyMessage?: string;
  suggestedAction?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export type AuthResult = 
  | { success: true; user: User; error?: undefined; requiresVerification?: boolean; }
  | { success: true; requiresVerification: true; user?: undefined; error?: undefined; }
  | { success: false; error: AuthError; user?: undefined; requiresVerification?: undefined; };

export type LogoutReason = 'manual' | 'expired' | 'inactive' | 'security' | 'device_change' | 'error';

// ==========================================
// 🎯 UTILITY TYPES
// ==========================================

export interface PermissionContext {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// ==========================================
// 🔧 API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string | number;
  timestamp?: number;
}

// Simplified login response (no tokens in response body)
export interface LoginResponse {
  user: User;
  sessionInfo?: {
    loginTime: string;
    activeSessions: number;
    rememberMe: boolean;
  };
  csrfToken?: string;
  // 🔥 CRITICAL: Token expiry information for proactive refresh
  tokenExpiry?: {
    access_expires_at: number; // Unix timestamp
    refresh_expires_at: number; // Unix timestamp
  };
  // Note: accessToken and refreshToken are set as httpOnly cookies
  // and are not included in the response body for security
}

export interface RefreshResponse {
  success: boolean;
  message?: string;
  // 🔥 CRITICAL: Token expiry information for proactive refresh
  tokenExpiry?: {
    access_expires_at: number; // Unix timestamp
    refresh_expires_at: number; // Unix timestamp
  };
  // Note: New tokens are set as httpOnly cookies
  // and are not included in the response body
}

export interface RegisterResponse {
  user: Partial<User>;
  requiresVerification: boolean;
  verificationMethod?: 'email' | 'sms';
}

// ==========================================
// 🍪 COOKIE-SPECIFIC TYPES
// ==========================================

export interface CookieStatus {
  supported: boolean;
  message: string;
}

export interface AuthConfig {
  apiBaseUrl: string;
  sessionTimeout: number;
  warningThreshold: number;
  cookiesRequired: boolean;
}

// ==========================================
// 🎯 HOOK RETURN TYPES
// ==========================================

export interface AuthHookReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: (reason?: LogoutReason) => Promise<void>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  clearError: () => void;
  validateAuth: () => Promise<boolean>;
  initializeAuth: () => Promise<void>;
}

export interface PermissionHookReturn {
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

// ==========================================
// 🔍 STATUS TYPES
// ==========================================

export type AuthStatus = 
  | 'initializing'
  | 'loading' 
  | 'authenticated' 
  | 'unauthenticated' 
  | 'error';

export interface AuthStatusInfo {
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  user: User | null;
  error: AuthError | null;
  isReady: boolean;
}