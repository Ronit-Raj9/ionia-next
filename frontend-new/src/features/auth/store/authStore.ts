import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// Import shared types
import type {
  User,
  UserRole,
  Permission,
  AuthError,
  TokenInfo,
  SessionInfo,
  LoginCredentials,
  RegisterData,
  AuthResult,
  LogoutReason
} from '../types';

// Import helper functions
import { 
  parseJWT, 
  generateDeviceId, 
  getUserFromToken, 
  isMinimumRoleLevel 
} from '../utils/authUtils';

// Import auth service (default export)
import authService from '../services/authService';

// ==========================================
// 🧠 AUTH STORE STATE INTERFACE
// ==========================================

interface AuthState {
  // === CORE STATE ===
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;

  // === TOKEN MANAGEMENT ===
  accessToken: TokenInfo | null;
  refreshToken: TokenInfo | null;
  isRefreshing: boolean;
  refreshPromise: Promise<boolean> | null;

  // === SESSION MANAGEMENT ===
  session: SessionInfo | null;
  lastActivity: number;
  loginTimestamp: number | null;

  // === UI STATE ===
  showSessionExpiredModal: boolean;
  showInactivityWarning: boolean;
  isSessionValid: boolean;

  // === ROLE & PERMISSION STATE ===
  userRole: UserRole | null;
  userPermissions: Permission[];
  roleHierarchy: Record<UserRole, number>;

  // ==========================================
  // 🎯 CORE ACTIONS
  // ==========================================
  
  // User Management
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;

  // Loading States
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;

  // Error Management
  setError: (error: AuthError | null) => void;
  clearError: () => void;
  addError: (type: AuthError['type'], message: string, context?: Record<string, any>) => void;

  // ==========================================
  // 🔑 TOKEN ACTIONS
  // ==========================================
  
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearTokens: () => void;
  updateAccessToken: (accessToken: string) => void;
  isTokenExpired: (token?: TokenInfo) => boolean;
  isTokenExpiring: (token?: TokenInfo, thresholdMinutes?: number) => boolean;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;

  // ==========================================
  // 🔐 SESSION ACTIONS
  // ==========================================
  
  createSession: (deviceInfo?: Partial<SessionInfo>) => void;
  updateActivity: () => void;
  validateSession: () => boolean;
  clearSession: () => void;
  isSessionExpired: () => boolean;
  getSessionDuration: () => number;

  // ==========================================
  // 👤 ROLE & PERMISSION ACTIONS
  // ==========================================
  
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  canAccess: (resource: string, action?: string) => boolean;
  isMinimumRole: (minRole: UserRole) => boolean;
  getRoleLevel: (role?: UserRole) => number;
  
  // ==========================================
  // 🔄 AUTH FLOW ACTIONS
  // ==========================================
  
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: (reason?: LogoutReason) => Promise<void>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  refreshAuth: () => Promise<boolean>;
  validateAuth: () => Promise<boolean>;
  initializeAuth: () => Promise<void>;

  // ==========================================
  // 🎨 UI ACTIONS
  // ==========================================
  
  showSessionExpired: () => void;
  hideSessionExpired: () => void;
  showInactivityAlert: () => void;
  hideInactivityAlert: () => void;
  resetInactivityTimer: () => void;

  // ==========================================
  // 🧹 CLEANUP ACTIONS
  // ==========================================
  
  reset: () => void;
  cleanup: () => void;
}

// ==========================================
// 🔧 SUPPORTING TYPES
// ==========================================

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    name: string;
    type: string;
    browser: string;
  };
}

interface RegisterData {
  email: string;
  username: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface AuthResult {
  success: boolean;
  error?: AuthError;
  user?: User;
  requiresVerification?: boolean;
}

type LogoutReason = 'manual' | 'expired' | 'inactive' | 'security' | 'device_change';

// ==========================================
// 🛠️ UTILITY CONSTANTS
// ==========================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
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

// Session timeouts
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_WARNING_TIME = 25 * 60 * 1000; // 25 minutes
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// ==========================================
// 🧠 MAIN ZUSTAND STORE IMPLEMENTATION
// ==========================================

export const useAuthStore = create<AuthState>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // === INITIAL STATE ===
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: false,
          error: null,
          
          accessToken: null,
          refreshToken: null,
          isRefreshing: false,
          refreshPromise: null,
          
          session: null,
          lastActivity: Date.now(),
          loginTimestamp: null,
          
          showSessionExpiredModal: false,
          showInactivityWarning: false,
          isSessionValid: false,
          
          userRole: null,
          userPermissions: [],
          roleHierarchy: ROLE_HIERARCHY,

          // ==========================================
          // 🎯 CORE ACTIONS IMPLEMENTATION
          // ==========================================

          setUser: (user) =>
            set((state) => {
              state.user = user;
              state.isAuthenticated = !!user;
              state.userRole = user?.role || null;
              state.userPermissions = user?.permissions || [];
              state.lastActivity = Date.now();
              
              if (user) {
                state.loginTimestamp = Date.now();
                state.isSessionValid = true;
                state.error = null;
              } else {
                state.loginTimestamp = null;
                state.isSessionValid = false;
                state.session = null;
              }
            }),

          updateUser: (updates) =>
            set((state) => {
              if (state.user) {
                Object.assign(state.user, updates);
                if (updates.role) {
                  state.userRole = updates.role;
                  state.userPermissions = DEFAULT_PERMISSIONS[updates.role];
                }
                if (updates.permissions) {
                  state.userPermissions = updates.permissions;
                }
              }
            }),

          clearUser: () =>
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.userRole = null;
              state.userPermissions = [];
              state.loginTimestamp = null;
              state.isSessionValid = false;
            }),

          setLoading: (loading) =>
            set((state) => {
              state.isLoading = loading;
            }),

          setInitialized: (initialized) =>
            set((state) => {
              state.isInitialized = initialized;
            }),

          setError: (error) =>
            set((state) => {
              state.error = error;
            }),

          clearError: () =>
            set((state) => {
              state.error = null;
            }),

          addError: (type, message, context) =>
            set((state) => {
              state.error = {
                type,
                message,
                timestamp: Date.now(),
                context,
              };
            }),

          // ==========================================
          // 🔑 TOKEN ACTIONS IMPLEMENTATION
          // ==========================================

          setTokens: (accessToken, refreshToken) =>
            set((state) => {
              const now = Date.now();
              
              // Parse and set access token
              if (accessToken) {
                const payload = parseJWT(accessToken);
                state.accessToken = {
                  token: accessToken,
                  expiresAt: payload?.exp ? payload.exp * 1000 : now + 15 * 60 * 1000,
                  issuedAt: payload?.iat ? payload.iat * 1000 : now,
                };
              }

              // Parse and set refresh token
              if (refreshToken) {
                const payload = parseJWT(refreshToken);
                state.refreshToken = {
                  token: refreshToken,
                  expiresAt: payload?.exp ? payload.exp * 1000 : now + 7 * 24 * 60 * 60 * 1000,
                  issuedAt: payload?.iat ? payload.iat * 1000 : now,
                };
              }

              state.error = null;
            }),

          clearTokens: () =>
            set((state) => {
              state.accessToken = null;
              state.refreshToken = null;
              state.isRefreshing = false;
              state.refreshPromise = null;
            }),

          updateAccessToken: (accessToken) =>
            set((state) => {
              const now = Date.now();
              const payload = parseJWT(accessToken);
              
              state.accessToken = {
                token: accessToken,
                expiresAt: payload?.exp ? payload.exp * 1000 : now + 15 * 60 * 1000,
                issuedAt: payload?.iat ? payload.iat * 1000 : now,
              };
              
              state.lastActivity = now;
              state.error = null;
            }),

          isTokenExpired: (token) => {
            const tokenInfo = token || get().accessToken;
            if (!tokenInfo) return true;
            return Date.now() >= tokenInfo.expiresAt;
          },

          isTokenExpiring: (token, thresholdMinutes = 5) => {
            const tokenInfo = token || get().accessToken;
            if (!tokenInfo) return false;
            const threshold = thresholdMinutes * 60 * 1000;
            return (tokenInfo.expiresAt - Date.now()) <= threshold;
          },

          getAccessToken: () => {
            const state = get();
            if (!state.accessToken || state.isTokenExpired(state.accessToken)) {
              return null;
            }
            return state.accessToken.token;
          },

          getRefreshToken: () => {
            const state = get();
            if (!state.refreshToken || state.isTokenExpired(state.refreshToken)) {
              return null;
            }
            return state.refreshToken.token;
          },

          // ==========================================
          // 🔐 SESSION ACTIONS IMPLEMENTATION
          // ==========================================

          createSession: (deviceInfo) =>
            set((state) => {
              const now = Date.now();
              state.session = {
                id: `session_${now}_${Math.random().toString(36).substr(2, 9)}`,
                deviceId: generateDeviceId(),
                startTime: now,
                lastActivity: now,
                ...deviceInfo,
              };
              state.lastActivity = now;
              state.isSessionValid = true;
            }),

          updateActivity: () =>
            set((state) => {
              const now = Date.now();
              state.lastActivity = now;
              if (state.session) {
                state.session.lastActivity = now;
              }
              state.showInactivityWarning = false;
            }),

          validateSession: () => {
            const state = get();
            if (!state.session) return false;
            
            const elapsed = Date.now() - state.lastActivity;
            const isValid = elapsed < SESSION_TIMEOUT;
            
            set((draft) => {
              draft.isSessionValid = isValid;
              if (!isValid) {
                draft.showSessionExpiredModal = true;
              }
            });
            
            return isValid;
          },

          clearSession: () =>
            set((state) => {
              state.session = null;
              state.isSessionValid = false;
              state.showSessionExpiredModal = false;
              state.showInactivityWarning = false;
            }),

          isSessionExpired: () => {
            const state = get();
            const elapsed = Date.now() - state.lastActivity;
            return elapsed >= SESSION_TIMEOUT;
          },

          getSessionDuration: () => {
            const state = get();
            if (!state.loginTimestamp) return 0;
            return Date.now() - state.loginTimestamp;
          },

          // ==========================================
          // 👤 ROLE & PERMISSION ACTIONS IMPLEMENTATION
          // ==========================================

          hasRole: (role) => {
            const state = get();
            if (!state.userRole) return false;
            
            if (Array.isArray(role)) {
              return role.includes(state.userRole);
            }
            return state.userRole === role;
          },

          hasPermission: (permission) => {
            const state = get();
            if (!state.userPermissions.length) return false;
            
            if (Array.isArray(permission)) {
              return permission.some(p => state.userPermissions.includes(p));
            }
            return state.userPermissions.includes(permission);
          },

          canAccess: (resource, action = 'read') => {
            const state = get();
            if (!state.userRole) return false;
            
            // Superadmins have access to everything
            if (state.userRole === 'superadmin') return true;
            
            // Check specific permission
            const permissionKey = `${resource}:${action}` as Permission;
            return state.userPermissions.includes(permissionKey);
          },

          isMinimumRole: (minRole) => {
            const state = get();
            if (!state.userRole) return false;
            return isMinimumRoleLevel(state.userRole, minRole);
          },

          getRoleLevel: (role) => {
            const targetRole = role || get().userRole;
            if (!targetRole) return 0;
            return ROLE_HIERARCHY[targetRole] || 0;
          },

          // ==========================================
          // 🔄 AUTH FLOW ACTIONS IMPLEMENTATION
          // ==========================================

          login: async (credentials) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              // Call auth service
              const response = await authService.login(credentials);
              
              if (!response.success) {
                throw new Error(response.error?.message || 'Login failed');
              }

              const { user, accessToken, refreshToken } = response.data!;
              
              set((state) => {
                // Set user and tokens
                state.user = user;
                state.isAuthenticated = true;
                state.userRole = user.role;
                state.userPermissions = user.permissions || DEFAULT_PERMISSIONS[user.role];
                
                // Set tokens
                get().setTokens(accessToken, refreshToken);
                
                // Create session
                get().createSession({
                  userAgent: credentials.deviceInfo?.userAgent,
                  ipAddress: credentials.deviceInfo?.ipAddress,
                });
                
                state.loginTimestamp = Date.now();
                state.lastActivity = Date.now();
                state.isLoading = false;
                state.error = null;
              });

              return { success: true, user };
            } catch (error: any) {
              const authError: AuthError = {
                type: 'auth',
                message: error.message || 'Login failed',
                timestamp: Date.now(),
                context: { email: credentials.email },
              };

              set((state) => {
                state.isLoading = false;
                state.error = authError;
              });

              return { success: false, error: authError };
            }
          },

          logout: async (reason = 'manual') => {
            set((state) => {
              state.isLoading = true;
            });

            try {
              // Call auth service to logout
              const refreshToken = get().getRefreshToken();
              if (refreshToken) {
                await authService.logout(refreshToken);
              }
            } catch (error) {
              console.warn('Logout API call failed:', error);
            } finally {
              // Clear state regardless of API success
              set((state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.userRole = null;
                state.userPermissions = [];
                state.loginTimestamp = null;
                state.isLoading = false;
                state.error = null;
              });
              
              get().clearTokens();
              get().clearSession();
            }
          },

          register: async (userData) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const response = await authService.register(userData);
              
              if (!response.success) {
                throw new Error(response.error?.message || 'Registration failed');
              }

              set((state) => {
                state.isLoading = false;
              });

              return { 
                success: true, 
                requiresVerification: response.data?.requiresVerification 
              };
            } catch (error: any) {
              const authError: AuthError = {
                type: 'auth',
                message: error.message || 'Registration failed',
                timestamp: Date.now(),
                context: { email: userData.email },
              };

              set((state) => {
                state.isLoading = false;
                state.error = authError;
              });

              return { success: false, error: authError };
            }
          },

          refreshAuth: async () => {
            const state = get();
            
            // Prevent multiple concurrent refresh attempts
            if (state.isRefreshing && state.refreshPromise) {
              return state.refreshPromise;
            }

            const refreshToken = get().getRefreshToken();
            if (!refreshToken) {
              return false;
            }

            const refreshPromise = (async () => {
              try {
                set((state) => {
                  state.isRefreshing = true;
                });

                const response = await authService.refreshToken(refreshToken);
                
                if (!response.success) {
                  throw new Error('Token refresh failed');
                }

                const { accessToken, refreshToken: newRefreshToken } = response.data!;
                
                set((state) => {
                  get().setTokens(accessToken, newRefreshToken);
                  state.lastActivity = Date.now();
                  state.isRefreshing = false;
                  state.refreshPromise = null;
                });

                return true;
              } catch (error) {
                set((state) => {
                  state.isRefreshing = false;
                  state.refreshPromise = null;
                });
                
                // Auto-logout on refresh failure
                await get().logout('expired');
                return false;
              }
            })();

            set((state) => {
              state.refreshPromise = refreshPromise;
            });

            return refreshPromise;
          },

          validateAuth: async () => {
            const state = get();
            
            if (!state.isAuthenticated || !state.user) {
              return false;
            }

            // Check if session is expired
            if (state.isSessionExpired()) {
              await get().logout('expired');
              return false;
            }

            // Check if token needs refresh
            if (state.accessToken && state.isTokenExpiring(state.accessToken)) {
              return await get().refreshAuth();
            }

            return true;
          },

          initializeAuth: async () => {
            try {
              const state = get();
              
              // Check if we have stored tokens
              const accessToken = state.getAccessToken();
              const refreshToken = state.getRefreshToken();
              
              if (!accessToken && !refreshToken) {
                set((state) => {
                  state.isInitialized = true;
                });
                return;
              }

              // Validate current session
              if (accessToken && !state.isTokenExpired()) {
                // Token is valid, try to get user info
                try {
                  const userInfo = getUserFromToken(accessToken);
                  if (userInfo) {
                    set((state) => {
                      state.user = {
                        id: userInfo.id,
                        email: userInfo.email,
                        role: userInfo.role,
                        permissions: userInfo.permissions,
                      } as User;
                      state.isAuthenticated = true;
                      state.userRole = userInfo.role;
                      state.userPermissions = userInfo.permissions || DEFAULT_PERMISSIONS[userInfo.role];
                      state.lastActivity = Date.now();
                    });
                  }
                } catch (error) {
                  console.warn('Failed to parse user from token:', error);
                }
              } else if (refreshToken && !state.isTokenExpired(state.refreshToken)) {
                // Access token expired but refresh token is valid
                await state.refreshAuth();
              } else {
                // Both tokens are expired, clear everything
                get().clearTokens();
                get().clearUser();
                get().clearSession();
              }
            } catch (error) {
              console.error('Auth initialization failed:', error);
              get().clearTokens();
              get().clearUser();
              get().clearSession();
            } finally {
              set((state) => {
                state.isInitialized = true;
              });
            }
          },

          // ==========================================
          // 🎨 UI ACTIONS IMPLEMENTATION
          // ==========================================

          showSessionExpired: () =>
            set((state) => {
              state.showSessionExpiredModal = true;
            }),

          hideSessionExpired: () =>
            set((state) => {
              state.showSessionExpiredModal = false;
            }),

          showInactivityAlert: () =>
            set((state) => {
              state.showInactivityWarning = true;
            }),

          hideInactivityAlert: () =>
            set((state) => {
              state.showInactivityWarning = false;
            }),

          resetInactivityTimer: () =>
            set((state) => {
              state.lastActivity = Date.now();
              state.showInactivityWarning = false;
              if (state.session) {
                state.session.lastActivity = Date.now();
              }
            }),

          // ==========================================
          // 🧹 CLEANUP ACTIONS IMPLEMENTATION
          // ==========================================

          reset: () =>
            set((state) => {
              // Reset to initial state
              Object.assign(state, {
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: false,
                error: null,
                accessToken: null,
                refreshToken: null,
                isRefreshing: false,
                refreshPromise: null,
                session: null,
                lastActivity: Date.now(),
                loginTimestamp: null,
                showSessionExpiredModal: false,
                showInactivityWarning: false,
                isSessionValid: false,
                userRole: null,
                userPermissions: [],
                roleHierarchy: ROLE_HIERARCHY,
              });
            }),

          cleanup: () => {
            const state = get();
            
            // Clear any pending promises
            if (state.refreshPromise) {
              state.refreshPromise.catch(() => {});
            }
            
            // Reset state
            get().reset();
          },
        })),
        {
          name: 'auth-storage',
          partialize: (state) => ({
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            user: state.user,
            lastActivity: state.lastActivity,
            loginTimestamp: state.loginTimestamp,
          }),
        }
      )
    )
  )
);

// ==========================================
// 🎯 STORE SELECTORS
// ==========================================

export const authSelectors = {
  // User selectors
  getUser: (state: any) => state.user,
  isAuthenticated: (state: any) => state.isAuthenticated,
  getUserRole: (state: any) => state.userRole,
  getUserPermissions: (state: any) => state.userPermissions,
  
  // Token selectors
  getAccessToken: (state: any) => state.accessToken?.token,
  getRefreshToken: (state: any) => state.refreshToken?.token,
  isTokenExpired: (state: any) => state.isTokenExpired(),
  isTokenExpiring: (state: any) => state.isTokenExpiring(),
  
  // Session selectors
  getSession: (state: any) => state.session,
  getLastActivity: (state: any) => state.lastActivity,
  isSessionValid: (state: any) => state.isSessionValid,
  getSessionDuration: (state: any) => state.getSessionDuration(),
  
  // UI selectors
  isLoading: (state: any) => state.isLoading,
  getError: (state: any) => state.error,
  showSessionExpiredModal: (state: any) => state.showSessionExpiredModal,
  showInactivityWarning: (state: any) => state.showInactivityWarning,
  
  // Permission selectors
  hasRole: (state: any) => (role: UserRole | UserRole[]) => state.hasRole(role),
  hasPermission: (state: any) => (permission: Permission | Permission[]) => state.hasPermission(permission),
  canAccess: (state: any) => (resource: string, action?: string) => state.canAccess(resource, action),
  isMinimumRole: (state: any) => (minRole: UserRole) => state.isMinimumRole(minRole),
};

// ==========================================
// 📤 CONVENIENCE HOOKS
// ==========================================

// Convenience hook for common auth state
export const useAuthState = () => {
  return useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
  }));
};

// Convenience hook for token management
export const useTokens = () => {
  return useAuthStore((state) => ({
    accessToken: state.getAccessToken(),
    refreshToken: state.getRefreshToken(),
    isExpired: state.isTokenExpired(),
    isExpiring: state.isTokenExpiring(),
    refresh: state.refreshAuth,
  }));
};

// Convenience hook for permissions
export const useAuthPermissions = () => {
  return useAuthStore((state) => ({
    role: state.userRole,
    permissions: state.userPermissions,
    hasRole: state.hasRole,
    hasPermission: state.hasPermission,
    canAccess: state.canAccess,
    isMinimumRole: state.isMinimumRole,
  }));
};