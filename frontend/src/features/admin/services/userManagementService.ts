import { fetchWithAuth } from '@/features/auth/api/authApi';
import type { 
  User, 
  PaginatedUsers,
  UserAnalytics
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface APIResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

/**
 * Service class for handling all user management API interactions.
 */
export class UserManagementService {
  
  // ==========================================
  // 👥 USER MANAGEMENT SERVICES
  // ==========================================
  
  /**
   * Fetches a paginated list of users with filtering and sorting options.
   */
  static async getUsers(queryParams: string = ''): Promise<PaginatedUsers> {
    const response = await fetchWithAuth<APIResponse<PaginatedUsers>>(
      `${API_BASE}/users/admin?${queryParams}`
    );
    return response.data;
  }

  /**
   * Fetches user analytics data including total users, users by role, etc.
   */
  static async getUsersAnalytics(): Promise<UserAnalytics> {
    const response = await fetchWithAuth<APIResponse<UserAnalytics>>(
      `${API_BASE}/users/admin/analytics`
    );
    return response.data;
  }

  /**
   * Fetches detailed information about a specific user including their statistics.
   */
  static async getUserDetails(userId: string): Promise<User> {
    const response = await fetchWithAuth<APIResponse<User>>(
      `${API_BASE}/users/admin/${userId}`
    );
    return response.data;
  }

  /**
   * Updates the role of a specific user (promote to admin or demote to user).
   * Only superadmin can perform this action.
   */
  static async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<User> {
    const response = await fetchWithAuth<APIResponse<User>>(
      `${API_BASE}/users/admin/${userId}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }
    );
    return response.data;
  }
}

