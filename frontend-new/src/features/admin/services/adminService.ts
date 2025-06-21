import { fetchWithAuth } from '@/features/auth/api/authApi';
import type { AdminAnalytics, User, UserAnalytics, PaginatedUsers } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface APIResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

/**
 * Service class for handling all admin-related API interactions.
 */
export class AdminService {
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

  /**
   * Fetches a paginated list of users.
   */
  static async getUsers(queryParams: string): Promise<PaginatedUsers> {
    const response = await fetchWithAuth<APIResponse<PaginatedUsers>>(
      `${API_BASE}/v1/admin/users?${queryParams}`
    );
    return response.data;
  }

  /**
   * Fetches user-related analytics.
   */
  static async getUserAnalytics(): Promise<UserAnalytics> {
    const response = await fetchWithAuth<APIResponse<UserAnalytics>>(
      `${API_BASE}/v1/admin/users/analytics`
    );
    return response.data;
  }

  /**
   * Fetches details for a specific user.
   */
  static async getUserDetails(userId: string): Promise<User> {
    const response = await fetchWithAuth<APIResponse<User>>(
      `${API_BASE}/v1/admin/users/${userId}`
    );
    return response.data;
  }

  /**
   * Updates the role of a specific user.
   */
  static async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<User> {
    const response = await fetchWithAuth<APIResponse<User>>(
      `${API_BASE}/v1/admin/users/${userId}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }
    );
    return response.data;
  }
}
