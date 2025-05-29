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
  getUsersAnalytics
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyRole, logAuthEvent } from "../middlewares/auth.middleware.js";
import { createRateLimitMiddleware } from "../utils/rateLimiter.js";

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

/**
 * Protected Routes (Must be Authenticated)
 * - Requires verifyJWT to ensure the user is logged in
 * - Some routes have additional rate limiting for security
 */

// Logout with logging
router.route("/logout").post(
  verifyJWT, 
  logAuthEvent('LOGOUT'),
  logoutUser
);

// Logout from all devices
router.route("/logout-all").post(
  verifyJWT,
  logAuthEvent('LOGOUT_ALL_DEVICES'),
  logoutFromAllDevices
);

// Token refresh with rate limiting
router.route("/refresh-token").post(
  createRateLimitMiddleware('refresh-token'),
  refreshAccessToken
);

// Password change with rate limiting
router.route("/change-password").post(
  verifyJWT,
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
  verifyRole(["user", "admin", "superadmin"]), 
  updateAccountDetails
);

// Update avatar
router.route("/avatar").patch(
    verifyJWT,
  verifyRole(["user", "admin", "superadmin"]),
    upload.single("avatar"),
    updateUserAvatar
  );

// Update cover image
router.route("/cover-image").patch(
    verifyJWT,
  verifyRole(["user", "admin", "superadmin"]),
    upload.single("coverImage"),
    updateUserCoverImage
  );

// Get user statistics
router.route("/statistics").get(verifyJWT, getUserStatistics);

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
  verifyRole(["superadmin"]), 
  logAuthEvent('ADMIN_UPDATE_USER_ROLE'),
  updateUserRole
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

export default router;
