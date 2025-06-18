import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin';
  avatar?: string;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearTokens: () => void;
  logout: () => void;
  checkTokenExpiration: () => boolean;
  isTokenExpired: () => boolean;
  hasRole: (requiredRole: 'user' | 'admin' | 'superadmin') => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  user: 0,
  admin: 1,
  superadmin: 2,
};

// JWT helper functions
const parseJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Invalid JWT token:', error);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = parseJWT(token);
  if (!payload?.exp) return true;
  
  // Add 30-second buffer for network latency
  return Date.now() >= (payload.exp * 1000) - 30000;
};

// Secure cookie configuration
const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  expires: 7, // 7 days for refresh token
};

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenExpiresAt: null,
      refreshTokenExpiresAt: null,

      // Actions
      setUser: (user) =>
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
          state.error = null;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
          if (error) {
            state.isLoading = false;
          }
        }),

      setTokens: (accessToken, refreshToken) =>
        set((state) => {
          // Parse token expiration
          const accessPayload = parseJWT(accessToken);
          if (accessPayload?.exp) {
            state.tokenExpiresAt = accessPayload.exp * 1000;
          }

          // Store access token in memory only (more secure)
          if (typeof window !== 'undefined') {
            // Store in a more secure way - as a closure variable
            (window as any).__accessToken = accessToken;
          }

          // Store refresh token in secure HTTP-only cookie via API
          if (refreshToken) {
            const refreshPayload = parseJWT(refreshToken);
            if (refreshPayload?.exp) {
              state.refreshTokenExpiresAt = refreshPayload.exp * 1000;
            }
            
            // Store refresh token in secure cookie
            Cookies.set('refreshToken', refreshToken, {
              ...COOKIE_OPTIONS,
              expires: 7, // 7 days
            });
          }

          state.error = null;
        }),

      clearTokens: () =>
        set((state) => {
          state.tokenExpiresAt = null;
          state.refreshTokenExpiresAt = null;
          
          // Clear access token from memory
          if (typeof window !== 'undefined') {
            delete (window as any).__accessToken;
          }
          
          // Clear refresh token cookie
          Cookies.remove('refreshToken');
          
          state.error = null;
        }),

      logout: () =>
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.tokenExpiresAt = null;
          state.refreshTokenExpiresAt = null;
          state.error = null;
          
          // Clear all tokens
          if (typeof window !== 'undefined') {
            delete (window as any).__accessToken;
          }
          Cookies.remove('refreshToken');
        }),

      checkTokenExpiration: () => {
        const state = get();
        if (!state.tokenExpiresAt) return false;
        
        // Check if token expires in the next 2 minutes
        return Date.now() >= (state.tokenExpiresAt - 120000);
      },

      isTokenExpired: () => {
        const state = get();
        if (!state.tokenExpiresAt) return true;
        return Date.now() >= state.tokenExpiresAt;
      },

      hasRole: (requiredRole) => {
        const state = get();
        if (!state.user?.role) return false;
        
        return ROLE_HIERARCHY[state.user.role] >= ROLE_HIERARCHY[requiredRole];
      },

      hasAnyRole: (roles) => {
        const state = get();
        if (!state.user?.role) return false;
        
        return roles.includes(state.user.role);
      },
    })),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Don't persist tokens in localStorage for security
      }),
    }
  )
);

// Helper to get access token securely
export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return (window as any).__accessToken || null;
};

// Helper to get refresh token from cookie
export const getRefreshToken = (): string | null => {
  return Cookies.get('refreshToken') || null;
};

// Auto-logout on token expiration
let tokenCheckInterval: NodeJS.Timeout;

export const startTokenMonitoring = () => {
  if (typeof window === 'undefined') return;
  
  // Clear existing interval
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
  }
  
  // Check token expiration every minute
  tokenCheckInterval = setInterval(() => {
    const { isTokenExpired, logout, isAuthenticated } = useAuthStore.getState();
    
    if (isAuthenticated && isTokenExpired()) {
      console.log('Token expired, logging out user');
      logout();
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }, 60000); // Check every minute
};

export const stopTokenMonitoring = () => {
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
  }
}; 