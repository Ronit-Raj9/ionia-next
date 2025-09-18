import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserStatistics,
  checkUsername,
  forgotPassword,
  resetPassword,
  logoutFromAllDevices,
  // Admin routes
  getAllUsers,
  getUserDetails,
  updateUserRole,
  getUsersAnalytics,
  // Note: Google OAuth routes removed - using email/password only authentication
  // Email verification routes
  sendEmailVerification,
  verifyEmail,
  // Account security routes
  unlockAccount,
  getUserActivityLogs
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyRole, logAuthEvent } from "../middlewares/auth.middleware.js";
import { createRateLimitMiddleware } from "../utils/rateLimiter.js";
import { csrfProtection, generateCSRFForAuth, generateCSRFToken, setCSRFTokenCookie } from "../middlewares/csrf.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

/**
 * Public Routes with Rate Limiting
 * - Everyone can access without being authenticated
 * - Rate limiting applied to prevent abuse
 */

// Registration with rate limiting and logging
router.route("/register").post(
  createRateLimitMiddleware('register'),
  logAuthEvent('REGISTER_ATTEMPT'),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

// Login with rate limiting and logging
router.route("/login").post(
  createRateLimitMiddleware('login'),
  logAuthEvent('LOGIN_ATTEMPT'),
  loginUser
);

// Username availability check (light rate limiting)
router.route("/check-username").post(
  createRateLimitMiddleware('register'), // Reuse register limits
  checkUsername
);

// Password reset routes with rate limiting
router.route("/forgot-password").post(
  createRateLimitMiddleware('forgot-password'),
  logAuthEvent('FORGOT_PASSWORD_ATTEMPT'),
  forgotPassword
);

router.route("/reset-password").post(
  createRateLimitMiddleware('forgot-password'), // Reuse forgot-password limits
  logAuthEvent('RESET_PASSWORD_ATTEMPT'),
  resetPassword
);

// Note: Google OAuth routes removed - using email/password only authentication

// 🔥 EMAIL VERIFICATION ROUTES
router.route("/verify-email/send").post(
  verifyJWT,
  createRateLimitMiddleware('forgot-password'), // Reuse forgot-password limits
  sendEmailVerification
);

router.route("/verify-email").post(
  createRateLimitMiddleware('forgot-password'), // Reuse forgot-password limits
  verifyEmail
);

/**
 * Protected Routes (Must be Authenticated)
 * - Requires verifyJWT to ensure the user is logged in
 * - Some routes have additional rate limiting for security
 */

// Logout with logging
router.route("/logout").post(
  verifyJWT, 
  csrfProtection,
  logAuthEvent('LOGOUT'),
  logoutUser
);

// Logout from all devices
router.route("/logout-all").post(
  verifyJWT,
  csrfProtection,
  logAuthEvent('LOGOUT_ALL_DEVICES'),
  logoutFromAllDevices
);

// Token refresh with rate limiting and CSRF protection
router.route("/refresh-token").post(
  createRateLimitMiddleware('refresh-token'),
  csrfProtection,
  refreshAccessToken
);

// CSRF token refresh endpoint
router.route("/refresh-csrf").post(
  verifyJWT,
  (req, res) => {
    const csrfToken = generateCSRFToken();
    setCSRFTokenCookie(res, csrfToken);
    
    res.json(new ApiResponse(200, { csrfToken }, "CSRF token refreshed successfully"));
  }
);

// Password change with rate limiting
router.route("/change-password").post(
  verifyJWT,
  csrfProtection,
  createRateLimitMiddleware('login'), // Use login limits for password changes
  logAuthEvent('PASSWORD_CHANGE'),
  changeCurrentPassword
);

// Get current user info
router.route("/current-user").get(verifyJWT, getCurrrentUser);

/**
 * User Profile Management Routes
 * - Authenticated users can manage their own profiles
 * - Rate limiting applied to prevent abuse
 */

// Update account details
router.route("/update-account").patch(
  verifyJWT, 
  csrfProtection,
  verifyRole(["user", "admin", "superadmin"]), 
  updateAccountDetails
);

// Update avatar
router.route("/avatar").patch(
    verifyJWT,
    csrfProtection,
  verifyRole(["user", "admin", "superadmin"]),
    upload.single("avatar"),
    updateUserAvatar
  );

// Update cover image
router.route("/cover-image").patch(
    verifyJWT,
    csrfProtection,
  verifyRole(["user", "admin", "superadmin"]),
    upload.single("coverImage"),
    updateUserCoverImage
  );

// Get user statistics
router.route("/statistics").get(verifyJWT, getUserStatistics);

// Note: Auth providers route removed - using email/password only authentication
// Note: Google OAuth link/unlink routes removed - using email/password only authentication

/**
 * Admin Routes
 * - Only accessible by admin or superadmin
 * - Enhanced logging for administrative actions
 */

// Get all users with pagination and filtering
router.route("/admin").get(
  verifyJWT, 
  verifyRole(["admin", "superadmin"]), 
  logAuthEvent('ADMIN_VIEW_USERS'),
  getAllUsers
);

// Get user analytics
router.route("/admin/analytics").get(
  verifyJWT, 
  verifyRole(["admin", "superadmin"]), 
  logAuthEvent('ADMIN_VIEW_ANALYTICS'),
  getUsersAnalytics
);

// Get detailed user information
router.route("/admin/:userId").get(
  verifyJWT, 
  verifyRole(["admin", "superadmin"]), 
  logAuthEvent('ADMIN_VIEW_USER_DETAILS'),
  getUserDetails
);

// Update user role (only superadmin can do this)
router.route("/admin/:userId/role").patch(
  verifyJWT, 
  csrfProtection,
  verifyRole(["superadmin"]), 
  logAuthEvent('ADMIN_UPDATE_USER_ROLE'),
  updateUserRole
);

// 🔥 ADMIN SECURITY ROUTES
router.route("/admin/:userId/unlock").post(
  verifyJWT,
  csrfProtection,
  verifyRole(["admin", "superadmin"]),
  logAuthEvent('ADMIN_UNLOCK_ACCOUNT'),
  unlockAccount
);

router.route("/admin/:userId/activity").get(
  verifyJWT,
  verifyRole(["admin", "superadmin"]),
  logAuthEvent('ADMIN_VIEW_USER_ACTIVITY'),
  getUserActivityLogs
);

/**
 * Security and Monitoring Routes
 * - For debugging and monitoring authentication system
 */

// Get authentication system status (admin only)
router.route("/auth/status").get(
  verifyJWT,
  verifyRole(["admin", "superadmin"]),
  (req, res) => {
    // Import here to avoid circular dependencies
    const { tokenBlacklist } = require("../utils/tokenBlacklist.js");
    const { rateLimiter } = require("../utils/rateLimiter.js");
    
    res.json({
      success: true,
      data: {
        tokenBlacklist: tokenBlacklist.getStats(),
        rateLimiter: rateLimiter.getStats(),
        timestamp: new Date().toISOString(),
      },
      message: "Authentication system status"
    });
  }
);

// Health check endpoint (public - no auth required)
router.route("/health/auth").get((req, res) => {
  try {
    // Import here to avoid circular dependencies
    const mongoose = require('mongoose');
    const { tokenBlacklist } = require("../utils/tokenBlacklist.js");
    const { rateLimiter } = require("../utils/rateLimiter.js");
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        },
        tokenBlacklist: {
          status: 'operational',
          stats: tokenBlacklist.getStats()
        },
        rateLimiter: {
          status: 'operational',
          stats: rateLimiter.getStats()
        }
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    // Determine overall health status
    const isHealthy = health.services.database.status === 'connected';
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
