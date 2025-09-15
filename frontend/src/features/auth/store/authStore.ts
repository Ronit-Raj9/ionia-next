// ==========================================
// 🏪 SIMPLIFIED AUTH STORE - ZUSTAND-BASED
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../api/authApi';
import { createAuthError } from '../utils/authUtils';
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
// 🎯 SIMPLIFIED AUTH STATE
// ==========================================

interface AuthState {
  // Core state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
  lastActivity: number;
  sessionWarning: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: AuthError | null) => void;
  clearError: () => void;
  updateActivity: () => void;
  
  // Auth flow
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: (reason?: LogoutReason) => Promise<void>;
  logoutFromAllDevices: () => Promise<void>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  initializeAuth: () => Promise<void>;
  refreshTokens: () => Promise<void>;

  // Session management
  extendSession: () => void;
  checkSessionStatus: () => { isExpiring: boolean; timeRemaining: number };
  
  // Permissions (computed from user)
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  isMinimumRole: (minimumRole: UserRole) => boolean;
  
  // Username validation
  checkUsername: (username: string) => Promise<{ available: boolean; message: string }>;
  
  // User statistics
  getUserStatistics: () => Promise<{
    totalTests: number;
    averageScore: number;
    testsThisWeek: number;
    accuracy: number;
  }>;
  
  // Cleanup
  reset: () => void;
}

// ==========================================
// 🏪 AUTH STORE CREATION
// ==========================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      lastActivity: Date.now(),
      sessionWarning: false,

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      updateActivity: () => set({ lastActivity: Date.now(), sessionWarning: false }),

      // Auth flow
      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authAPI.login(credentials);
          get().setUser(response.user);
          
          return { success: true, user: response.user };
        } catch (error: any) {
          let authError;
          
          // Handle specific error types
          if (error.status === 0 || error.isNetworkError) {
            authError = createAuthError('network', 'Unable to connect to the server. Please check your internet connection and try again.', { networkError: true });
          } else if (error.status === 401) {
            authError = createAuthError('auth', 'Invalid email or password', { credentials: { email: credentials.email } });
          } else if (error.status === 423) {
            authError = createAuthError('auth', 'Account is temporarily locked due to multiple failed login attempts. Please try again later.', { locked: true });
          } else if (error.status === 429) {
            authError = createAuthError('auth', 'Too many login attempts. Please wait a few minutes before trying again.', { rateLimited: true });
          } else if (error.status === 403) {
            authError = createAuthError('auth', 'Account has been deactivated. Please contact support.', { deactivated: true });
          } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('connection')) {
            authError = createAuthError('network', 'Network error. Please check your connection and try again.', { networkError: true });
          } else {
            authError = createAuthError('auth', error.message || 'Login failed', { credentials: { email: credentials.email } });
          }
          
          set({ error: authError });
          return { success: false, error: authError };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async (reason = 'manual') => {
        try {
          set({ isLoading: true });
          
          // Call logout API to clear cookies on server
          await authAPI.logout();
          console.log('✅ Server logout successful');
        } catch (error) {
          console.warn('⚠️ Server logout failed, proceeding with local logout:', error);
          // Continue with local logout even if server call fails
        } finally {
          // Always clear local state regardless of server response
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
            sessionWarning: false,
            isInitialized: true, // Keep initialized true
          });
          
          // Clear localStorage auth data
          localStorage.removeItem('auth-store');
          
          console.log('🔄 Local logout completed');
        }
      },

      logoutFromAllDevices: async () => {
        try {
          set({ isLoading: true });
          
          // Call logout from all devices API
          await authAPI.logoutFromAllDevices();
          console.log('✅ Logout from all devices successful');
        } catch (error) {
          console.warn('⚠️ Logout from all devices failed, proceeding with local logout:', error);
        } finally {
          // Always clear local state regardless of server response
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
            sessionWarning: false,
            isInitialized: true, // Keep initialized true
          });
          
          // Clear localStorage auth data
          localStorage.removeItem('auth-store');
          
          console.log('🔄 Local logout from all devices completed');
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          await authAPI.register(userData);
          
          return { success: true, requiresVerification: true };
        } catch (error: any) {
          let authError;
          
          // Handle specific error types
          if (error.status === 0 || error.isNetworkError) {
            authError = createAuthError('network', 'Unable to connect to the server. Please check your internet connection and try again.', { networkError: true });
          } else if (error.status === 400) {
            authError = createAuthError('validation', error.message || 'Invalid registration data', { userData: { email: userData.email } });
          } else if (error.status === 409) {
            authError = createAuthError('validation', 'An account with this email already exists', { userData: { email: userData.email } });
          } else if (error.status === 429) {
            authError = createAuthError('auth', 'Too many registration attempts. Please wait a few minutes before trying again.', { rateLimited: true });
          } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('connection')) {
            authError = createAuthError('network', 'Network error. Please check your connection and try again.', { networkError: true });
          } else {
            authError = createAuthError('validation', error.message || 'Registration failed', { userData: { email: userData.email } });
          }
          
          set({ error: authError });
          return { success: false, error: authError };
        } finally {
          set({ isLoading: false });
        }
      },

      initializeAuth: async () => {
        try {
          console.log('🔄 Initializing auth...');
          const user = await authAPI.getCurrentUser();
          console.log('✅ Got user from API:', { id: user.id, email: user.email, isAuthenticated: true });
          
          // Set user and mark as authenticated
          set({
            user,
            isAuthenticated: true,
            error: null,
            lastActivity: Date.now(),
            isInitialized: true
          });
          
          console.log('✅ Auth state updated successfully');
        } catch (error: any) {
          console.log('❌ No valid session found:', error.message || error);
          
          // Clear any stale auth state
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null,
            isInitialized: true
          });
        }
      },

      refreshTokens: async () => {
        try {
          console.log('🔄 Manually refreshing tokens...');
          await authAPI.refreshToken();
          // Update last activity after successful refresh
          set({ lastActivity: Date.now() });
          console.log('✅ Tokens refreshed successfully');
        } catch (error: any) {
          console.log('❌ Token refresh failed:', error.message || error);
          // If manual refresh fails, log out the user
          get().logout('expired');
          throw error;
        }
      },

      // Session management
      extendSession: () => {
        get().updateActivity();
        // In cookie-based auth, activity update is enough
        // The backend handles session extension through cookie refresh
      },

      checkSessionStatus: () => {
        const { lastActivity } = get();
        const now = Date.now();
        const elapsed = now - lastActivity;
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        const warningThreshold = 25 * 60 * 1000; // 25 minutes
        
        const timeRemaining = sessionTimeout - elapsed;
        const isExpiring = elapsed >= warningThreshold && elapsed < sessionTimeout;
        
        if (isExpiring && !get().sessionWarning) {
          set({ sessionWarning: true });
        }
        
        return {
          isExpiring,
          timeRemaining: Math.max(0, timeRemaining)
        };
      },

      // Permissions (computed from user)
      hasRole: (role) => {
        const { user } = get();
        if (!user?.role) return false;
        
        if (Array.isArray(role)) {
          return role.includes(user.role);
        }
        return user.role === role;
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user?.permissions) return false;
        
        if (Array.isArray(permission)) {
          return permission.some(p => user.permissions.includes(p));
        }
        return user.permissions.includes(permission);
      },

      isMinimumRole: (minimumRole) => {
        const { user } = get();
        if (!user?.role) return false;
        
        const roleHierarchy = { user: 1, admin: 2, superadmin: 3 };
        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[minimumRole] || 0;
        
        return userLevel >= requiredLevel;
      },

      // Username validation
      checkUsername: async (username) => {
        try {
          return await authAPI.checkUsername(username);
        } catch (error: any) {
          return {
            available: false,
            message: error.message || 'Error checking username availability'
          };
        }
      },

      // User statistics
      getUserStatistics: async () => {
        try {
          return await authAPI.getUserStatistics();
        } catch (error: any) {
          throw new Error(error.message || 'Failed to fetch user statistics');
        }
      },

      // Cleanup
      reset: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: false,
          error: null,
          lastActivity: Date.now(),
          sessionWarning: false,
        });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
      // Merge function to handle hydration properly
      merge: (persistedState: any, currentState: AuthState) => ({
        ...currentState,
        ...persistedState,
        // Always start uninitialized on page load
        isInitialized: false,
        isLoading: false,
        error: null,
        sessionWarning: false,
      }),
    }
  )
);

