// API utility functions with caching and preloading capabilities

// Cache for storing API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Get the API base URL with proper environment detection
const getApiBaseUrl = (): string => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://3.7.73.172/api/v1';
};

const API_BASE = getApiBaseUrl();

// Helper function to determine cookie settings based on environment
const getCookieSettings = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    secure: true,
    sameSite: 'none' as const,
    path: '/',
    domain: isProduction ? '3.7.73.172' : undefined
  };
};

// Configure fetch options for CORS
const getDefaultFetchOptions = (): RequestInit => ({
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors'
});

// Preload queue for managing preloaded API calls
const preloadQueue: Array<{ url: string; options?: RequestInit }> = [];
let isProcessingQueue = false;

// Token refresh handling
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Determine if credentials should be included based on URL and environment
const shouldIncludeCredentials = (url: string): boolean => {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check if URL domain matches the current origin
  try {
    const urlObj = new URL(url);
    return urlObj.origin === window.location.origin;
  } catch {
    // For relative URLs, assume same origin
    return true;
  }
};

const refreshToken = async () => {
  try {
    if (!isRefreshing) {
      isRefreshing = true;
      
      const useCredentials = shouldIncludeCredentials(`${API_BASE}/users/refresh-token`);
      
      const response = await fetch(`${API_BASE}/users/refresh-token`, {
        method: 'POST',
        credentials: useCredentials ? 'include' : 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      if (data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('lastTokenRefresh', Date.now().toString());
        onTokenRefreshed(data.data.accessToken);
        return data.data.accessToken;
      }
      throw new Error('No access token in refresh response');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    refreshSubscribers = [];
    clearAllCachedData();
    // Don't redirect here, let the auth slice handle it
    throw error;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Process the preload queue in the background
 */
const processPreloadQueue = async () => {
  if (isProcessingQueue || preloadQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (preloadQueue.length > 0) {
    const request = preloadQueue.shift();
    if (request) {
      try {
        // Don't await this - we want it to run in the background
        fetchWithCache(request.url, request.options).catch(() => {
          // Silently fail preloads - they're just optimizations
        });
      } catch (error) {
        console.error('Error preloading data:', error);
      }
    }
  }
  
  isProcessingQueue = false;
};

/**
 * Add a request to the preload queue
 */
export const preloadData = (url: string, options?: RequestInit) => {
  // Don't preload if already cached
  const cacheKey = getCacheKey(url, options);
  if (apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return; // Still valid in cache
    }
  }
  
  // Add to preload queue
  preloadQueue.push({ url, options });
  
  // Start processing the queue if not already processing
  if (!isProcessingQueue) {
    setTimeout(processPreloadQueue, 0);
  }
};

/**
 * Generate a cache key from URL and request options
 */
const getCacheKey = (url: string, options?: RequestInit): string => {
  if (!options) return url;
  
  // Include method and body in cache key if present
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
};

// Add cache invalidation patterns
const CACHE_INVALIDATION_PATTERNS = {
  user: ['/users/current-user', '/users/profile'],
  auth: ['/users/login', '/users/register', '/users/logout'],
  admin: ['/users/admin'],
  all: ['*']
};

/**
 * Clear cache based on patterns
 */
export const invalidateCache = (pattern: keyof typeof CACHE_INVALIDATION_PATTERNS) => {
  const patterns = CACHE_INVALIDATION_PATTERNS[pattern];
  if (patterns.includes('*')) {
    apiCache.clear();
    return;
  }
  
  for (const [key] of apiCache) {
    if (patterns.some(p => key.includes(p))) {
      apiCache.delete(key);
    }
  }
};

// Handle API errors
const handleApiError = async (response: Response) => {
  const clonedResponse = response.clone();
  let errorMessage;
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || 'API request failed';
  } catch (jsonError) {
    try {
      errorMessage = await clonedResponse.text();
    } catch (textError) {
      errorMessage = `Request failed with status ${response.status}`;
    }
  }
  
  const error = new Error(errorMessage);
  (error as any).status = response.status;
  (error as any).response = { data: { message: errorMessage } };
  throw error;
};

/**
 * Fetch data with caching and token refresh handling
 */
export const fetchWithCache = async <T>(
  url: string,
  options?: RequestInit,
  skipCache = false
): Promise<T> => {
  const cacheKey = getCacheKey(url, options);
  
  // Check cache first (unless skipCache is true)
  if (!skipCache && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as T;
    }
  }
  
  // Add authorization header if token exists
  const accessToken = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options?.headers || {}),
  };

  // Always include credentials for cross-origin requests
  const fetchOptions: RequestInit = {
    ...getDefaultFetchOptions(),
    ...options,
    credentials: 'include',
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);

    // Handle token expiration
    if (response.status === 401 && !url.includes('/refresh-token')) {
      try {
        const newToken = await refreshToken();
        if (newToken) {
          const newResponse = await fetch(url, {
            ...fetchOptions,
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          });

          if (!newResponse.ok) {
            await handleApiError(newResponse);
          }
          
          const data = await newResponse.json();
          
          // Invalidate relevant caches on successful auth-related requests
          if (url.includes('/users/')) {
            invalidateCache('user');
          }
          
          if (!skipCache) {
            apiCache.set(cacheKey, {
              data,
              timestamp: Date.now(),
            });
          }
          return data as T;
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearAllCachedData();
        throw refreshError;
      }
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    
    // Invalidate relevant caches on successful auth-related requests
    if (url.includes('/users/')) {
      invalidateCache('user');
    }
    
    if (!skipCache) {
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }
    
    return data as T;
  } catch (error) {
    console.error('API request error:', error);
    
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    throw error;
  }
};

/**
 * Clear the entire cache or a specific entry
 */
export const clearCache = (url?: string, options?: RequestInit) => {
  if (url) {
    const cacheKey = getCacheKey(url, options);
    apiCache.delete(cacheKey);
  } else {
    apiCache.clear();
  }
};

/**
 * Clears all API cached data and local storage tokens
 * Used during logout to ensure a fresh state
 */
export const clearAllCachedData = () => {
  // Clear all API cache
  apiCache.clear();
  
  // Remove any auth-related items from localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('lastTokenRefresh');
  localStorage.removeItem('redirectTo');
  
  console.log('All cached API data cleared');
};

interface APIResponse<T> {
  data: T;
}

// Import types
import { IUser } from '@/redux/slices/authSlice';
import { Test, TestResults } from '@/redux/slices/testSlice';

interface LoginResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    role: string; // Ensure role is included
  };
  accessToken: string;
  refreshToken: string;
}

// User types for admin functions
interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: string;
  updatedAt: string;
  analytics?: {
    totalTests: number;
    testsThisWeek: number;
    averageScore: number;
    accuracy: number;
  };
}

interface PaginatedResponse<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

/**
 * API endpoints
 */
export const API = {
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetchWithCache<APIResponse<LoginResponse>>(`${API_BASE}/users/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        invalidateCache('auth');
      }
      return response;
    },
    logout: async () => {
      try {
        await fetchWithCache<APIResponse<void>>(`${API_BASE}/users/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } finally {
        clearAllCachedData();
      }
    },
    register: async (userData: { fullName: string; email: string; username: string; password: string }) => {
      const response = await fetchWithCache<APIResponse<LoginResponse>>(`${API_BASE}/users/register`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      return response;
    },
    getCurrentUser: async () => {
      return fetchWithCache<APIResponse<IUser>>(`${API_BASE}/users/current-user`, {
        method: 'GET',
      }, true); // Skip cache for current user to always get fresh data
    },
    forgotPassword: (email: string) =>
      fetchWithCache<APIResponse<void>>(`${API_BASE}/users/forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, true), // Skip cache for password reset
    resetPassword: (token: string, password: string) =>
      fetchWithCache<APIResponse<void>>(`${API_BASE}/users/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }, true), // Skip cache for password reset
    refreshToken: async () => {
      return fetchWithCache<APIResponse<{ accessToken: string }>>(`${API_BASE}/users/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      });
    },
  },
  admin: {
    // Admin user management functions
    getUsers: (queryParams: string) =>
      fetchWithCache<APIResponse<PaginatedResponse<User>>>(`${API_BASE}/users/admin?${queryParams}`, {
        method: 'GET',
      }),
    getUserAnalytics: () =>
      fetchWithCache<APIResponse<any>>(`${API_BASE}/users/admin/analytics`, {
        method: 'GET',
      }),
    getUserDetails: (userId: string) =>
      fetchWithCache<APIResponse<User>>(`${API_BASE}/users/admin/${userId}`, {
        method: 'GET',
      }),
    updateUserRole: (userId: string, role: string) =>
      fetchWithCache<APIResponse<User>>(`${API_BASE}/users/admin/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }, true), // Skip cache to ensure fresh data
  },
  questions: {
    getAll: (filters?: Record<string, string>) => {
      const queryParams = filters 
        ? '?' + new URLSearchParams(filters).toString() 
        : '';
      return fetchWithCache<APIResponse<any>>(`${API_BASE}/questions/get${queryParams}`);
    },
    getById: (id: string) => 
      fetchWithCache<APIResponse<any>>(`${API_BASE}/questions/get/${id}`),
    create: (questionData: any) => 
      fetchWithCache<APIResponse<any>>(`${API_BASE}/questions/upload`, {
        method: 'POST',
        body: JSON.stringify(questionData),
      }),
    update: (id: string, questionData: any) => 
      fetchWithCache<APIResponse<any>>(`${API_BASE}/questions/update/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(questionData),
      }),
    delete: (id: string) => 
      fetchWithCache<APIResponse<void>>(`${API_BASE}/questions/delete/${id}`, {
        method: 'DELETE',
      }),
  },
  tests: {
    getAll: () => 
      fetchWithCache<APIResponse<Test[]>>(`${API_BASE}/tests`),
    getById: (id: string) => 
      fetchWithCache<APIResponse<Test>>(`${API_BASE}/tests/${id}`),
    getTestForAttempt: (id: string) => 
      fetchWithCache<APIResponse<Test>>(`/api/proxy/tests/${id}/attempt`, {
        credentials: 'include', // Ensure cookies are sent for authentication
      }),
    create: (testData: any) => 
      fetchWithCache<APIResponse<Test>>(`${API_BASE}/tests`, {
        method: 'POST',
        body: JSON.stringify(testData),
      }),
    submitResults: (testId: string, results: any) =>
      fetchWithCache<APIResponse<TestResults>>(`${API_BASE}/test-results/submit`, {
        method: 'POST',
        body: JSON.stringify({ testId, ...results }),
      }, true), // Skip cache for submissions
    getUserResults: (userId?: string) => {
      const query = userId ? `?userId=${userId}` : '';
      return fetchWithCache<APIResponse<TestResults[]>>(`${API_BASE}/test-results/user${query}`);
    },
    getAnalysis: (testId: string) =>
      fetchWithCache<APIResponse<any>>(`${API_BASE}/test-results/analysis/${testId}`),
    submitAttemptedTest: (payload: any) =>
      fetchWithCache<APIResponse<any>>(`${API_BASE}/attempted-tests/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, true), // Skip cache for submissions
    getSolutions: (attemptId: string) =>
      fetchWithCache<APIResponse<any>>(`${API_BASE}/attempted-tests/solutions/${attemptId}`, {
        credentials: 'include', // Ensure cookies are sent for authentication
        headers: {
          'Accept': 'application/json',
        }
      }),
  },
  practice: {
    getSubjects: () =>
      fetchWithCache<APIResponse<string[]>>(`${API_BASE}/practice/subjects`),
    getTopicsBySubject: (subject: string) =>
      fetchWithCache<APIResponse<string[]>>(`${API_BASE}/practice/topics?subject=${subject}`),
    getQuestionsByTopic: (topic: string, limit = 10) =>
      fetchWithCache<APIResponse<any>>(`${API_BASE}/practice/questions?topic=${topic}&limit=${limit}`),
  },
};

// Preload common data on client-side
if (typeof window !== 'undefined') {
  // Preload current user data
  preloadData(`${API_BASE}/users/current-user`);

  
  // Preload common test data
  preloadData(`${API_BASE}/tests`);
} 