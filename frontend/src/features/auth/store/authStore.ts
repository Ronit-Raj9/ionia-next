// ==========================================
// 🏪 AUTH STORE - ZUSTAND-BASED AUTHENTICATION
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../api/authApi';
import { 
  createAuthError, 
  getSessionRemainingTime, 
  isSessionExpiring, 
  isSessionExpired,
  formatRemainingTime,
  SESSION_TIMEOUT,
  INACTIVITY_WARNING_TIME
} from '../utils/authUtils';
import type { 
  User, 
  UserRole, 
  Permission, 
  AuthError, 
  LoginCredentials, 
  RegisterData, 
  AuthResult, 
  LogoutReason
} from '../types';

// ==========================================
// 🎯 AUTH STORE STATE INTERFACE
// ==========================================

interface AuthState {
  // === CORE STATE ===
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
  rememberMe: boolean;

  // === SESSION MANAGEMENT ===
  lastActivity: number;
  sessionExpiry: number;
  isSessionExpiring: boolean;
  sessionWarningThreshold: number;
  proactiveRefreshTimer: NodeJS.Timeout | null;
  sessionCheckTimer: NodeJS.Timeout | null;

  // === ROLE & PERMISSION STATE ===
  userRole: UserRole | null;
  userPermissions: Permission[];

  // ==========================================
  // 🎯 CORE ACTIONS
  // ==========================================
  
  // User Management
  setUser: (user: User | null, rememberMe?: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;

  // Loading States
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;

  // Error Management
  setError: (error: AuthError | null) => void;
  clearError: () => void;

  // ==========================================
  // 👤 ROLE & PERMISSION ACTIONS
  // ==========================================
  
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  canAccess: (resource: string, action?: string) => boolean;
  isMinimumRole: (minRole: UserRole) => boolean;
  getRoleLevel: (role?: UserRole) => number;
  
  // ==========================================
  // 🔄 AUTH FLOW ACTIONS (COOKIE-BASED)
  // ==========================================
  
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: (reason?: LogoutReason) => Promise<void>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  validateAuth: () => Promise<boolean>;
  initializeAuth: () => Promise<void>;

  // ==========================================
  // ⏱️ SESSION MANAGEMENT ACTIONS
  // ==========================================
  
  updateActivity: () => void;
  startSessionMonitoring: () => void;
  stopSessionMonitoring: () => void;
  startProactiveRefresh: () => void;
  stopProactiveRefresh: () => void;
  performProactiveRefresh: () => Promise<void>;
  extendSession: () => void;
  endSession: () => void;
  getSessionStatus: () => {
    isExpiring: boolean;
    remainingTime: number;
    formattedRemainingTime: string;
    isExpired: boolean;
  };

  // ==========================================
  // 🧹 CLEANUP ACTIONS
  // ==========================================
  
  reset: () => void;
}

// ==========================================
// 🏪 AUTH STORE CREATION
// ==========================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // === INITIAL STATE ===
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      rememberMe: false,

      // === SESSION STATE ===
      lastActivity: Date.now(),
      sessionExpiry: Date.now() + SESSION_TIMEOUT,
      isSessionExpiring: false,
      sessionWarningThreshold: INACTIVITY_WARNING_TIME,
      proactiveRefreshTimer: null,
      sessionCheckTimer: null,

      // === ROLE STATE ===
      userRole: null,
      userPermissions: [],

      // ==========================================
      // 🎯 CORE ACTIONS
      // ==========================================

      setUser: (user, rememberMe = false) => {
        set({
          user,
          isAuthenticated: !!user,
          userRole: user?.role || null,
          userPermissions: user?.permissions || [],
          rememberMe,
          lastActivity: Date.now(),
          sessionExpiry: Date.now() + SESSION_TIMEOUT,
          error: null,
        });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
          userRole: null,
          userPermissions: [],
          error: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // ==========================================
      // 👤 ROLE & PERMISSION ACTIONS
      // ==========================================

      hasRole: (role) => {
        const { userRole } = get();
        if (Array.isArray(role)) {
          return userRole ? role.includes(userRole) : false;
        }
        return userRole === role;
      },

      hasPermission: (permission) => {
        const { userPermissions } = get();
        if (Array.isArray(permission)) {
          return permission.some(p => userPermissions.includes(p));
        }
        return userPermissions.includes(permission);
      },

      canAccess: (resource, action = 'read') => {
        const { userRole, userPermissions } = get();
        if (!userRole) return false;
        
        // Admin and superadmin have broad access
        if (userRole === 'admin' || userRole === 'superadmin') {
          return true;
        }
        
        const permission = `${resource}:${action}` as Permission;
        return userPermissions.includes(permission);
      },

      isMinimumRole: (minRole) => {
        const { userRole } = get();
        if (!userRole) return false;
        
        const roleHierarchy = { user: 1, admin: 2, superadmin: 3 };
        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = roleHierarchy[minRole] || 0;
        
        return userLevel >= requiredLevel;
      },

      getRoleLevel: (role) => {
        const roleHierarchy = { user: 1, admin: 2, superadmin: 3 };
        return roleHierarchy[role || get().userRole || 'user'] || 0;
      },

      // ==========================================
      // 🔄 AUTH FLOW ACTIONS
      // ==========================================

      login: async (credentials) => {
        const { setLoading, setError, setUser, startSessionMonitoring } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const response = await authAPI.login(credentials);
          setUser(response.user, credentials.rememberMe);
          startSessionMonitoring();
          
          return { success: true, user: response.user };
        } catch (error: any) {
          const authError = createAuthError(
            'auth',
            error.message || 'Login failed',
            { credentials: { email: credentials.email } }
          );
          setError(authError);
          return { success: false, error: authError };
        } finally {
          setLoading(false);
        }
      },

      logout: async (reason = 'manual') => {
        const { clearUser, stopSessionMonitoring, setLoading } = get();
        
        try {
          setLoading(true);
          await authAPI.logout();
        } catch (error) {
          console.warn('Logout API call failed:', error);
        } finally {
          clearUser();
          stopSessionMonitoring();
          setLoading(false);
        }
      },

      register: async (userData) => {
        const { setLoading, setError } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          await authAPI.register(userData);
          
          return { success: true, requiresVerification: true };
        } catch (error: any) {
          const authError = createAuthError(
            'validation',
            error.message || 'Registration failed',
            { userData: { email: userData.email } }
          );
          setError(authError);
          return { success: false, error: authError };
        } finally {
          setLoading(false);
        }
      },

      validateAuth: async () => {
        const { setLoading, setError, setUser, clearUser, startSessionMonitoring } = get();
        
        try {
          setLoading(true);
          const user = await authAPI.getCurrentUser();
          setUser(user);
          startSessionMonitoring();
          return true;
        } catch (error: any) {
          clearUser();
          setError(createAuthError('auth', 'Authentication validation failed'));
          return false;
        } finally {
          setLoading(false);
        }
      },

      initializeAuth: async () => {
        const { setInitialized, validateAuth } = get();
        
        try {
          await validateAuth();
        } catch (error) {
          console.error('Auth initialization failed:', error);
        } finally {
          setInitialized(true);
        }
      },

      // ==========================================
      // ⏱️ SESSION MANAGEMENT ACTIONS
      // ==========================================

      updateActivity: () => {
        const { startSessionMonitoring } = get();
        set({ 
          lastActivity: Date.now(),
          sessionExpiry: Date.now() + SESSION_TIMEOUT 
        });
        startSessionMonitoring();
      },

      startSessionMonitoring: () => {
        const { stopSessionMonitoring } = get();
        stopSessionMonitoring(); // Clear existing timers
        
        const sessionCheckTimer = setInterval(() => {
          const { getSessionStatus, isAuthenticated } = get();
          if (!isAuthenticated) return;
          
          const { isExpiring, isExpired } = getSessionStatus();
          
          if (isExpired) {
            get().logout('expired');
          } else if (isExpiring) {
            set({ isSessionExpiring: true });
          }
        }, 30000); // Check every 30 seconds
        
        set({ sessionCheckTimer });
      },

      stopSessionMonitoring: () => {
        const { sessionCheckTimer, proactiveRefreshTimer } = get();
        
        if (sessionCheckTimer) {
          clearInterval(sessionCheckTimer);
        }
        if (proactiveRefreshTimer) {
          clearTimeout(proactiveRefreshTimer);
        }
        
        set({ 
          sessionCheckTimer: null, 
          proactiveRefreshTimer: null,
          isSessionExpiring: false 
        });
      },

      startProactiveRefresh: () => {
        const { stopProactiveRefresh } = get();
        stopProactiveRefresh();
        
        const proactiveRefreshTimer = setTimeout(() => {
          get().performProactiveRefresh();
        }, 4 * 60 * 1000); // Refresh 4 minutes before expiry
        
        set({ proactiveRefreshTimer });
      },

      stopProactiveRefresh: () => {
        const { proactiveRefreshTimer } = get();
        if (proactiveRefreshTimer) {
          clearTimeout(proactiveRefreshTimer);
        }
        set({ proactiveRefreshTimer: null });
      },

      performProactiveRefresh: async () => {
        const { isAuthenticated, updateActivity } = get();
        if (!isAuthenticated) return;
        
        try {
          // The refresh happens automatically via cookies
          // We just need to update our activity tracking
          updateActivity();
        } catch (error) {
          console.error('Proactive refresh failed:', error);
        }
      },

      extendSession: () => {
        const { updateActivity } = get();
        updateActivity();
      },

      endSession: () => {
        const { logout } = get();
        logout('manual');
      },

      getSessionStatus: () => {
        const { lastActivity, sessionExpiry } = get();
        const remainingTime = getSessionRemainingTime(lastActivity);
        const isExpiring = isSessionExpiring(lastActivity);
        const isExpired = isSessionExpired(lastActivity);
        
        return {
          isExpiring,
          remainingTime,
          formattedRemainingTime: formatRemainingTime(remainingTime),
          isExpired,
        };
      },

      // ==========================================
      // 🧹 CLEANUP ACTIONS
      // ==========================================

      reset: () => {
        const { stopSessionMonitoring } = get();
        stopSessionMonitoring();
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: false,
          error: null,
          rememberMe: false,
          lastActivity: Date.now(),
          sessionExpiry: Date.now() + SESSION_TIMEOUT,
          isSessionExpiring: false,
          userRole: null,
          userPermissions: [],
          proactiveRefreshTimer: null,
          sessionCheckTimer: null,
        });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
        lastActivity: state.lastActivity,
        sessionExpiry: state.sessionExpiry,
      }),
    }
  )
);

// ==========================================
// 🎯 STORE SELECTORS & UTILITIES
// ==========================================

export const useAuthState = () => {
  return useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,
  }));
};

export const useAuthPermissions = () => {
  return useAuthStore((state) => ({
    hasRole: state.hasRole,
    hasPermission: state.hasPermission,
    canAccess: state.canAccess,
    isMinimumRole: state.isMinimumRole,
    userRole: state.userRole,
    userPermissions: state.userPermissions,
  }));
};

export const useSessionStatus = () => {
  return useAuthStore((state) => {
    const sessionStatus = state.getSessionStatus();
    return {
      ...sessionStatus,
      extendSession: state.extendSession,
      endSession: state.endSession,
    };
  });
};