// Enhanced Auth API with Zustand integration and secure token management
import { getAccessToken, getRefreshToken } from '@/features/auth/store/authStore';
import { useCacheStore, generateCacheKey } from '@/stores/cacheStore';
import { User, LoginResponse, ApiResponse } from '../types';

// Get the API base URL with proper environment detection
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
};

const API_BASE = getApiBaseUrl();

// Configure fetch options for CORS
const getDefaultFetchOptions = (): RequestInit => ({
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  mode: 'cors',
});

// Token refresh handling
let isRefreshing = false;
let refreshSubscribers: ((error?: Error) => void)[] = [];

const subscribeTokenRefresh = (cb: (error?: Error) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (error?: Error) => {
  refreshSubscribers.forEach((cb) => cb(error));
  refreshSubscribers = [];
};

export const refreshTokens = async (): Promise<string | null> => {
  if (isRefreshing) {
    // Wait for current refresh to complete
    return new Promise((resolve) => {
      subscribeTokenRefresh((error) => {
        if (error) {
          resolve(null);
        } else {
          resolve(getAccessToken());
        }
      });
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${API_BASE}/users/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.data?.accessToken) {
      onTokenRefreshed();
      return data.data.accessToken;
    }

    throw new Error('No access token in refresh response');
  } catch (error) {
    console.error('Token refresh failed:', error);
    onTokenRefreshed(error as Error);
    return null;
  } finally {
    isRefreshing = false;
  }
};

// Handle API errors with proper error types
const handleApiError = async (response: Response, url: string) => {
  let errorMessage: string;
  let errorData: any = null;

  try {
    errorData = await response.json();
    errorMessage =
      errorData.message ||
      errorData.error ||
      `Request failed with status ${response.status}`;
  } catch (jsonError) {
    errorMessage = `Request failed with status ${response.status}`;
  }

  const error = new Error(errorMessage);
  (error as any).status = response.status;
  (error as any).response = errorData;
  (error as any).url = url;

  throw error;
};

/**
 * Enhanced fetch with automatic token refresh, caching, and error handling for auth endpoints
 */
export const fetchWithAuth = async <T>(
  url: string,
  options?: RequestInit,
  useCache = true,
  cacheKey?: string
): Promise<T> => {
  const { get: getCache, set: setCache } = useCacheStore.getState();

  // Generate cache key
  const finalCacheKey = cacheKey || generateCacheKey(url, options);

  // Check cache first for GET requests
  if (useCache && (!options?.method || options.method === 'GET')) {
    const cached = getCache(finalCacheKey);
    if (cached) {
      return cached as T;
    }
  }

  try {
    // Get access token
    let accessToken = getAccessToken();

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers || {}),
    };

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      ...getDefaultFetchOptions(),
      ...options,
      headers,
    };

    // Make initial request
    let response = await fetch(url, fetchOptions);

    // Handle token expiration
    if (response.status === 401 && accessToken && !url.includes('/refresh-token')) {
      console.log('Token expired, attempting refresh...');

      // Try to refresh token
      const newAccessToken = await refreshTokens();

      if (newAccessToken) {
        // Retry request with new token
        const retryOptions = {
          ...fetchOptions,
          headers: {
            ...headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        };

        response = await fetch(url, retryOptions);
      }
    }

    // Handle non-2xx responses
    if (!response.ok) {
      await handleApiError(response, url);
    }

    const data = await response.json();

    // Cache successful GET requests
    if (useCache && (!options?.method || options.method === 'GET')) {
      setCache(finalCacheKey, data);
    }

    return data as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Authentication API endpoints
 */
export const authAPI = {
  login: async (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<LoginResponse> => {
    const response = await fetchWithAuth<ApiResponse<LoginResponse>>(
      `${API_BASE}/users/login`,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      false // Don't cache login requests
    );
    if (!response.data) {
      throw new Error(response.message || 'Login failed');
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await fetchWithAuth(
        `${API_BASE}/users/logout`,
        {
          method: 'POST',
        },
        false
      );
    } catch (error) {
      console.warn('Logout endpoint failed, proceeding with local logout:', error);
    }
  },

  register: async (userData: {
    username: string;
    email: string;
    fullName: string;
    password: string;
  }): Promise<{ message: string }> => {
    const response = await fetchWithAuth<ApiResponse<{ message: string }>>(
      `${API_BASE}/users/register`,
      {
        method: 'POST',
        body: JSON.stringify(userData),
      },
      false
    );
    if (!response.data) {
      throw new Error(response.message || 'Registration failed');
    }
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await fetchWithAuth<ApiResponse<User>>(`${API_BASE}/users/profile`);
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch user');
    }
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await fetchWithAuth<ApiResponse<{ message: string }>>(
      `${API_BASE}/users/forgot-password`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
      false
    );
    if (!response.data) {
      throw new Error(response.message || 'Failed to send reset email');
    }
    return response.data;
  },

  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<{ message: string }> => {
    const response = await fetchWithAuth<ApiResponse<{ message: string }>>(
      `${API_BASE}/users/reset-password`,
      {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      },
      false
    );
    if (!response.data) {
      throw new Error(response.message || 'Failed to reset password');
    }
    return response.data;
  },

  refreshToken: async (): Promise<{
    accessToken: string;
    refreshToken?: string;
    user?: any;
  }> => {
    const response = await fetch(`${API_BASE}/users/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.data) {
      throw new Error('Invalid refresh response');
    }
    return data.data;
  },
};

// Legacy compatibility exports
export const loginUser = authAPI.login;
export const registerUser = authAPI.register;
export const getUserProfile = () => authAPI.getCurrentUser();

// Clear all cached auth data
export const clearAllCachedData = () => {
  const { clear } = useCacheStore.getState();
  clear();
  console.log('All cached data cleared. Please dispatch logout action to clear auth state.');
};
