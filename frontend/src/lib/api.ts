// API utility functions with caching and preloading capabilities

// Cache for storing API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

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

const refreshToken = async () => {
  try {
    if (!isRefreshing) {
      isRefreshing = true;
      const response = await fetch(`${API_BASE}/users/refresh-token`, {
        method: 'POST',
        credentials: 'include',
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
    window.location.href = '/auth/login';
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
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options?.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      try {
        const newToken = await refreshToken();
        if (newToken) {
          // Retry the original request with new token
          const newResponse = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            },
          });

          if (!newResponse.ok) {
            throw new Error('Request failed after token refresh');
          }
          
          const data = await newResponse.json();
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
        window.location.href = '/auth/login';
        throw refreshError;
      }
    }

    if (!response.ok) {
      const clonedResponse = response.clone();
      let errorMessage;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || 'API request failed';
      } catch (jsonError) {
        try {
          errorMessage = await clonedResponse.text();
        } catch (textError) {
          errorMessage = `API request failed with status ${response.status}`;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!skipCache) {
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }
    
    return data as T;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
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

// Base API URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
      });
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
      fetchWithCache<APIResponse<Test[]>>(`${API_BASE}/previous-year-papers/get`),
    getById: (id: string) => 
      fetchWithCache<APIResponse<Test>>(`${API_BASE}/previous-year-papers/get/${id}`),
    create: (testData: any) => 
      fetchWithCache<APIResponse<Test>>(`${API_BASE}/previous-year-papers/add`, {
        method: 'POST',
        body: JSON.stringify(testData),
      }),
    submitResults: (paperId: string, results: any) =>
      fetchWithCache<APIResponse<TestResults>>(`${API_BASE}/test-results/submit`, {
        method: 'POST',
        body: JSON.stringify({ paperId, ...results }),
      }, true), // Skip cache for submissions
    getUserResults: (userId?: string) => {
      const query = userId ? `?userId=${userId}` : '';
      return fetchWithCache<APIResponse<TestResults[]>>(`${API_BASE}/test-results/user${query}`);
    },
    getAnalysis: (paperId: string) =>
      fetchWithCache<APIResponse<any>>(`${API_BASE}/test-results/analysis/${paperId}`),
    submitAttemptedTest: (payload: any) =>
      fetchWithCache<APIResponse<any>>(`${API_BASE}/attempted-tests/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, true), // Skip cache for submissions
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
  preloadData(`${API_BASE}/previous-year-papers/get`);
} 