import { fetchWithAuth } from '@/features/auth/api/authApi';
import { analyticsCacheUtils } from '@/stores/analyticsCacheStore';
import type { 
  AdminAnalytics, 
  Test,
  PaginatedTests,
  CreateTestData,
  UpdateTestData
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_VERSION = '/v1';

interface APIResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

// Request deduplication - prevent multiple simultaneous requests
let analyticsRequestPromise: Promise<AdminAnalytics> | null = null;

/**
 * Service class for handling all admin-related API interactions.
 */
export class AdminService {
  
  // ==========================================
  // 📊 ANALYTICS SERVICES
  // ==========================================
  
  /**
   * Fetches the main analytics data for the admin dashboard.
   * Uses smart caching and request deduplication to avoid unnecessary API calls.
   */
  static async getAnalytics(forceRefresh: boolean = false): Promise<AdminAnalytics> {
    // Check if we have cached data and it's still fresh
    if (!forceRefresh) {
      const cachedData = analyticsCacheUtils.getCachedData();
      if (cachedData) {
        console.log('📊 Analytics: Using cached data');
        return cachedData;
      }
    }

    // If there's already a request in progress, wait for it instead of making a new one
    if (analyticsRequestPromise && !forceRefresh) {
      console.log('📊 Analytics: Waiting for existing request');
      return analyticsRequestPromise;
    }

    console.log('📊 Analytics: Fetching fresh data from API');
    
    // Create the request promise and store it
    analyticsRequestPromise = this.fetchAnalyticsFromAPI();
    
    try {
      const result = await analyticsRequestPromise;
      return result;
    } finally {
      // Clear the promise when done
      analyticsRequestPromise = null;
    }
  }

  /**
   * Internal method to fetch analytics from API with timeout
   */
  private static async fetchAnalyticsFromAPI(): Promise<AdminAnalytics> {
    try {
      // Create a timeout promise (30 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });

      // Race between the API call and timeout
      const response = await Promise.race([
        fetchWithAuth<AdminAnalytics>(`${API_BASE}${API_VERSION}/admin/analytics`),
        timeoutPromise
      ]);
      
      // Cache the fresh data
      analyticsCacheUtils.updateCache(response);
      
      console.log('📊 Analytics: Data cached successfully');
      return response;
    } catch (error) {
      console.error('📊 Analytics: Failed to fetch data:', error);
      
      // If API fails, try to return stale cached data as fallback
      const staleData = analyticsCacheUtils.getCachedData();
      if (staleData) {
        console.log('📊 Analytics: Using stale cached data as fallback');
        return staleData;
      }
      
      // Re-throw if no cached data available
      throw error;
    }
  }

  /**
   * Forces a refresh of analytics data, bypassing cache
   */
  static async refreshAnalytics(): Promise<AdminAnalytics> {
    return this.getAnalytics(true);
  }

  /**
   * Clears the analytics cache
   */
  static clearAnalyticsCache(): void {
    analyticsCacheUtils.clearCache();
    console.log('📊 Analytics: Cache cleared');
  }

  /**
   * Marks analytics cache as stale (useful when data might be outdated)
   */
  static markAnalyticsStale(): void {
    analyticsCacheUtils.markStale();
    console.log('📊 Analytics: Cache marked as stale');
  }



  // ==========================================
  // 📝 TEST MANAGEMENT SERVICES
  // ==========================================
  
  /**
   * Fetches paginated tests with filters
   */
  static async getTests(queryParams: string = ''): Promise<PaginatedTests> {
    const response = await fetchWithAuth<APIResponse<PaginatedTests>>(
      `${API_BASE}${API_VERSION}/tests?${queryParams}`
    );
    return response.data;
  }

  /**
   * Fetches all tests without pagination (admin only)
   */
  static async getAllTests(queryParams: string = ''): Promise<Test[]> {
    const response = await fetchWithAuth<APIResponse<{ docs: Test[] }>>(
      `${API_BASE}${API_VERSION}/tests/all?${queryParams}`
    );
    return response.data.docs;
  }

  /**
   * Creates a new test
   */
  static async createTest(testData: CreateTestData): Promise<Test> {
    const response = await fetchWithAuth<APIResponse<Test>>(
      `${API_BASE}${API_VERSION}/tests`,
      {
        method: 'POST',
        body: JSON.stringify(testData),
      }
    );
    return response.data;
  }

  /**
   * Updates an existing test
   */
  static async updateTest(testId: string, testData: UpdateTestData): Promise<Test> {
    const response = await fetchWithAuth<APIResponse<Test>>(
      `${API_BASE}${API_VERSION}/tests/${testId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(testData),
      }
    );
    return response.data;
  }

  /**
   * Deletes a test
   */
  static async deleteTest(testId: string): Promise<void> {
    await fetchWithAuth<APIResponse<null>>(
      `${API_BASE}${API_VERSION}/tests/${testId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Gets a single test by ID
   */
  static async getTestById(testId: string): Promise<Test> {
    const response = await fetchWithAuth<APIResponse<Test>>(
      `${API_BASE}${API_VERSION}/tests/${testId}`
    );
    return response.data;
  }

  /**
   * Gets a test prepared for attempting (without answers)
   */
  static async getTestForAttempt(testId: string): Promise<any> {
    const response = await fetchWithAuth<APIResponse<any>>(
      `${API_BASE}${API_VERSION}/tests/${testId}/attempt`
    );
    return response.data;
  }

  /**
   * Gets mock tests by exam type (public endpoint)
   */
  static async getMockTestsByExamType(examType: string, queryParams: string = ''): Promise<Test[]> {
    const response = await fetchWithAuth<APIResponse<{ docs: Test[] }>>(
      `${API_BASE}${API_VERSION}/tests/mock/${examType}?${queryParams}`
    );
    return response.data.docs;
  }

  /**
   * Gets a specific mock test by exam type and ID (public endpoint)
   */
  static async getMockTestById(examType: string, testId: string): Promise<Test> {
    const response = await fetchWithAuth<APIResponse<Test>>(
      `${API_BASE}${API_VERSION}/tests/mock/${examType}/${testId}`
    );
    return response.data;
  }

  /**
   * Gets a mock test prepared for attempting (public endpoint)
   */
  static async getMockTestForAttempt(examType: string, testId: string): Promise<any> {
    const response = await fetchWithAuth<APIResponse<any>>(
      `${API_BASE}${API_VERSION}/tests/mock/${examType}/${testId}/attempt`
    );
    return response.data;
  }
}
