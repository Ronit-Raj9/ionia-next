// ==========================================
// 🏷️ SHARED AUTH TYPES & INTERFACES
// ==========================================

export interface User {
  id: string;
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
  type: 'auth' | 'network' | 'validation' | 'server' | 'permission';
  message: string;
  code?: string | number;
  timestamp: number;
  context?: Record<string, any>;
}

export interface TokenInfo {
  token: string;
  expiresAt: number;
  issuedAt: number;
}

export interface SessionInfo {
  id: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  startTime: number;
  lastActivity: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    name: string;
    type: string;
    browser: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface RegisterData {
  email: string;
  username: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: AuthError;
  user?: User;
  requiresVerification?: boolean;
}

export type LogoutReason = 'manual' | 'expired' | 'inactive' | 'security' | 'device_change';