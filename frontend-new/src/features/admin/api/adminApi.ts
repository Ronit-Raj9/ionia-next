import { AdminService } from '../services/adminService';

/**
 * Fetches the main analytics data for the admin dashboard.
 */
export const getAdminAnalytics = AdminService.getAnalytics;

/**
 * Fetches a paginated list of users for the admin user management table.
 */
export const getUsers = AdminService.getUsers;

/**
 * Fetches user-related analytics for the admin dashboard.
 */
export const getUserAnalytics = AdminService.getUserAnalytics;

/**
 * Fetches the details for a single user.
 */
export const getUserDetails = AdminService.getUserDetails;

/**
 * Updates the role of a user.
 */
export const updateUserRole = AdminService.updateUserRole;
