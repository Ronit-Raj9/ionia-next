import { fetchWithAuth } from '@/features/auth/api/authApi';
import type { 
  AdminAnalytics, 
  Test,
  PaginatedTests,
  CreateTestData,
  UpdateTestData
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface APIResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

/**
 * Service class for handling all admin-related API interactions.
 */
export class AdminService {
  
  // ==========================================
  // 📊 ANALYTICS SERVICES
  // ==========================================
  
  /**
   * Fetches the main analytics data for the admin dashboard.
   */
  static async getAnalytics(): Promise<AdminAnalytics> {
    const response = await fetchWithAuth<AdminAnalytics>(
      `${API_BASE}/v1/admin/analytics`
    );
    // The backend sends the data directly for this endpoint.
    return response;
  }



  // ==========================================
  // 📝 TEST MANAGEMENT SERVICES
  // ==========================================
  
  /**
   * Fetches paginated tests with filters
   */
  static async getTests(queryParams: string = ''): Promise<PaginatedTests> {
    const response = await fetchWithAuth<APIResponse<PaginatedTests>>(
      `${API_BASE}/tests?${queryParams}`
    );
    return response.data;
  }

  /**
   * Fetches all tests without pagination (admin only)
   */
  static async getAllTests(queryParams: string = ''): Promise<Test[]> {
    const response = await fetchWithAuth<APIResponse<{ docs: Test[] }>>(
      `${API_BASE}/tests/all?${queryParams}`
    );
    return response.data.docs;
  }

  /**
   * Creates a new test
   */
  static async createTest(testData: CreateTestData): Promise<Test> {
    const response = await fetchWithAuth<APIResponse<Test>>(
      `${API_BASE}/tests`,
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
      `${API_BASE}/tests/${testId}`,
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
      `${API_BASE}/tests/${testId}`,
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
      `${API_BASE}/tests/${testId}`
    );
    return response.data;
  }

  /**
   * Gets a test prepared for attempting (without answers)
   */
  static async getTestForAttempt(testId: string): Promise<any> {
    const response = await fetchWithAuth<APIResponse<any>>(
      `${API_BASE}/tests/${testId}/attempt`
    );
    return response.data;
  }

  /**
   * Gets mock tests by exam type (public endpoint)
   */
  static async getMockTestsByExamType(examType: string, queryParams: string = ''): Promise<Test[]> {
    const response = await fetchWithAuth<APIResponse<{ docs: Test[] }>>(
      `${API_BASE}/tests/mock/${examType}?${queryParams}`
    );
    return response.data.docs;
  }

  /**
   * Gets a specific mock test by exam type and ID (public endpoint)
   */
  static async getMockTestById(examType: string, testId: string): Promise<Test> {
    const response = await fetchWithAuth<APIResponse<Test>>(
      `${API_BASE}/tests/mock/${examType}/${testId}`
    );
    return response.data;
  }

  /**
   * Gets a mock test prepared for attempting (public endpoint)
   */
  static async getMockTestForAttempt(examType: string, testId: string): Promise<any> {
    const response = await fetchWithAuth<APIResponse<any>>(
      `${API_BASE}/tests/mock/${examType}/${testId}/attempt`
    );
    return response.data;
  }
}
