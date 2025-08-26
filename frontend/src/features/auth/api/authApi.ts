// ==========================================
// 🍪 SIMPLIFIED COOKIE-BASED AUTH API
// ==========================================

import { User, LoginResponse, ApiResponse, RegisterData } from '../types';

// Get the API base URL
const getApiBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return cleanBaseUrl.endsWith('/v1') ? cleanBaseUrl : `${cleanBaseUrl}/v1`;
};

const API_BASE = getApiBaseUrl();

// Simple fetch wrapper for cookie-based auth
const apiFetch = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `Request failed with status ${response.status}`);
    (error as any).status = response.status;
    (error as any).response = errorData;
    throw error;
  }

  return response.json();
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

  getCurrentUser: async (): Promise<User> => {
    const response = await apiFetch<ApiResponse<User>>(`${API_BASE}/users/current-user`);
    if (!response.data) {
      throw new Error(response.message || 'Failed to fetch user');
    }
    return response.data;
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
};

// Export for backward compatibility
export const fetchWithAuth = apiFetch;