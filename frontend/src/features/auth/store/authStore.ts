// ==========================================
// 🏪 ENHANCED AUTH STORE - JWT ONLY WITH IMPROVEMENTS
// ==========================================

import { create } from 'zustand';
import { authAPI } from '../api/authApi';
import { createAuthError, getTokenExpiry, isTokenExpiringSoon, getTimeUntilExpiry, EnhancedAuthError, isTokenReuseError, handleTokenReuse, classifyAuthError } from '../utils/authUtils';
import { authLogger, errorTracker } from '../utils/logger';
import { AuthErrorHandler } from '../utils/errorHandler';
import { tokenManager, TokenExpiry } from '../utils/tokenManager';
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
// 🔧 ENHANCED CONFIGURATION
// ==========================================

// Enhanced offline queue item type
interface OfflineQueueItem {
  id: string;
  action: 'login' | 'register' | 'refresh' | 'logout';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number;
}

// Enhanced retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: 0.1, // 10% jitter
  ttl: 24 * 60 * 60 * 1000, // 24 hours
};

// Enhanced refresh configuration
const REFRESH_CONFIG = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  circuitBreakerThreshold: 3,
  circuitBreakerResetTime: 5 * 60 * 1000, // 5 minutes
};

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
  if (typeof window === 'undefined') return;
  
  const message: AuthSyncMessage = {
    type,
    data,
    timestamp: Date.now(),
  };
  
  // Try BroadcastChannel first
  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
      channel.postMessage(message);
      channel.close();
      return;
    } catch (error) {
      authLogger.warn('BroadcastChannel failed, using localStorage fallback', { error: (error as Error).message });
    }
  }
  
  // Fallback to localStorage
  try {
    localStorage.setItem('auth_sync_message', JSON.stringify(message));
    // Trigger storage event for same-tab listeners
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'auth_sync_message',
      newValue: JSON.stringify(message),
      oldValue: null,
      storageArea: localStorage
    }));
  } catch (error) {
    authLogger.warn('localStorage fallback failed', { error: (error as Error).message });
  }
};

const setupAuthSync = (onMessage: (message: AuthSyncMessage) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {}; // No-op cleanup
  }
  
  // Check for BroadcastChannel support
  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
      
      channel.onmessage = (event) => {
        const message = event.data as AuthSyncMessage;
        onMessage(message);
      };
      
      return () => {
        channel.close();
      };
    } catch (error) {
      authLogger.warn('BroadcastChannel failed, falling back to localStorage', { error: (error as Error).message });
    }
  }
  
  // Fallback to localStorage events for cross-tab sync
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'auth_sync_message' && e.newValue) {
      try {
        const message = JSON.parse(e.newValue) as AuthSyncMessage;
        onMessage(message);
      } catch (error) {
        authLogger.warn('Failed to parse localStorage sync message', { error: (error as Error).message });
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

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
  refreshExpiry: number | null;
  refreshInterval: NodeJS.Timeout | null;
  backgroundRefreshEnabled: boolean;
  
  // Refresh retry state
  refreshRetryCount: number;
  lastRefreshAttempt: number;
  
  // Offline queue state
  offlineQueue: OfflineQueueItem[];
  isOnline: boolean;
  
  // Cross-tab sync
  crossTabChannel: BroadcastChannel | null;

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
  scheduleProactiveRefresh: (tokenExpiry?: TokenExpiry) => void;
  
  // Cross-tab sync
  setupCrossTabSync: () => void;
  cleanupCrossTabSync: () => void;
  
  // Enhanced error tracking
  trackRefreshFailure: (error: Error, context?: Record<string, any>) => void;
  
  // Enhanced edge case handling
  handleEdgeCases: () => void;
  handleNetworkError: (error: any) => void;
  validateTokenState: () => void;
  
  // Token expiry fallback
  setLastKnownExpiry: (expiry: number) => void;
  getLastKnownExpiry: () => number | null;
  
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
  
  // Offline queue management
  addToOfflineQueue: (action: 'login' | 'register' | 'refresh' | 'logout', data: any) => void;
  processOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => void;
  
  // Cleanup
  reset: () => void;
  cleanup: () => void;
}

// ==========================================
// 🏪 AUTH STORE CREATION
// ==========================================

export const useAuthStore = create<AuthState>()((set, get) => {
  // Initialize token manager callbacks
  tokenManager.setOnTokenExpired(() => {
    authLogger.warn('Token expired, logging out user', {}, 'TOKEN');
    get().logout('expired');
  });

  tokenManager.setOnTokenRefreshed((expiry) => {
    authLogger.info('Token refreshed successfully', { 
      expiresAt: new Date(expiry.access_expires_at * 1000).toISOString()
    }, 'TOKEN');
    
    // Update token expiry state
    set({ 
      tokenExpiry: expiry.access_expires_at * 1000,
      refreshExpiry: expiry.refresh_expires_at * 1000
    });
    
    // Track successful refresh
    errorTracker.trackAuthEvent('token_refresh_success', {});
  });

  return {
    // Initial state
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,
    
    // Token management
    tokenExpiry: null,
    refreshExpiry: null,
    refreshInterval: null,
    backgroundRefreshEnabled: false,
    
    // Refresh retry state
    refreshRetryCount: 0,
    lastRefreshAttempt: 0,
    
    // Offline queue state
    offlineQueue: [],
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    
    // Cross-tab sync
    crossTabChannel: null,

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
      
      // Start background refresh with token expiry information
      if (response.tokenExpiry) {
        get().scheduleProactiveRefresh(response.tokenExpiry);
      } else {
        get().scheduleProactiveRefresh();
      }
      
      return { success: true, user: mappedUser };
    } catch (error: any) {
      const authError = AuthErrorHandler.handleAuthError(error, { 
        action: 'login', 
        credentials: { email: credentials.email } 
      });
      
      authLogger.error('Login failed', { error: authError, status: error.status }, 'AUTH');
      
      // Track login failure
      errorTracker.trackError(new Error(authError.message), {
        tags: { event: 'login_failed', errorType: authError.type },
        credentials: { email: credentials.email },
        status: error.status
      });
      
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
      authLogger.authFlow('server logout successful', {});
    } catch (error) {
      authLogger.warn('Server logout failed, proceeding with local logout', { error: (error as Error).message });
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
      
      authLogger.authFlow('local logout completed', {});
    }
  },

  logoutFromAllDevices: async () => {
    try {
      set({ isLoading: true });
      
      // Call logout from all devices API
      await authAPI.logoutFromAllDevices();
      authLogger.authFlow('logout from all devices successful', {});
    } catch (error) {
      authLogger.warn('Logout from all devices failed, proceeding with local logout', { error: (error as Error).message });
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
      
      authLogger.authFlow('local logout from all devices completed', {});
    }
  },

  register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      
      await authAPI.register(userData);
      
      return { success: true, requiresVerification: true };
    } catch (error: any) {
      const authError = AuthErrorHandler.handleAuthError(error, { 
        action: 'register', 
        userData: { email: userData.email } 
      });
      
      set({ error: authError });
      return { success: false, error: authError };
    } finally {
      set({ isLoading: false });
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true, isInitialized: false });
    
    try {
      authLogger.debug('Initializing auth', {}, 'AUTH');
      
      // 🔥 GET CSRF TOKEN FIRST
      try {
        // Use same logic as authApi.ts to construct API base URL
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        const apiBase = cleanBaseUrl.endsWith('/v1') ? cleanBaseUrl : `${cleanBaseUrl}/v1`;
        
        const response = await fetch(`${apiBase}/users/refresh-csrf`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          authLogger.debug('CSRF token obtained successfully', {}, 'CSRF');
        } else {
          authLogger.warn('CSRF token request failed', { status: response.status }, 'CSRF');
        }
      } catch (error: any) {
        authLogger.warn('Failed to get initial CSRF token', { error: error.message }, 'CSRF');
      }
      
      // Check cached user first for instant UI rehydration
      const cachedUser = getUserFromStorage();
      if (cachedUser) {
        authLogger.debug('Found cached user, setting immediately', { 
          userId: cachedUser.id 
        }, 'AUTH');
        
        // Set cached user immediately for smooth UX
        set({ 
          user: cachedUser as unknown as User, 
          isAuthenticated: true,
          isLoading: false // Don't show loading for cached user
        });
      }
      
      // Skip server verification if we're on auth pages and no cached user
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('/register') || currentPath.includes('/login') || currentPath.includes('/forgot-password');
        
        if (isAuthPage && !cachedUser) {
          authLogger.debug('Skipping server verification on auth page with no cached user', { path: currentPath }, 'AUTH');
          set({ user: null, isAuthenticated: false });
          return;
        }
      }
      
      // Verify with server in background
      authLogger.debug('Verifying user with server', {}, 'AUTH');
      const user = await authAPI.getCurrentUser();
      
      if (user) {
        get().setUser(user);
        
        // Track successful initialization
        errorTracker.trackAuthEvent('auth_initialization_success', { userId: user.id });
        errorTracker.setUser(user.id, {
          email: user.email,
          role: user.role,
          username: user.username
        });
        
        authLogger.info('Auth initialization successful', { userId: user.id }, 'AUTH');
      } else {
        // Server says no user, clear cache
        clearUserFromStorage();
        set({ user: null, isAuthenticated: false });
        
        authLogger.info('No authenticated user found', {}, 'AUTH');
      }
      
      // Handle edge cases after initialization
      get().handleEdgeCases();
      
      // Validate token state
      get().validateTokenState();
      
    } catch (error: any) {
      // Handle 401 errors gracefully (user not authenticated)
      if (error.status === 401) {
        authLogger.info('No authenticated user found during initialization', {}, 'AUTH');
        
        // Clear cache and set unauthenticated state
        clearUserFromStorage();
        set({ user: null, isAuthenticated: false });
      } else {
        authLogger.error('Auth initialization failed', { error: error.message }, 'AUTH');
        
        // Handle network errors specifically
        get().handleNetworkError(error);
        
        // Clear cache on error
        clearUserFromStorage();
        set({ user: null, isAuthenticated: false });
        
        // Track initialization failure (only for non-401 errors)
        errorTracker.trackError(error, { action: 'initialize_auth' });
      }
    } finally {
      set({ isInitialized: true, isLoading: false });
    }
  },

  refreshTokens: async () => {
    await tokenManager.refreshTokens();
  },

  // Token management
  startBackgroundRefresh: () => {
    const { tokenExpiry, refreshExpiry } = get();
    
    if (tokenExpiry && refreshExpiry) {
      tokenManager.startBackgroundRefresh({
        access_expires_at: tokenExpiry / 1000,
        refresh_expires_at: refreshExpiry / 1000
      });
    }
  },

  stopBackgroundRefresh: () => {
    tokenManager.stopBackgroundRefresh();
  },

  scheduleProactiveRefresh: (tokenExpiry?: TokenExpiry) => {
    if (tokenExpiry) {
      // Update token expiry state
      set({ 
        tokenExpiry: tokenExpiry.access_expires_at * 1000,
        refreshExpiry: tokenExpiry.refresh_expires_at * 1000
      });
      
      get().setLastKnownExpiry(tokenExpiry.access_expires_at * 1000);
      
      // Schedule refresh using token manager
      tokenManager.scheduleProactiveRefresh(tokenExpiry);
    }
  },

  // Cross-tab sync
  setupCrossTabSync: () => {
    const { crossTabChannel } = get();
    
    if (crossTabChannel) {
      return; // Already set up
    }
    
    try {
      if (typeof BroadcastChannel === 'undefined') {
        authLogger.warn('BroadcastChannel not supported, using localStorage fallback', {}, 'SYNC');
        // Fallback: Use localStorage events for basic sync
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'auth-sync-fallback' && e.newValue) {
            try {
              const data = JSON.parse(e.newValue);
              authLogger.crossTabSync('fallback sync event received', { data });
              if (data.type === 'logout') {
                get().logout(data.reason || 'manual');
              }
            } catch (error) {
              authLogger.error('Failed to parse fallback sync data', { error: (error as Error).message });
            }
          }
        };
        window.addEventListener('storage', handleStorageChange);
        set({ crossTabChannel: { close: () => window.removeEventListener('storage', handleStorageChange) } as any });
        return;
      }
      
      const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
      
      channel.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
        const { type, data } = event.data;
        
        authLogger.debug('Received cross-tab sync message', { type }, 'SYNC');
        
        switch (type) {
          case 'login':
            if (data.user) {
              get().setUser(data.user);
            }
            break;
          case 'logout':
            get().reset();
            break;
          case 'refresh':
            // Debounce refresh events to avoid multiple simultaneous refreshes
            const now = Date.now();
            const lastRefresh = get().lastRefreshAttempt;
            
            if (now - lastRefresh > 1000) { // 1 second debounce
              get().refreshTokens().catch((error) => {
                authLogger.error('Cross-tab refresh failed', { error: error.message }, 'SYNC');
              });
            }
            break;
          case 'error':
            if (data.error) {
              get().setError(data.error);
            }
            break;
        }
      };
      
      set({ crossTabChannel: channel });
      authLogger.info('Cross-tab sync set up', {}, 'SYNC');
      
    } catch (error: any) {
      authLogger.warn('Failed to set up cross-tab sync', { error: error.message }, 'SYNC');
    }
  },

  cleanupCrossTabSync: () => {
    const { crossTabChannel } = get();
    
    if (crossTabChannel) {
      crossTabChannel.close();
      set({ crossTabChannel: null });
      authLogger.info('Cross-tab sync cleaned up', {}, 'SYNC');
    }
  },

  // Enhanced error tracking
  trackRefreshFailure: (error: Error, context?: Record<string, any>) => {
    authLogger.error('Refresh failure tracked', { 
      error: error.message, 
      context 
    }, 'TOKEN');
    
    // Track with error tracker
    errorTracker.trackError(error, { 
      action: 'token_refresh', 
      ...context 
    });
    
    // Track security event
    errorTracker.trackAuthEvent('refresh_failure', { 
      error: error.message, 
      ...context 
    });
  },

  // Enhanced edge case handling
  handleEdgeCases: () => {
    const { user, isAuthenticated, isOnline } = get();
    
    // Edge case 1: User exists but no authentication state
    if (user && !isAuthenticated) {
      authLogger.warn('Edge case: User exists but not authenticated', { userId: user.id }, 'EDGE');
      set({ isAuthenticated: true });
    }
    
    // Edge case 2: Authentication state but no user
    if (isAuthenticated && !user) {
      authLogger.warn('Edge case: Authenticated but no user data', {}, 'EDGE');
      set({ isAuthenticated: false });
    }
    
    // Edge case 3: Offline but still trying to refresh
    if (!isOnline && get().refreshInterval) {
      authLogger.warn('Edge case: Offline but refresh interval active', {}, 'EDGE');
      get().stopBackgroundRefresh();
    }
    
    // Edge case 4: Cross-tab channel exists but not set up
    if (get().crossTabChannel && typeof BroadcastChannel === 'undefined') {
      authLogger.warn('Edge case: Cross-tab channel exists but BroadcastChannel not supported', {}, 'EDGE');
      set({ crossTabChannel: null });
    }
  },

  // Enhanced network error handling
  handleNetworkError: (error: any) => {
    const { isOnline } = get();
    
    // If we're offline, add to queue
    if (!isOnline) {
      authLogger.info('Network error while offline, adding to queue', { error: error.message }, 'NETWORK');
      get().addToOfflineQueue('refresh', {});
      return;
    }
    
    // If we're online but getting network errors, mark as offline
    if (error.status === 0 || error.isNetworkError) {
      authLogger.warn('Network error detected, marking as offline', { error: error.message }, 'NETWORK');
      set({ isOnline: false });
      
      // Try to process offline queue after a delay
      setTimeout(() => {
        get().processOfflineQueue().catch((queueError) => {
          authLogger.error('Failed to process offline queue', { error: queueError.message }, 'OFFLINE');
        });
      }, 5000);
    }
  },

  // Enhanced token validation
  validateTokenState: () => {
    const { tokenExpiry, refreshExpiry, user } = get();
    
    // Check if tokens are expired
    if (tokenExpiry && Date.now() > tokenExpiry) {
      authLogger.warn('Access token expired', { expiry: new Date(tokenExpiry).toISOString() }, 'TOKEN');
      
      // If refresh token is still valid, try to refresh
      if (refreshExpiry && Date.now() < refreshExpiry) {
        authLogger.info('Access token expired, attempting refresh', {}, 'TOKEN');
        get().refreshTokens().catch((error) => {
          authLogger.error('Failed to refresh expired token', { error: error.message }, 'TOKEN');
        });
      } else {
        authLogger.warn('Both tokens expired, logging out', {}, 'TOKEN');
        get().logout('expired');
      }
    }
  },

  // Token expiry fallback with enhanced security
  setLastKnownExpiry: (expiry: number) => {
    if (typeof window !== 'undefined') {
      // Validate expiry timestamp before storing
      const now = Date.now();
      const maxFuture = now + (365 * 24 * 60 * 60 * 1000); // 1 year from now
      
      if (expiry > now && expiry <= maxFuture) {
        sessionStorage.setItem('last_known_token_expiry', expiry.toString());
        // Add integrity check
        sessionStorage.setItem('token_expiry_hash', btoa(expiry.toString()).slice(0, 8));
      } else {
        authLogger.warn('Invalid expiry timestamp provided', { expiry, now }, 'TOKEN');
      }
    }
  },

  getLastKnownExpiry: (): number | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = sessionStorage.getItem('last_known_token_expiry');
      const hash = sessionStorage.getItem('token_expiry_hash');
      
      if (!stored || !hash) return null;
      
      const parsed = parseInt(stored, 10);
      // Validate integrity check
      const expectedHash = btoa(stored).slice(0, 8);
      if (hash !== expectedHash) {
        authLogger.warn('Token expiry integrity check failed, clearing', { stored, hash, expectedHash }, 'TOKEN');
        sessionStorage.removeItem('last_known_token_expiry');
        sessionStorage.removeItem('token_expiry_hash');
        return null;
      }
      
      // Validate that it's a reasonable timestamp (not in the past, not too far in future)
      const now = Date.now();
      const maxFuture = now + (365 * 24 * 60 * 60 * 1000); // 1 year from now
      
      if (isNaN(parsed) || parsed < now || parsed > maxFuture) {
        authLogger.warn('Invalid token expiry stored, clearing', { stored, parsed }, 'TOKEN');
        sessionStorage.removeItem('last_known_token_expiry');
        sessionStorage.removeItem('token_expiry_hash');
        return null;
      }
      
      return parsed;
    } catch (error) {
      authLogger.error('Error retrieving token expiry', { error: (error as Error).message });
      // Clear potentially corrupted data
      sessionStorage.removeItem('last_known_token_expiry');
      sessionStorage.removeItem('token_expiry_hash');
      return null;
    }
  },

  // Global refresh expiry handler
  handleRefreshExpiry: () => {
    authLogger.warn('Refresh token expired, logging out user', {}, 'TOKEN');
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

  // Offline queue management
  addToOfflineQueue: (action: 'login' | 'register' | 'refresh' | 'logout', data: any) => {
    const { offlineQueue } = get();
    
    const queueItem: OfflineQueueItem = {
      id: `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: RETRY_CONFIG.maxRetries,
      nextRetryAt: Date.now() + RETRY_CONFIG.baseDelay,
    };
    
    set({ offlineQueue: [...offlineQueue, queueItem] });
    
    authLogger.info('Added to offline queue', { 
      action, 
      queueSize: offlineQueue.length + 1 
    }, 'OFFLINE');
  },

  processOfflineQueue: async () => {
    const { offlineQueue, isOnline } = get();
    
    if (!isOnline || offlineQueue.length === 0) {
      return;
    }
    
    authLogger.info('Processing offline queue', { 
      queueSize: offlineQueue.length 
    }, 'OFFLINE');
    
    const now = Date.now();
    const updatedQueue: OfflineQueueItem[] = [];
    
    for (const item of offlineQueue) {
      // Check TTL
      if (now - item.timestamp > RETRY_CONFIG.ttl) {
        authLogger.warn('Offline queue item expired', { 
          action: item.action, 
          age: (now - item.timestamp) / 1000 
        }, 'OFFLINE');
        continue;
      }
      
      // Check if it's time to retry
      if (now < item.nextRetryAt) {
        updatedQueue.push(item);
        continue;
      }
      
      try {
        // Execute the action with retry logic
        let success = false;
        let lastError: any = null;
        
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            switch (item.action) {
              case 'login':
                await authAPI.login(item.data);
                break;
              case 'register':
                await authAPI.register(item.data);
                break;
              case 'refresh':
                await authAPI.refreshToken();
                break;
              case 'logout':
                await authAPI.logout();
                break;
            }
            success = true;
            break;
          } catch (error: any) {
            lastError = error;
            authLogger.warn(`Offline queue item attempt ${attempt + 1} failed`, { 
              action: item.action, 
              error: error.message 
            }, 'OFFLINE');
            
            // Wait before retry (exponential backoff)
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
          }
        }
        
        if (!success) {
          throw lastError;
        }
        
        authLogger.info('Offline queue item processed successfully', { 
          action: item.action 
        }, 'OFFLINE');
        
        // Track successful processing
        errorTracker.trackAuthEvent('offline_queue_success', { 
          action: item.action 
        });
        
      } catch (error: any) {
        const newRetryCount = item.retryCount + 1;
        
        if (newRetryCount >= item.maxRetries) {
          authLogger.error('Offline queue item failed permanently', { 
            action: item.action, 
            retryCount: newRetryCount 
          }, 'OFFLINE');
          
          // Track permanent failure
          errorTracker.trackError(error, { 
            action: `offline_${item.action}`, 
            retryCount: newRetryCount 
          });
        } else {
          // Calculate next retry time with exponential backoff
          const delay = Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, newRetryCount),
            RETRY_CONFIG.maxDelay
          );
          const jitter = delay * RETRY_CONFIG.jitter * (Math.random() * 2 - 1);
          const nextRetryAt = now + delay + jitter;
          
          updatedQueue.push({
            ...item,
            retryCount: newRetryCount,
            nextRetryAt
          });
          
          authLogger.warn('Offline queue item failed, will retry', { 
            action: item.action, 
            retryCount: newRetryCount,
            nextRetryAt: new Date(nextRetryAt).toISOString()
          }, 'OFFLINE');
        }
      }
    }
    
    set({ offlineQueue: updatedQueue });
  },

  clearOfflineQueue: () => {
    set({ offlineQueue: [] });
    authLogger.info('Offline queue cleared', {}, 'OFFLINE');
  },

  // Cleanup
  reset: () => {
    // Stop background refresh
    get().stopBackgroundRefresh();
    
    // Clear cross-tab sync
    get().cleanupCrossTabSync();
    
    // Clear offline queue
    get().clearOfflineQueue();
    
    // Clear all state
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      tokenExpiry: null,
      refreshExpiry: null,
      refreshInterval: null,
      backgroundRefreshEnabled: true,
      refreshRetryCount: 0,
      lastRefreshAttempt: 0,
      offlineQueue: [],
      isOnline: navigator.onLine,
      crossTabChannel: null,
    });
    
    // Clear cached user
    clearUserFromStorage();
    
    authLogger.info('Auth state reset', {}, 'AUTH');
  },

  cleanup: () => {
    // Cleanup token manager
    tokenManager.cleanup();
    
    // Cleanup cross-tab sync
    const { crossTabChannel } = get();
    if (crossTabChannel) {
      crossTabChannel.close();
    }
    
    // Clear all intervals and timeouts
    const { refreshInterval } = get();
    if (refreshInterval) {
      clearTimeout(refreshInterval);
    }
    
    authLogger.info('Auth cleanup completed', {}, 'AUTH');
  },
  };
});

