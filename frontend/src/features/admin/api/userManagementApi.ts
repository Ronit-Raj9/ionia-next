import { UserManagementService } from '../services/userManagementService';

// ==========================================
// 👥 USER MANAGEMENT API ENDPOINTS
// ==========================================

/**
 * Fetches a paginated list of users for the admin user management table.
 * Supports filtering by search, role, and sorting.
 */
export const getUsers = UserManagementService.getUsers;

/**
 * Fetches user analytics data including total users, users by role, etc.
 */
export const getUsersAnalytics = UserManagementService.getUsersAnalytics;

/**
 * Fetches the details for a single user including their statistics.
 */
export const getUserDetails = UserManagementService.getUserDetails;

/**
 * Updates the role of a user (promote to admin or demote to user).
 * Only superadmin can perform this action.
 */
export const updateUserRole = UserManagementService.updateUserRole;

