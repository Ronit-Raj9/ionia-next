// ==========================================
// 🕵️ INTERCEPTOR LAYER - GLOBAL TOKEN INJECTION + HANDLING
// ==========================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/authStore';
import { validateToken, shouldRefreshToken, isRefreshTokenValid } from '../../utils/authUtils';

// ==========================================
// 🏷️ INTERCEPTOR TYPES
// ==========================================

interface RequestConfig extends AxiosRequestConfig {
  _retry?: boolean; // Prevent infinite retry loops
  _skipAuth?: boolean; // Skip auth for public endpoints
  _skipRefresh?: boolean; // Skip refresh attempt
}

interface AuthInterceptorConfig {
  baseURL: string;
  timeout: number;
  skipAuthPaths: string[];
  skipRefreshPaths: string[];
  trustedOrigins: string[];
  retryAttempts: number;
  retryDelay: number;
}

type InterceptorError = {
  type: 'network' | 'auth' | 'server' | 'timeout' | 'refresh';
  message: string;
  status?: number;
  originalError?: any;
};

// ==========================================
// 🔧 DEFAULT CONFIGURATION
// ==========================================

const DEFAULT_CONFIG: AuthInterceptorConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://3.7.73.172/api/v1',
  timeout: 30000, // 30 seconds
  skipAuthPaths: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/public',
    '/health',
  ],
  skipRefreshPaths: [
    '/auth/refresh',
    '/auth/logout',
  ],
  trustedOrigins: [
    'http://localhost:3000',
    'https://yourdomain.com',
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  ],
  retryAttempts: 3,
  retryDelay: 1000,
};

// ==========================================
// 🔒 TOKEN MANAGEMENT
// ==========================================

/**
 * Get current tokens from store
 */
const getTokens = () => {
  const state = useAuthStore.getState();
  return {
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
  };
};

/**
 * Check if path should skip authentication
 */
const shouldSkipAuth = (url: string, skipPaths: string[]): boolean => {
  if (!url) return false;
  
  const pathname = new URL(url, 'http://localhost').pathname;
  return skipPaths.some(path => {
    if (path.endsWith('*')) {
      return pathname.startsWith(path.slice(0, -1));
    }
    return pathname === path || pathname.startsWith(path + '/');
  });
};

/**
 * Extract meaningful error information
 */
const extractErrorInfo = (error: any): InterceptorError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Network errors
    if (axiosError.code === 'ECONNABORTED') {
      return {
        type: 'timeout',
        message: 'Request timeout',
        originalError: error,
      };
    }
    
    if (axiosError.code === 'ERR_NETWORK') {
      return {
        type: 'network',
        message: 'Network error - check your connection',
        originalError: error,
      };
    }
    
    // Server errors
    const status = axiosError.response?.status;
    if (status) {
      if (status === 401) {
        return {
          type: 'auth',
          message: 'Authentication failed',
          status,
          originalError: error,
        };
      }
      
      if (status >= 500) {
        return {
          type: 'server',
          message: 'Server error - please try again later',
          status,
          originalError: error,
        };
      }
      
      return {
        type: 'server',
        message: axiosError.response?.data?.message || 'Request failed',
        status,
        originalError: error,
      };
    }
  }
  
  return {
    type: 'network',
    message: error?.message || 'An unexpected error occurred',
    originalError: error,
  };
};

// ==========================================
// 🔄 REFRESH TOKEN LOGIC
// ==========================================

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (): Promise<string | null> => {
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const { refreshToken } = getTokens();
  
  if (!refreshToken || !isRefreshTokenValid(refreshToken)) {
    console.warn('No valid refresh token available');
    useAuthStore.getState().logout('refresh_token_invalid');
    return null;
  }

  isRefreshing = true;
  refreshPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('🔄 Attempting token refresh...');
      
      // Use the auth service to refresh token
      const result = await useAuthStore.getState().refreshTokens();
      
      if (result.success && result.accessToken) {
        console.log('✅ Token refresh successful');
        resolve(result.accessToken);
      } else {
        console.error('❌ Token refresh failed:', result.error);
        useAuthStore.getState().logout('refresh_failed');
        resolve(null);
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      useAuthStore.getState().logout('refresh_error');
      resolve(null);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });

  return refreshPromise;
};

// ==========================================
// 🎯 AXIOS INTERCEPTOR SETUP
// ==========================================

/**
 * Create authenticated axios instance with interceptors
 */
export const createAuthenticatedAxiosInstance = (
  config: Partial<AuthInterceptorConfig> = {}
): AxiosInstance => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const instance = axios.create({
    baseURL: finalConfig.baseURL,
    timeout: finalConfig.timeout,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // ==========================================
  // 📤 REQUEST INTERCEPTOR
  // ==========================================
  
  instance.interceptors.request.use(
    (config: RequestConfig) => {
      const url = config.url || '';
      const fullUrl = `${config.baseURL || ''}${url}`;
      
      // Skip auth for certain paths
      if (shouldSkipAuth(url, finalConfig.skipAuthPaths)) {
        config._skipAuth = true;
        return config;
      }

      // Add authentication token
      const { accessToken } = getTokens();
      if (accessToken && !config._skipAuth) {
        // Validate token before using it
        const tokenValidation = validateToken(accessToken);
        
        if (tokenValidation.isValid) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${accessToken}`;
          
          // Log token expiry information in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔑 Token expires in: ${Math.floor(tokenValidation.expiresIn / 1000)}s`);
          }
        } else {
          console.warn('⚠️ Invalid access token detected in request interceptor');
          // Don't add invalid token to request
        }
      }

      // Add request timestamp for debugging
      config.metadata = {
        ...config.metadata,
        requestTime: Date.now(),
      };

      // Add origin validation
      if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        if (!finalConfig.trustedOrigins.includes(origin)) {
          console.warn(`⚠️ Request from untrusted origin: ${origin}`);
        }
      }

      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // ==========================================
  // 📥 RESPONSE INTERCEPTOR
  // ==========================================
  
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        const requestTime = response.config.metadata?.requestTime;
        const responseTime = requestTime ? Date.now() - requestTime : 0;
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${responseTime}ms)`);
      }

      // Update last activity time
      useAuthStore.getState().updateLastActivity();

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as RequestConfig;
      const errorInfo = extractErrorInfo(error);
      
      // Handle different error types
      if (errorInfo.type === 'auth' && errorInfo.status === 401) {
        // Only attempt refresh if we haven't already tried
        if (!originalRequest._retry && !shouldSkipAuth(originalRequest.url || '', finalConfig.skipRefreshPaths)) {
          originalRequest._retry = true;
          
          console.log('🔄 401 detected, attempting token refresh...');
          
          const newAccessToken = await refreshAccessToken();
          
          if (newAccessToken) {
            // Update the original request with new token
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            
            console.log('🔄 Retrying original request with new token...');
            
            // Retry the original request
            return instance(originalRequest);
          } else {
            console.error('❌ Token refresh failed, redirecting to login');
            // Token refresh failed, user will be logged out by refreshAccessToken
            return Promise.reject(error);
          }
        }
      }

      // Handle network errors with retry logic
      if (errorInfo.type === 'network' || errorInfo.type === 'timeout') {
        const retryCount = originalRequest.metadata?.retryCount || 0;
        
        if (retryCount < finalConfig.retryAttempts) {
          console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${finalConfig.retryAttempts})`);
          
          originalRequest.metadata = {
            ...originalRequest.metadata,
            retryCount: retryCount + 1,
          };
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
          
          return instance(originalRequest);
        }
      }

      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ ${originalRequest.method?.toUpperCase()} ${originalRequest.url} failed:`, {
          status: errorInfo.status,
          type: errorInfo.type,
          message: errorInfo.message,
        });
      }

      // Enhance error with our custom information
      const enhancedError = {
        ...error,
        interceptorInfo: errorInfo,
        isNetworkError: errorInfo.type === 'network',
        isAuthError: errorInfo.type === 'auth',
        isServerError: errorInfo.type === 'server',
        isTimeoutError: errorInfo.type === 'timeout',
      };

      return Promise.reject(enhancedError);
    }
  );

  return instance;
};

// ==========================================
// 🌍 GLOBAL INSTANCE
// ==========================================

// Create the main authenticated axios instance
export const authenticatedAxios = createAuthenticatedAxiosInstance();

// ==========================================
// 🛠️ UTILITY FUNCTIONS
// ==========================================

/**
 * Create a request with automatic retry logic
 */
export const createRetryableRequest = <T = any>(
  config: AxiosRequestConfig,
  options: {
    retries?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
) => {
  const { retries = 3, delay = 1000, backoff = true } = options;
  
  const executeRequest = async (attempt: number = 1): Promise<T> => {
    try {
      const response = await authenticatedAxios(config);
      return response.data;
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      
      console.log(`🔄 Request failed, retrying (${attempt}/${retries})...`);
      
      const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return executeRequest(attempt + 1);
    }
  };
  
  return executeRequest();
};

/**
 * Check if error is recoverable (should retry)
 */
export const isRecoverableError = (error: any): boolean => {
  if (!axios.isAxiosError(error)) return false;
  
  const status = error.response?.status;
  const code = error.code;
  
  // Network errors are recoverable
  if (code === 'ECONNABORTED' || code === 'ERR_NETWORK') {
    return true;
  }
  
  // Server errors (5xx) are recoverable
  if (status && status >= 500) {
    return true;
  }
  
  // Rate limiting is recoverable
  if (status === 429) {
    return true;
  }
  
  return false;
};

/**
 * Get error message for display to user
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  if (error.interceptorInfo) {
    const info = error.interceptorInfo as InterceptorError;
    
    switch (info.type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'timeout':
        return 'The request took too long. Please try again.';
      case 'auth':
        return 'Your session has expired. Please log in again.';
      case 'server':
        return info.status === 500 
          ? 'Server error. Please try again later.'
          : info.message || 'Something went wrong. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
  
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'Request failed. Please try again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Setup global error handling
 */
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (axios.isAxiosError(event.reason)) {
        console.error('Unhandled axios error:', event.reason);
        
        // You can show a global error notification here
        // Example: toast.error(getUserFriendlyErrorMessage(event.reason));
      }
    });
  }
};

/**
 * Manual token refresh trigger
 */
export const manualTokenRefresh = async (): Promise<boolean> => {
  try {
    const newToken = await refreshAccessToken();
    return !!newToken;
  } catch (error) {
    console.error('Manual token refresh failed:', error);
    return false;
  }
};

/**
 * Check if current token needs refresh
 */
export const checkTokenRefreshNeeded = (): boolean => {
  const { accessToken } = getTokens();
  if (!accessToken) return false;
  
  return shouldRefreshToken(accessToken);
};

// ==========================================
// 🔍 DEBUG UTILITIES
// ==========================================

/**
 * Log interceptor statistics (development only)
 */
export const logInterceptorStats = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('📊 Auth Interceptor Stats:', {
    isRefreshing,
    hasRefreshPromise: !!refreshPromise,
    tokens: getTokens(),
    config: DEFAULT_CONFIG,
  });
};

// ==========================================
// 📤 EXPORTS
// ==========================================

export {
  DEFAULT_CONFIG,
  type AuthInterceptorConfig,
  type InterceptorError,
  type RequestConfig,
};

// Setup global error handling on module load
if (typeof window !== 'undefined') {
  setupGlobalErrorHandling();
}