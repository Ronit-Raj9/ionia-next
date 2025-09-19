// ==========================================
// 🍪 SIMPLIFIED JWT-ONLY AUTH API
// ==========================================

import { User, LoginResponse, RefreshResponse, ApiResponse, RegisterData } from '../types';
import { authLogger } from '../utils/logger';

// Get the API base URL
const getApiBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return cleanBaseUrl.endsWith('/v1') ? cleanBaseUrl : `${cleanBaseUrl}/v1`;
};

const API_BASE = getApiBaseUrl();

// 🔥 CSRF TOKEN HANDLING
const getCSRFToken = (): string | null => {
  // Get CSRF token from cookie (set by backend)
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='));
  return csrfCookie ? csrfCookie.split('=')[1] : null;
};

// Add CSRF token refresh function
const refreshCSRFToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE}/users/refresh-csrf`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.csrfToken || getCSRFToken();
    }
  } catch (error: any) {
    authLogger.warn('Failed to refresh CSRF token', { error: error.message }, 'CSRF');
  }
  return null;
};

// Enhanced fetch wrapper with automatic token refresh and CSRF protection
let refreshState = {
  isRefreshing: false,
  refreshPromise: null as Promise<void> | null,
  refreshQueue: [] as Array<{ resolve: (value: any) => void; reject: (error: any) => void }>,
  refreshAttempts: 0,
  lastRefreshAttempt: 0
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  jitter: 0.1, // 10% random jitter
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED', 'FETCH_ERROR', 'ABORT_ERROR'],
  // Non-retryable statuses (don't retry these)
  nonRetryableStatuses: [400, 401, 403, 404, 422],
  // Non-retryable methods (don't retry these)
  nonRetryableMethods: ['POST', 'PUT', 'PATCH', 'DELETE']
};

// Circuit breaker for token refresh to prevent infinite loops
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  failureCount: 0,
  lastFailureTime: 0
};

// Helper function to determine if a request should be retried
const shouldRetryRequest = (method: string, status: number, error: any): boolean => {
  // Don't retry non-retryable methods
  if (RETRY_CONFIG.nonRetryableMethods.includes(method)) {
    return false;
  }
  
  // Don't retry non-retryable statuses
  if (RETRY_CONFIG.nonRetryableStatuses.includes(status)) {
    return false;
  }
  
  // Don't retry authentication errors (401, 403)
  if (status === 401 || status === 403) {
    return false;
  }
  
  // Don't retry client errors (4xx except 408, 429)
  if (status >= 400 && status < 500 && !RETRY_CONFIG.retryableStatuses.includes(status)) {
    return false;
  }
  
  return true;
};

const apiFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const makeRequest = async (retryCount: number = 0): Promise<Response> => {
    try {
      // Prepare headers - don't set Content-Type for FormData
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      // 🔥 ADD CSRF TOKEN TO HEADERS
      let csrfToken = getCSRFToken();
      
      // If CSRF token is missing and this is a state-changing request, try to refresh
      if (!csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options?.method || 'GET')) {
        authLogger.warn('CSRF token missing for state-changing request, attempting refresh', { 
          method: options?.method || 'GET',
          url 
        }, 'CSRF');
        csrfToken = await refreshCSRFToken();
      }
      
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      } else {
        // Log warning if CSRF token is still missing after refresh attempt
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options?.method || 'GET')) {
          authLogger.warn('CSRF token still missing after refresh attempt', { 
            method: options?.method || 'GET',
            url 
          }, 'CSRF');
        }
      }
      
      // Only set Content-Type for non-FormData requests
      if (!(options?.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(url, {
        credentials: 'include', // Always include cookies
        headers,
        ...options,
      });

      // Check if response status is retryable
      if (shouldRetryRequest(options?.method || 'GET', response.status, null) && retryCount < RETRY_CONFIG.maxRetries) {
        // Calculate exponential backoff with jitter
        const baseDelay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
        const jitter = baseDelay * RETRY_CONFIG.jitter * (Math.random() * 2 - 1); // ±10% jitter
        const delay = Math.min(baseDelay + jitter, RETRY_CONFIG.maxDelay);
        
        authLogger.info(`Retrying request (${retryCount + 1}/${RETRY_CONFIG.maxRetries}) after ${Math.round(delay)}ms due to status ${response.status}`, {}, 'API');
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeRequest(retryCount + 1);
      }

      return response;
    } catch (error: any) {
      // Check if this is a retryable network error
      const isRetryableError = RETRY_CONFIG.retryableErrors.some(errType => 
        error.message?.toUpperCase().includes(errType)
      );
      
      if (isRetryableError && retryCount < RETRY_CONFIG.maxRetries) {
        // Calculate exponential backoff with jitter
        const baseDelay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
        const jitter = baseDelay * RETRY_CONFIG.jitter * (Math.random() * 2 - 1); // ±10% jitter
        const delay = Math.min(baseDelay + jitter, RETRY_CONFIG.maxDelay);
        
        authLogger.info(`Retrying request (${retryCount + 1}/${RETRY_CONFIG.maxRetries}) after ${Math.round(delay)}ms due to network error: ${error.message}`, {}, 'API');
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeRequest(retryCount + 1);
      }
      
      throw error;
    }
  };

  try {
    const response = await makeRequest();

    // If we get a 401 and this isn't already a refresh request, try to refresh the token
    if (response.status === 401 && !url.includes('/refresh-token')) {
      authLogger.info('Received 401, attempting token refresh', {}, 'TOKEN');
      
      // Check circuit breaker state
      const now = Date.now();
      if (CIRCUIT_BREAKER_CONFIG.state === 'OPEN') {
        if (now - CIRCUIT_BREAKER_CONFIG.lastFailureTime > CIRCUIT_BREAKER_CONFIG.resetTimeout) {
          CIRCUIT_BREAKER_CONFIG.state = 'HALF_OPEN';
          authLogger.info('Circuit breaker reset to HALF_OPEN', {}, 'CIRCUIT_BREAKER');
        } else {
          authLogger.warn('Circuit breaker is OPEN, skipping token refresh', {}, 'CIRCUIT_BREAKER');
          const errorData = await response.json().catch(() => ({}));
          const error = new Error('Authentication service temporarily unavailable');
          (error as any).status = 401;
          (error as any).response = errorData;
          (error as any).isCircuitBreakerOpen = true;
          throw error;
        }
      }
      
      // If we're already refreshing, queue this request
      if (refreshState.isRefreshing && refreshState.refreshPromise) {
        return new Promise((resolve, reject) => {
          refreshState.refreshQueue.push({ resolve, reject });
        }).then(async () => {
          // Retry the original request after refresh
          const retryResponse = await makeRequest();
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            const error = new Error(errorData.message || `Request failed with status ${retryResponse.status}`);
            (error as any).status = retryResponse.status;
            (error as any).response = errorData;
            throw error;
          }
          return retryResponse.json();
        });
      }

      // Start the refresh process using the standardized authAPI method
      refreshState.isRefreshing = true;
      refreshState.refreshAttempts++;
      refreshState.lastRefreshAttempt = Date.now();
      refreshState.refreshPromise = authAPI.refreshToken().then(() => {
        authLogger.info('Token refreshed successfully', {}, 'TOKEN');
        refreshState.refreshAttempts = 0; // Reset attempts on success
      });

      try {
        await refreshState.refreshPromise;
        
        // Reset circuit breaker on success
        if (CIRCUIT_BREAKER_CONFIG.state === 'HALF_OPEN') {
          CIRCUIT_BREAKER_CONFIG.state = 'CLOSED';
          CIRCUIT_BREAKER_CONFIG.failureCount = 0;
          authLogger.info('Circuit breaker reset to CLOSED after successful refresh', {}, 'CIRCUIT_BREAKER');
        }
        
        // Token refreshed successfully, resolve all queued requests
        refreshState.refreshQueue.forEach(({ resolve }) => resolve(undefined));
        refreshState.refreshQueue = [];
        
        // Retry the original request
        const retryResponse = await makeRequest();
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          const error = new Error(errorData.message || `Request failed with status ${retryResponse.status}`);
          (error as any).status = retryResponse.status;
          (error as any).response = errorData;
          throw error;
        }
        return retryResponse.json();
      } catch (refreshError: any) {
        authLogger.error('Token refresh failed, user needs to login again', { error: refreshError.message }, 'TOKEN');
        
        // Update circuit breaker
        CIRCUIT_BREAKER_CONFIG.failureCount++;
        CIRCUIT_BREAKER_CONFIG.lastFailureTime = Date.now();
        
        if (CIRCUIT_BREAKER_CONFIG.failureCount >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
          CIRCUIT_BREAKER_CONFIG.state = 'OPEN';
          authLogger.warn('Circuit breaker opened due to repeated failures', { 
            failureCount: CIRCUIT_BREAKER_CONFIG.failureCount 
          }, 'CIRCUIT_BREAKER');
        }
        
        // Reject all queued requests
        refreshState.refreshQueue.forEach(({ reject }) => reject(refreshError));
        refreshState.refreshQueue = [];
        
        // If refresh fails, throw the original 401 error to trigger logout
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Authentication failed');
        (error as any).status = 401;
        (error as any).response = errorData;
        (error as any).isRefreshFailed = true;
        throw error;
      } finally {
        // 🔥 CLEAN UP REFRESH STATE TO PREVENT MEMORY LEAKS
        refreshState.isRefreshing = false;
        refreshState.refreshPromise = null;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Request failed with status ${response.status}`);
      (error as any).status = response.status;
      (error as any).response = errorData;
      throw error;
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors (connection refused, timeout, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Unable to connect to the server. Please check your internet connection and try again.');
      (networkError as any).status = 0;
      (networkError as any).isNetworkError = true;
      throw networkError;
    }
    
    // Handle other fetch errors
    if (!error.status && !error.response) {
      const networkError = new Error('Network error occurred. Please check your connection and try again.');
      (networkError as any).status = 0;
      (networkError as any).isNetworkError = true;
      throw networkError;
    }
    
    throw error;
  }
};

/**
 * Simplified authentication API endpoints
 */
export const authAPI = {
  // ==========================================
  // 🔐 AUTHENTICATION ENDPOINTS
  // ==========================================

  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    const response = await apiFetch<ApiResponse<LoginResponse>>(`${API_BASE}/users/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // 🔥 CSRF TOKEN IS AUTOMATICALLY SET BY BACKEND IN COOKIE
    // The getCSRFToken() function will automatically pick it up for future requests

    if (!response.data) {
      throw new Error(response.message || 'Login failed');
    }

    return response.data;
  },

  register: async (userData: RegisterData): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (!response.data) {
      throw new Error(response.message || 'Registration failed');
    }
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch(`${API_BASE}/users/logout`, { method: 'POST' });
    } catch (error: any) {
      authLogger.warn('Logout API call failed', { error: error.message }, 'API');
      // Don't throw - allow local logout to proceed
    }
  },

  refreshToken: async (): Promise<{ tokenExpiry?: { access_expires_at: number; refresh_expires_at: number } }> => {
    try {
      authLogger.info('Refreshing access token', {}, 'TOKEN');
      const response = await apiFetch<ApiResponse<RefreshResponse>>(`${API_BASE}/users/refresh-token`, { method: 'POST' });
      authLogger.info('Token refreshed successfully', {}, 'TOKEN');
      
      // Return token expiry information for proactive refresh scheduling
      return {
        tokenExpiry: response.data?.tokenExpiry
      };
    } catch (error: any) {
      authLogger.error('Token refresh failed', { error: error.message }, 'TOKEN');
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      authLogger.info('Calling getCurrentUser API', {}, 'API');
      const response = await apiFetch<ApiResponse<User>>(`${API_BASE}/users/current-user`);
      authLogger.info('getCurrentUser response received', { success: response.success, hasData: !!response.data }, 'API');
      
      if (!response.data) {
        throw new Error(response.message || 'Failed to fetch user');
      }
      return response.data;
    } catch (error: any) {
      authLogger.error('getCurrentUser error', { status: error.status, message: error.message }, 'API');
      throw error;
    }
  },

  // ==========================================
  // 🔑 PASSWORD MANAGEMENT
  // ==========================================

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to send reset email');
    }
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, password: newPassword }),
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to reset password');
    }
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/change-password`, {
      method: 'POST',
      body: JSON.stringify({ 
        oldPassword: currentPassword, 
        newPassword,
        confirmPassword: newPassword 
      }),
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to change password');
    }
    return response.data;
  },


  // ==========================================
  // 📧 EMAIL VERIFICATION ENDPOINTS
  // ==========================================

  sendEmailVerification: async (): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/verify-email/send`, {
      method: 'POST',
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to send verification email');
    }
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/verify-email`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to verify email');
    }
    return response.data;
  },

  // ==========================================
  // 👤 PROFILE MANAGEMENT
  // ==========================================

  updateProfile: async (updates: {
    fullName?: string;
    email?: string;
  }): Promise<User> => {
    const response = await apiFetch<ApiResponse<User>>(`${API_BASE}/users/update-account`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to update profile');
    }
    return response.data;
  },

  updateAvatar: async (avatarFile: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const response = await apiFetch<ApiResponse<User>>(`${API_BASE}/users/avatar`, {
      method: 'PATCH',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to update avatar');
    }
    return response.data;
  },

  // ==========================================
  // 🛡️ SESSION MANAGEMENT
  // ==========================================

  logoutFromAllDevices: async (): Promise<void> => {
    await apiFetch(`${API_BASE}/users/logout-all`, { method: 'POST' });
  },

  // ==========================================
  // 🔍 USERNAME VALIDATION
  // ==========================================

  checkUsername: async (username: string): Promise<{ available: boolean; message: string }> => {
    const response = await apiFetch<ApiResponse<{ available: boolean }>>(`${API_BASE}/users/check-username`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    return {
      available: response.data?.available || false,
      message: response.message || (response.data?.available ? 'Username is available' : 'Username is taken')
    };
  },

  // ==========================================
  // 📊 USER STATISTICS
  // ==========================================

  getUserStatistics: async (): Promise<{
    totalTests: number;
    averageScore: number;
    testsThisWeek: number;
    accuracy: number;
  }> => {
    const response = await apiFetch<ApiResponse<{
      totalTests: number;
      averageScore: number;
      testsThisWeek: number;
      accuracy: number;
    }>>(`${API_BASE}/users/statistics`);
    
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch user statistics');
    }
    return response.data;
  },

  // ==========================================
  // 👥 ADMIN ENDPOINTS
  // ==========================================

  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);

    const url = `${API_BASE}/users/admin?${searchParams.toString()}`;
    const response = await apiFetch<ApiResponse<{
      users: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>>(url);
    
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch users');
    }
    return response.data;
  },

  getUserDetails: async (userId: string): Promise<User> => {
    const response = await apiFetch<ApiResponse<User>>(`${API_BASE}/users/admin/${userId}`);
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch user details');
    }
    return response.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/admin/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to update user role');
    }
    return response.data;
  },

  getUsersAnalytics: async (): Promise<{
    totalUsers: number;
    usersByRole: { user: number; admin: number; superadmin: number };
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    recentSignups: Array<{
      fullName: string;
      username: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
  }> => {
    const response = await apiFetch<ApiResponse<{
      totalUsers: number;
      usersByRole: { user: number; admin: number; superadmin: number };
      newUsersThisWeek: number;
      newUsersThisMonth: number;
      recentSignups: Array<{
        fullName: string;
        username: string;
        email: string;
        role: string;
        createdAt: string;
      }>;
    }>>(`${API_BASE}/users/admin/analytics`);
    
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch user analytics');
    }
    return response.data;
  },

  // ==========================================
  // 🛡️ ADMIN SECURITY FEATURES
  // ==========================================

  unlockAccount: async (userId: string): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/admin/${userId}/unlock`, {
      method: 'POST',
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to unlock account');
    }
    return response.data;
  },

  getUserActivityLogs: async (userId: string, limit = 50): Promise<{
    logs: Array<{
      id: string;
      action: string;
      timestamp: string;
      ip: string;
      userAgent: string;
      success: boolean;
      details?: any;
    }>;
  }> => {
    const response = await apiFetch<ApiResponse<{
      logs: Array<{
        id: string;
        action: string;
        timestamp: string;
        ip: string;
        userAgent: string;
        success: boolean;
        details?: any;
      }>;
    }>>(`${API_BASE}/users/admin/${userId}/activity?limit=${limit}`);
    
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch user activity logs');
    }
    return response.data;
  },
};

// Export for backward compatibility
export const fetchWithAuth = apiFetch;