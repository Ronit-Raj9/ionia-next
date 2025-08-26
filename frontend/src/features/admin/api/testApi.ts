import { fetchWithAuth } from '@/features/auth/api/authApi';
import type { 
  Test, 
  PaginatedTests, 
  CreateTestData, 
  UpdateTestData 
} from '../types';

// Get the API base URL with proper environment detection
const getApiBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  console.log('TestAPI: API_BASE_URL:', url);
  return url;
};

const API_BASE = getApiBaseUrl();

// ==========================================
// 📊 TEST API ENDPOINTS
// ==========================================

/**
 * Create a new test
 */
export const createTest = async (data: CreateTestData): Promise<Test> => {
  const response = await fetchWithAuth<{ data: Test }>(`${API_BASE}/v1/tests`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
};

/**
 * Get all tests with pagination and filters
 */
export const getTests = async (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  testCategory?: 'PYQ' | 'Platform' | 'UserCustom';
  status?: 'draft' | 'published' | 'archived';
  subject?: string;
  examType?: string;
  class?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  platformTestType?: string;
  year?: number;
  isPremium?: boolean;
  createdBy?: string;
  tag?: string;
  fetchAll?: boolean;
}): Promise<PaginatedTests> => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  
  const url = `${API_BASE}/v1/tests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetchWithAuth<{ data: PaginatedTests }>(url);
  return response.data;
};

/**
 * Get all tests without pagination (admin only)
 */
export const getAllTests = async (): Promise<PaginatedTests> => {
  const response = await fetchWithAuth<{ data: PaginatedTests }>(`${API_BASE}/v1/tests/all`);
  return response.data;
};

/**
 * Get a single test by ID
 */
export const getTestById = async (id: string): Promise<Test> => {
  console.log('TestAPI: Making request to:', `${API_BASE}/v1/tests/${id}`);
  const response = await fetchWithAuth<{ data: Test }>(`${API_BASE}/v1/tests/${id}`);
  console.log('TestAPI: Response received:', response);
  return response.data;
};

/**
 * Update an existing test
 */
export const updateTest = async (id: string, data: UpdateTestData): Promise<Test> => {
  const response = await fetchWithAuth<{ data: Test }>(`${API_BASE}/v1/tests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.data;
};

/**
 * Delete a test
 */
export const deleteTest = async (id: string): Promise<{ deletedId: string }> => {
  const response = await fetchWithAuth<{ data: { deletedId: string } }>(`${API_BASE}/v1/tests/${id}`, {
    method: 'DELETE',
  });
  return response.data;
};

/**
 * Get a test prepared for attempting (without answers)
 */
export const getTestForAttempt = async (id: string): Promise<{
  _id: string;
  title: string;
  description: string;
  subject: string;
  examType: string;
  difficulty: string;
  duration: number;
  totalQuestions: number;
  time: number;
  markingScheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  year?: number;
  platformTestType?: string;
  session?: string;
  questions: Array<{
    _id: string;
    question: {
      text: string;
      image?: string;
    };
    options: Array<{
      text: string;
      image?: string;
    }>;
    subject: string;
    examType: string;
    difficulty: string;
    userAnswer?: string;
    isMarked: boolean;
    timeTaken: number;
    isVisited: boolean;
  }>;
}> => {
  const response = await fetchWithAuth<{ data: any }>(`${API_BASE}/v1/tests/${id}/attempt`);
  return response.data;
};

/**
 * Get a test with populated questions (for admin view)
 */
export const getTestWithQuestions = async (id: string): Promise<Test> => {
  console.log('TestAPI: Making request to get test with questions:', `${API_BASE}/v1/tests/${id}/with-questions`);
  const response = await fetchWithAuth<{ data: Test }>(`${API_BASE}/v1/tests/${id}/with-questions`);
  console.log('TestAPI: Test with questions response received:', response);
  return response.data;
};

// ==========================================
// 🎯 MOCK TEST ENDPOINTS (Public)
// ==========================================

/**
 * Get mock tests by exam type (public endpoint)
 */
export const getMockTests = async (examType: string, params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  subject?: string;
  class?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  isPremium?: boolean;
  tag?: string;
}): Promise<PaginatedTests> => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }
  
  const url = `${API_BASE}/v1/tests/mock/${examType}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetchWithAuth<{ data: PaginatedTests }>(url);
  return response.data;
};

/**
 * Get a specific mock test by ID (public endpoint)
 */
export const getMockTestById = async (examType: string, id: string): Promise<Test> => {
  const response = await fetchWithAuth<{ data: Test }>(`${API_BASE}/v1/tests/mock/${examType}/${id}`);
  return response.data;
};

/**
 * Get a mock test prepared for attempting (public endpoint)
 */
export const getMockTestForAttempt = async (examType: string, id: string): Promise<{
  _id: string;
  title: string;
  description: string;
  subject: string;
  examType: string;
  difficulty: string;
  duration: number;
  totalQuestions: number;
  time: number;
  markingScheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  year?: number;
  platformTestType?: string;
  session?: string;
  questions: Array<{
    _id: string;
    question: {
      text: string;
      image?: string;
    };
    options: Array<{
      text: string;
      image?: string;
    }>;
    subject: string;
    examType: string;
    difficulty: string;
    userAnswer?: string;
    isMarked: boolean;
    timeTaken: number;
    isVisited: boolean;
  }>;
}> => {
  const response = await fetchWithAuth<{ data: any }>(`${API_BASE}/v1/tests/mock/${examType}/${id}/attempt`);
  return response.data;
};
