// ==========================================
// 🍪 SIMPLIFIED COOKIE-BASED AUTH API
// ==========================================

import { User, LoginResponse, ApiResponse, RegisterData } from '../types';

// Get the API base URL
const getApiBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return cleanBaseUrl.endsWith('/v1') ? cleanBaseUrl : `${cleanBaseUrl}/v1`;
};

const API_BASE = getApiBaseUrl();

// Enhanced fetch wrapper with automatic token refresh
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

const apiFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const makeRequest = async (): Promise<Response> => {
    // Prepare headers - don't set Content-Type for FormData
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    
    // Only set Content-Type for non-FormData requests
    if (!(options?.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    return fetch(url, {
      credentials: 'include', // Always include cookies
      headers,
      ...options,
    });
  };

  try {
    const response = await makeRequest();

    // If we get a 401 and this isn't already a refresh request, try to refresh the token
    if (response.status === 401 && !url.includes('/refresh-token')) {
      console.log('🔄 Received 401, attempting token refresh...');
      
      // If we're already refreshing, wait for that to complete
      if (isRefreshing && refreshPromise) {
        await refreshPromise;
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
      }

      // Start the refresh process
      isRefreshing = true;
      refreshPromise = fetch(`${API_BASE}/users/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }).then(async (refreshResponse) => {
        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text().catch(() => 'Unknown error');
          console.log('❌ Token refresh failed:', refreshResponse.status, errorText);
          throw new Error(`Token refresh failed: ${refreshResponse.status} ${errorText}`);
        }
        console.log('✅ Token refreshed successfully');
      });

      try {
        await refreshPromise;
        // Token refreshed successfully, retry the original request
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
        console.log('❌ Token refresh failed, user needs to login again:', refreshError.message);
        // If refresh fails, throw the original 401 error to trigger logout
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Authentication failed');
        (error as any).status = 401;
        (error as any).response = errorData;
        (error as any).isRefreshFailed = true;
        throw error;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
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
    rememberMe?: boolean;
  }): Promise<LoginResponse> => {
    const response = await apiFetch<ApiResponse<LoginResponse>>(`${API_BASE}/users/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

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
    } catch (error) {
      console.warn('Logout API call failed:', error);
      // Don't throw - allow local logout to proceed
    }
  },

  refreshToken: async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing access token...');
      await apiFetch(`${API_BASE}/users/refresh-token`, { method: 'POST' });
      console.log('✅ Token refreshed successfully');
    } catch (error: any) {
      console.log('❌ Token refresh failed:', error.message);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      console.log('📡 Calling getCurrentUser API...');
      const response = await apiFetch<ApiResponse<User>>(`${API_BASE}/users/current-user`);
      console.log('📡 getCurrentUser response:', { success: response.success, hasData: !!response.data });
      
      if (!response.data) {
        throw new Error(response.message || 'Failed to fetch user');
      }
      return response.data;
    } catch (error: any) {
      console.log('📡 getCurrentUser error:', { status: error.status, message: error.message });
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
  // 🔥 GOOGLE OAUTH ENDPOINTS
  // ==========================================

  googleLogin: async (returnUrl?: string): Promise<void> => {
    const url = new URL(`${API_BASE}/users/auth/google`);
    if (returnUrl) {
      url.searchParams.append('returnUrl', returnUrl);
    }
    window.location.href = url.toString();
  },

  getAuthProviders: async (): Promise<{ providers: string[] }> => {
    const response = await apiFetch<ApiResponse<{ providers: string[] }>>(`${API_BASE}/users/auth/providers`);
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch auth providers');
    }
    return response.data;
  },

  linkGoogleAccount: async (googleToken: string): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/auth/google/link`, {
      method: 'POST',
      body: JSON.stringify({ googleToken }),
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to link Google account');
    }
    return response.data;
  },

  unlinkGoogleAccount: async (): Promise<{ message: string }> => {
    const response = await apiFetch<ApiResponse<{ message: string }>>(`${API_BASE}/users/auth/google/unlink`, {
      method: 'POST',
    });
    if (!response.data) {
      throw new Error(response.message || 'Failed to unlink Google account');
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