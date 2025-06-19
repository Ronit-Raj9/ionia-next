// API utility functions for non-auth endpoints
import { useUIStore } from '@/stores/uiStore';
import { useCacheStore, generateCacheKey } from '@/stores/cacheStore';
import { refreshTokens } from '@/features/auth/api/authApi';
import { getAccessToken } from '@/features/auth/store/authStore';

// Get the API base URL with proper environment detection
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://3.7.73.172/api/v1';
};

const API_BASE = getApiBaseUrl();

// Configure fetch options for CORS
const getDefaultFetchOptions = (): RequestInit => ({
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors'
});

// Handle API errors with proper error types
const handleApiError = async (response: Response, url: string) => {
  const { addNotification } = useUIStore.getState();
  let errorMessage: string;
  let errorData: any = null;
  
  try {
    errorData = await response.json();
    errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`;
  } catch (jsonError) {
    errorMessage = `Request failed with status ${response.status}`;
  }
  
  // Add user-friendly notifications for specific errors
  if (response.status === 429) {
    addNotification({
      type: 'warning',
      title: 'Too Many Requests',
      message: 'Please wait a moment before trying again.',
      duration: 5000,
    });
  } else if (response.status >= 500) {
    addNotification({
      type: 'error',
      title: 'Server Error',
      message: 'Something went wrong. Please try again later.',
      duration: 5000,
    });
  }
  
  const error = new Error(errorMessage);
  (error as any).status = response.status;
  (error as any).response = errorData;
  (error as any).url = url;
  
  throw error;
};

/**
 * Enhanced fetch with automatic token refresh, caching, and error handling
 */
export const fetchWithAuth = async <T>(
  url: string,
  options?: RequestInit,
  useCache = true,
  cacheKey?: string
): Promise<T> => {
  const { setLoading } = useUIStore.getState();
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
  
  // Set loading state
  const loadingKey = `api-${finalCacheKey}`;
  setLoading(loadingKey, true);
  
  try {
    // Get access token
    let accessToken = getAccessToken();
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
      
      // Try to refresh token using auth API
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
  } finally {
    // Clear loading state
    setLoading(loadingKey, false);
  }
};

// Response interfaces
interface APIResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

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
 * Non-auth API endpoints
 */
export const API = {
  admin: {
    getUsers: (queryParams: string) =>
      fetchWithAuth<APIResponse<PaginatedResponse<User>>>(
        `${API_BASE}/users/admin?${queryParams}`,
        { method: 'GET' }
      ),

    getUserAnalytics: () =>
      fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/users/admin/analytics`,
        { method: 'GET' }
      ),

    getUserDetails: (userId: string) =>
      fetchWithAuth<APIResponse<User>>(
        `${API_BASE}/users/admin/${userId}`,
        { method: 'GET' }
      ),

    updateUserRole: (userId: string, role: string) =>
      fetchWithAuth<APIResponse<User>>(
        `${API_BASE}/users/admin/${userId}/role`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role }),
        },
        false
      ),
  },

  questions: {
    getAll: (filters?: Record<string, string>) => {
      const queryParams = filters 
        ? '?' + new URLSearchParams(filters).toString() 
        : '';
      return fetchWithAuth<APIResponse<any>>(`${API_BASE}/questions/get${queryParams}`);
    },

    getById: (id: string) => 
      fetchWithAuth<APIResponse<any>>(`${API_BASE}/questions/get/${id}`),

    create: (questionData: any) => 
      fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/questions/upload`,
        {
          method: 'POST',
          body: JSON.stringify(questionData),
        },
        false
      ),

    update: (id: string, questionData: any) => 
      fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/questions/update/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(questionData),
        },
        false
      ),

    delete: (id: string) => 
      fetchWithAuth<APIResponse<void>>(
        `${API_BASE}/questions/delete/${id}`,
        { method: 'DELETE' },
        false
      ),
  },

  tests: {
    getAll: () => 
      fetchWithAuth<APIResponse<any[]>>(`${API_BASE}/tests`),

    getById: (id: string) => 
      fetchWithAuth<APIResponse<any>>(`${API_BASE}/tests/${id}`),

    getTestForAttempt: (id: string) => 
      fetchWithAuth<APIResponse<any>>(`${API_BASE}/tests/${id}/attempt`),

    create: (testData: any) => 
      fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/tests`,
        {
          method: 'POST',
          body: JSON.stringify(testData),
        },
        false
      ),

    submitResults: (testId: string, results: any) =>
      fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/test-results/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ testId, ...results }),
        },
        false
      ),

    getUserResults: (userId?: string) => {
      const query = userId ? `?userId=${userId}` : '';
      return fetchWithAuth<APIResponse<any[]>>(`${API_BASE}/test-results/user${query}`);
    },

    getAnalysis: (testId: string) =>
      fetchWithAuth<APIResponse<any>>(`${API_BASE}/test-results/analysis/${testId}`),

    submitAttemptedTest: (payload: any) =>
      fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/attempted-tests/submit`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        false
      ),

    getSolutions: (attemptId: string) =>
      fetchWithAuth<APIResponse<any>>(`${API_BASE}/attempted-tests/solutions/${attemptId}`),
  },

  practice: {
    getSubjects: () =>
      fetchWithAuth<APIResponse<string[]>>(`${API_BASE}/practice/subjects`),

    getTopicsBySubject: (subject: string) =>
      fetchWithAuth<APIResponse<string[]>>(`${API_BASE}/practice/topics?subject=${subject}`),

    getQuestionsByTopic: (topic: string, limit = 10) =>
      fetchWithAuth<APIResponse<any>>(`${API_BASE}/practice/questions?topic=${topic}&limit=${limit}`),
  },
};

// Legacy compatibility - keeping existing exports
export { fetchWithAuth as fetchWithCache };
export const preloadData = (url: string, options?: RequestInit) => {
  // Preload data by making a request and caching it
  fetchWithAuth(url, options).catch(() => {
    // Silently fail preloads
  });
};