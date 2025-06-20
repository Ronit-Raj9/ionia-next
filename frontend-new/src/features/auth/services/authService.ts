// ==========================================
// 🌐 AUTH SERVICE LAYER - BACKEND COMMUNICATION
// ==========================================

import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResult, 
  LogoutReason, 
  User,
  AuthError,
  ApiResponse,
  LoginResponse,
  RefreshResponse,
  RegisterResponse
} from '../types';

// ==========================================
// 🔧 CONFIGURATION
// ==========================================

const DEFAULT_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// ==========================================
// 🛠️ UTILITY FUNCTIONS
// ==========================================

/**
 * Enhanced fetch wrapper with retry logic and better error handling
 */
const enhancedFetch = async (
  url: string,
  options: RequestInit = {},
  config = DEFAULT_CONFIG
): Promise<Response> => {
  const { timeout, retryAttempts, retryDelay } = config;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchWithRetry = async (attempt: number): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Don't retry on abort or if we've exhausted attempts
      if (error.name === 'AbortError' || attempt >= retryAttempts) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      
      // Retry with incremental backoff
      return fetchWithRetry(attempt + 1);
    }
  };

  return fetchWithRetry(1);
};

/**
 * Process API response and handle errors consistently
 */
const processResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  let data: any;
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }
  } catch (error) {
    data = { message: 'Invalid response format' };
  }

  if (!response.ok) {
    return {
      success: false,
      error: data.message || data.error || `HTTP ${response.status}`,
      code: data.code || response.status,
      message: data.message || `Request failed with status ${response.status}`,
    };
  }

  return {
    success: true,
    data: data.data || data,
    message: data.message,
  };
};

/**
 * Create standardized auth error
 */
const createAuthError = (
  type: AuthError['type'],
  message: string,
  code?: string | number,
  context?: Record<string, any>
): AuthError => ({
  type,
  message,
  code,
  timestamp: Date.now(),
  context,
});

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get device information for session tracking
 */
const getDeviceInfo = () => {
  if (typeof window === 'undefined') return {};
  
  const navigator = window.navigator;
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: Date.now(),
  };
};

// ==========================================
// 🚀 MAIN AUTH SERVICE CLASS
// ==========================================

class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = DEFAULT_CONFIG.baseURL;
  }

  // ==========================================
  // 🔑 AUTHENTICATION METHODS
  // ==========================================

  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        throw createAuthError('validation', 'Email and password are required');
      }

      if (!isValidEmail(credentials.email)) {
        throw createAuthError('validation', 'Please enter a valid email address');
      }

      // Prepare request payload
      const payload = {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        rememberMe: credentials.rememberMe || false,
        deviceInfo: {
          ...getDeviceInfo(),
          ...credentials.deviceInfo,
        },
      };

      // Make API call to your Node.js backend
      const response = await enhancedFetch(
        `${this.baseURL}/auth/login`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      const result = await processResponse<LoginResponse>(response);
      
      if (!result.success) {
        throw createAuthError(
          'auth',
          result.error || 'Login failed',
          result.code,
          { email: credentials.email }
        );
      }

      return {
        success: true,
        user: result.data!.user,
      };
    } catch (error: any) {
      if (error.type) {
        // Already an AuthError
        return { success: false, error };
      }

      // Network or other error
      return {
        success: false,
        error: createAuthError(
          'network',
          'Unable to connect to server. Please check your internet connection.',
          'NETWORK_ERROR'
        ),
      };
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      // Validate input
      if (!userData.email || !userData.username || !userData.fullName || !userData.password) {
        throw createAuthError('validation', 'All fields are required');
      }

      if (!isValidEmail(userData.email)) {
        throw createAuthError('validation', 'Please enter a valid email address');
      }

      if (userData.password !== userData.confirmPassword) {
        throw createAuthError('validation', 'Passwords do not match');
      }

      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        throw createAuthError('validation', passwordValidation.errors.join('. '));
      }

      if (!userData.acceptTerms) {
        throw createAuthError('validation', 'You must accept the terms and conditions');
      }

      // Prepare request payload
      const payload = {
        email: userData.email.toLowerCase().trim(),
        username: userData.username.toLowerCase().trim(),
        fullName: userData.fullName.trim(),
        password: userData.password,
        deviceInfo: getDeviceInfo(),
      };

      // Make API call
      const response = await enhancedFetch(
        `${this.baseURL}/auth/register`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      const result = await processResponse<RegisterResponse>(response);
      
      if (!result.success) {
        throw createAuthError(
          'validation',
          result.error || 'Registration failed',
          result.code,
          { email: userData.email, username: userData.username }
        );
      }

      return {
        success: true,
        requiresVerification: result.data!.requiresVerification,
      };
    } catch (error: any) {
      if (error.type) {
        return { success: false, error };
      }

      return {
        success: false,
        error: createAuthError(
          'network',
          'Unable to connect to server. Please check your internet connection.',
          'NETWORK_ERROR'
        ),
      };
    }
  }

  /**
   * Logout user
   */
  async logout(reason: LogoutReason = 'manual'): Promise<ApiResponse<void>> {
    try {
      const payload = {
        reason,
        deviceInfo: getDeviceInfo(),
        timestamp: Date.now(),
      };

      // Make API call (don't throw on failure since logout should always succeed locally)
      const response = await enhancedFetch(
        `${this.baseURL}/auth/logout`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      return await processResponse<void>(response);
    } catch (error) {
      // Log the error but don't fail logout
      console.warn('Logout API call failed:', error);
      return { success: true, message: 'Logged out locally' };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshResponse>> {
    try {
      if (!refreshToken) {
        throw createAuthError('auth', 'Refresh token is required');
      }

      const payload = {
        refreshToken,
        deviceInfo: getDeviceInfo(),
      };

      const response = await enhancedFetch(
        `${this.baseURL}/auth/refresh`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      const result = await processResponse<RefreshResponse>(response);
      
      if (!result.success) {
        throw createAuthError(
          'auth',
          result.error || 'Token refresh failed',
          result.code
        );
      }

      return result;
    } catch (error: any) {
      if (error.type) {
        return { success: false, error: error.message, code: error.code };
      }

      return {
        success: false,
        error: 'Unable to refresh session. Please log in again.',
        code: 'REFRESH_ERROR',
      };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await enhancedFetch(
        `${this.baseURL}/auth/me`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const result = await processResponse<User>(response);
      
      if (!result.success) {
        throw createAuthError(
          'auth',
          result.error || 'Failed to load user profile',
          result.code
        );
      }

      return result;
    } catch (error: any) {
      if (error.type) {
        return { success: false, error: error.message, code: error.code };
      }

      return {
        success: false,
        error: 'Unable to load user profile',
        code: 'PROFILE_ERROR',
      };
    }
  }

  // ==========================================
  // 🔐 PASSWORD & SECURITY METHODS
  // ==========================================

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!email || !isValidEmail(email)) {
        throw createAuthError('validation', 'Please enter a valid email address');
      }

      const payload = {
        email: email.toLowerCase().trim(),
        deviceInfo: getDeviceInfo(),
      };

      const response = await enhancedFetch(
        `${this.baseURL}/auth/forgot-password`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      return await processResponse<{ message: string }>(response);
    } catch (error: any) {
      if (error.type) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: 'Unable to process password reset request',
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!token) {
        throw createAuthError('validation', 'Reset token is required');
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw createAuthError('validation', passwordValidation.errors.join('. '));
      }

      const payload = {
        token,
        password: newPassword,
        deviceInfo: getDeviceInfo(),
      };

      const response = await enhancedFetch(
        `${this.baseURL}/auth/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      return await processResponse<{ message: string }>(response);
    } catch (error: any) {
      if (error.type) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: 'Unable to reset password',
      };
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!currentPassword || !newPassword) {
        throw createAuthError('validation', 'Current and new passwords are required');
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw createAuthError('validation', passwordValidation.errors.join('. '));
      }

      if (currentPassword === newPassword) {
        throw createAuthError('validation', 'New password must be different from current password');
      }

      const payload = {
        currentPassword,
        newPassword,
        deviceInfo: getDeviceInfo(),
      };

      const response = await enhancedFetch(
        `${this.baseURL}/auth/change-password`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      return await processResponse<{ message: string }>(response);
    } catch (error: any) {
      if (error.type) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: 'Unable to change password',
      };
    }
  }

  // ==========================================
  // 📧 EMAIL VERIFICATION METHODS
  // ==========================================

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!token) {
        throw createAuthError('validation', 'Verification token is required');
      }

      const payload = {
        token,
        deviceInfo: getDeviceInfo(),
      };

      const response = await enhancedFetch(
        `${this.baseURL}/auth/verify-email`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      return await processResponse<{ message: string }>(response);
    } catch (error: any) {
      if (error.type) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: 'Unable to verify email',
      };
    }
  }

  /**
   * Resend email verification
   */
  async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!email || !isValidEmail(email)) {
        throw createAuthError('validation', 'Please enter a valid email address');
      }

      const payload = {
        email: email.toLowerCase().trim(),
        deviceInfo: getDeviceInfo(),
      };

      const response = await enhancedFetch(
        `${this.baseURL}/auth/resend-verification`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      return await processResponse<{ message: string }>(response);
    } catch (error: any) {
      if (error.type) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: 'Unable to resend verification email',
      };
    }
  }

  // ==========================================
  // 🔧 UTILITY METHODS
  // ==========================================

  /**
   * Check if service is healthy
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: number }>> {
    try {
      const response = await enhancedFetch(
        `${this.baseURL}/health`,
        {
          method: 'GET',
        },
        { ...DEFAULT_CONFIG, timeout: 5000 } // Shorter timeout for health check
      );

      return await processResponse<{ status: string; timestamp: number }>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      };
    }
  }

  /**
   * Update service base URL
   */
  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// ==========================================
// 📤 EXPORTS
// ==========================================

// Create singleton instance
const authService = new AuthService();

// Export singleton and class for custom instances
export default authService;
export { AuthService };