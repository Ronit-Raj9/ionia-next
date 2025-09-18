// ==========================================
// 🏪 SIMPLIFIED AUTH STORE - JWT ONLY
// ==========================================

import { create } from 'zustand';
import { authAPI } from '../api/authApi';
import { createAuthError, getTokenExpiry, isTokenExpiringSoon, getTimeUntilExpiry, EnhancedAuthError } from '../utils/authUtils';
import { authLogger } from '../utils/logger';

// ==========================================
// 💾 USER PERSISTENCE UTILITIES
// ==========================================

const USER_STORAGE_KEY = 'ionia_user_cache';

interface CachedUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  emailVerified: boolean;
  cachedAt: number;
}

const getUserFromStorage = (): CachedUser | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!cached) return null;
    
    const userData: CachedUser = JSON.parse(cached);
    
    // Check if cache is still valid (5 minutes)
    const isExpired = Date.now() - userData.cachedAt > 5 * 60 * 1000;
    if (isExpired) {
      sessionStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
    
    return userData;
  } catch {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

const setUserInStorage = (user: any): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const cachedUser: CachedUser = {
      id: user.id || user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      emailVerified: user.emailVerified,
      cachedAt: Date.now(),
    };
    
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(cachedUser));
  } catch {
    // Ignore storage errors
  }
};

const clearUserFromStorage = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};

// ==========================================
// 🔄 CROSS-TAB SYNC UTILITIES
// ==========================================

const AUTH_SYNC_CHANNEL = 'ionia_auth_sync';

interface AuthSyncMessage {
  type: 'login' | 'logout' | 'refresh' | 'error';
  data?: any;
  timestamp: number;
}

const broadcastAuthEvent = (type: AuthSyncMessage['type'], data?: any): void => {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
  
  try {
    const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
    channel.postMessage({
      type,
      data,
      timestamp: Date.now(),
    });
    channel.close();
  } catch {
    // Ignore broadcast errors
  }
};

const setupAuthSync = (onMessage: (message: AuthSyncMessage) => void): (() => void) => {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return () => {}; // No-op cleanup
  }
  
  try {
    const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
    
    channel.onmessage = (event) => {
      const message = event.data as AuthSyncMessage;
      onMessage(message);
    };
    
    return () => {
      channel.close();
    };
  } catch {
    return () => {}; // No-op cleanup
  }
};
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
  error: EnhancedAuthError | null;
  
  // Token management
  tokenExpiry: number | null;
  refreshInterval: NodeJS.Timeout | null;
  backgroundRefreshEnabled: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: EnhancedAuthError | null) => void;
  clearError: () => void;
  
  // Auth flow
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: (reason?: LogoutReason) => Promise<void>;
  logoutFromAllDevices: () => Promise<void>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  initializeAuth: () => Promise<void>;
  refreshTokens: () => Promise<void>;

  // Token management
  startBackgroundRefresh: () => void;
  stopBackgroundRefresh: () => void;
  scheduleProactiveRefresh: () => void;
  
  // Cross-tab sync
  setupCrossTabSync: () => () => void;
  
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
  
  // Global refresh expiry handler
  handleRefreshExpiry: () => void;
  
  // Cleanup
  reset: () => void;
}

// ==========================================
// 🏪 AUTH STORE CREATION
// ==========================================

export const useAuthStore = create<AuthState>()((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  
  // Token management
  tokenExpiry: null,
  refreshInterval: null,
  backgroundRefreshEnabled: false,

  // Actions
  setUser: (user) => {
    // Map _id to id for frontend compatibility if user exists
    const mappedUser = user ? {
      ...user,
      id: (user as any)._id || user.id, // Use _id if id is not present
    } : null;
    
    // Cache user data for faster reloads
    if (mappedUser) {
      setUserInStorage(mappedUser);
    } else {
      clearUserFromStorage();
    }
    
    set({
      user: mappedUser,
      isAuthenticated: !!mappedUser,
      error: null,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Auth flow
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await authAPI.login(credentials);
      
      // Map _id to id for frontend compatibility
      const mappedUser = {
        ...response.user,
        id: (response.user as any)._id || response.user.id, // Use _id if id is not present
      };
      
      get().setUser(mappedUser);
      
      // Broadcast login event to other tabs
      broadcastAuthEvent('login', { userId: mappedUser.id });
      
      // Start background refresh
      get().scheduleProactiveRefresh();
      
      return { success: true, user: mappedUser };
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
        // Check if it's a CSRF error
        if (error.message?.includes('CSRF') || error.message?.includes('csrf')) {
          authError = createAuthError('csrf', 'CSRF token mismatch. Please refresh the page and try again.', { csrfError: true });
        } else {
          authError = createAuthError('permission', 'Account has been deactivated. Please contact support.', { deactivated: true });
        }
      } else if (error.status >= 500) {
        authError = createAuthError('server', 'Server error. Please try again later or contact support if the problem persists.', { serverError: true });
      } else if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('connection')) {
        authError = createAuthError('network', 'Network error. Please check your connection and try again.', { networkError: true });
      } else {
        authError = createAuthError('auth', error.message || 'Login failed', { credentials: { email: credentials.email } });
      }
      
      authLogger.error('Login failed', { error: authError, status: error.status }, 'AUTH');
      
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
        isInitialized: true, // Keep initialized true
      });
      
      // Broadcast logout event to other tabs
      broadcastAuthEvent('logout', { reason });
      
      // Stop background refresh
      get().stopBackgroundRefresh();
      
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
        isInitialized: true, // Keep initialized true
      });
      
      // Broadcast logout event to other tabs
      broadcastAuthEvent('logout', { reason: 'all_devices' });
      
      // Stop background refresh
      get().stopBackgroundRefresh();
      
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
      
      // Don't show cached user immediately to prevent flicker
      // Instead, show loading state until API verification completes
      set({ isLoading: true, isInitialized: false });
      
      // Always verify with API
      const user = await authAPI.getCurrentUser();
      
      // Map _id to id for frontend compatibility
      const mappedUser = {
        ...user,
        id: (user as any)._id || user.id, // Use _id if id is not present
      };
      
      console.log('✅ Got user from API:', { id: mappedUser.id, email: mappedUser.email, isAuthenticated: true });
      
      // Set user and mark as authenticated
      set({
        user: mappedUser,
        isAuthenticated: true,
        error: null,
        isLoading: false,
        isInitialized: true,
      });
      
      // Start background refresh
      get().scheduleProactiveRefresh();
      
      console.log('✅ Auth state updated successfully');
    } catch (error: any) {
      console.log('❌ No valid session found:', error.message || error);
      
      // If this is a refresh failure, ensure we're logged out
      if (error.isRefreshFailed) {
        console.log('🔄 Refresh failed during initialization, clearing auth state');
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null,
          isLoading: false,
          isInitialized: true,
        });
        return;
      }
      
      // Clear any stale auth state
      set({ 
        user: null, 
        isAuthenticated: false, 
        error: null,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  refreshTokens: async () => {
    const { refreshRetryCount, lastRefreshAttempt } = get();
    const now = Date.now();
    
    // Circuit breaker: if we've failed too many times recently, don't retry
    if (refreshRetryCount >= 3 && (now - lastRefreshAttempt) < 60000) { // 1 minute cooldown
      authLogger.securityEvent('refresh circuit breaker triggered', { 
        retryCount: refreshRetryCount, 
        lastAttempt: lastRefreshAttempt 
      });
      get().logout('expired');
      return;
    }
    
    try {
      authLogger.tokenRefresh('attempting', { retryCount: refreshRetryCount });
      
      // Reset retry count on successful refresh
      set({ refreshRetryCount: 0, lastRefreshAttempt: now });
      
      await authAPI.refreshToken();
      
      // Schedule next proactive refresh
      get().scheduleProactiveRefresh();
      
      // Broadcast refresh event to other tabs
      broadcastAuthEvent('refresh');
      
      authLogger.tokenRefresh('success', {});
    } catch (error: any) {
      const newRetryCount = refreshRetryCount + 1;
      const newLastAttempt = Date.now();
      
      authLogger.tokenRefresh('failed', { 
        error: error.message, 
        retryCount: newRetryCount 
      });
      
      // Update retry state
      set({ 
        refreshRetryCount: newRetryCount, 
        lastRefreshAttempt: newLastAttempt 
      });
      
      // Broadcast error event to other tabs
      broadcastAuthEvent('error', { error: error.message });
      
      // If we've exhausted retries, log out
      if (newRetryCount >= 3) {
        authLogger.securityEvent('refresh exhausted all retries', { 
          retryCount: newRetryCount 
        });
        get().logout('expired');
      }
      
      throw error;
    }
  },

  // Token management
  startBackgroundRefresh: () => {
    const { backgroundRefreshEnabled, refreshInterval } = get();
    
    if (backgroundRefreshEnabled || refreshInterval) {
      return; // Already running
    }
    
    console.log('🔄 Starting background token refresh...');
    
    // Check every 30 seconds if tab is active
    const interval = setInterval(() => {
      if (document.hidden) return; // Skip if tab is not active
      
      const { tokenExpiry } = get();
      if (!tokenExpiry) return;
      
      const now = Date.now();
      const timeUntilExpiry = tokenExpiry - now;
      
      // Refresh if token expires in next 30 seconds
      if (timeUntilExpiry <= 30000 && timeUntilExpiry > 0) {
        console.log('⏰ Proactive token refresh triggered');
        get().refreshTokens().catch(() => {
          // Error handling is done in refreshTokens
        });
      }
    }, 30000);
    
    set({ 
      refreshInterval: interval,
      backgroundRefreshEnabled: true 
    });
  },

  stopBackgroundRefresh: () => {
    const { refreshInterval } = get();
    
    if (refreshInterval) {
      clearInterval(refreshInterval);
      console.log('🛑 Background token refresh stopped');
    }
    
    set({ 
      refreshInterval: null,
      backgroundRefreshEnabled: false 
    });
  },

  scheduleProactiveRefresh: () => {
    // Try to extract token expiry from cookies
    const getAccessTokenFromCookie = (): string | null => {
      if (typeof window === 'undefined') return null;
      
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('access-token=')
      );
      return tokenCookie ? tokenCookie.split('=')[1] : null;
    };
    
    const accessToken = getAccessTokenFromCookie();
    let tokenExpiry: number | null = null;
    
    if (accessToken) {
      tokenExpiry = getTokenExpiry(accessToken);
      authLogger.debug('Token expiry extracted', { expiry: tokenExpiry }, 'TOKEN');
    }
    
    // Fallback to default 5-minute expiry if we can't extract it
    if (!tokenExpiry) {
      tokenExpiry = Date.now() + (5 * 60 * 1000);
      authLogger.debug('Using default token expiry', { expiry: tokenExpiry }, 'TOKEN');
    }
    
    set({ tokenExpiry });
    
    // Start background refresh if not already running
    get().startBackgroundRefresh();
  },

  // Cross-tab sync
  setupCrossTabSync: () => {
    return setupAuthSync((message: AuthSyncMessage) => {
      const { type, data } = message;
      
      switch (type) {
        case 'login':
          // Another tab logged in - refresh our state
          console.log('🔄 Login detected in another tab, refreshing state...');
          get().initializeAuth();
          break;
          
        case 'logout':
          // Another tab logged out - clear our state
          console.log('🔄 Logout detected in another tab, clearing state...');
          get().stopBackgroundRefresh();
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            tokenExpiry: null,
          });
          break;
          
        case 'refresh':
          // Another tab refreshed tokens - update our expiry
          console.log('🔄 Token refresh detected in another tab...');
          get().scheduleProactiveRefresh();
          break;
          
        case 'error':
          // Another tab had an auth error - handle accordingly
          console.log('🔄 Auth error detected in another tab:', data?.error);
          if (data?.error?.includes('refresh')) {
            get().handleRefreshExpiry();
          }
          break;
      }
    });
  },

  // Global refresh expiry handler
  handleRefreshExpiry: () => {
    console.log('🔄 Refresh token expired, logging out user...');
    get().logout('expired');
  },

  // Note: Session management removed - using JWT-only authentication

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
    // Stop background refresh
    get().stopBackgroundRefresh();
    
    clearUserFromStorage();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      tokenExpiry: null,
      refreshInterval: null,
      backgroundRefreshEnabled: false,
    });
  },
}));

