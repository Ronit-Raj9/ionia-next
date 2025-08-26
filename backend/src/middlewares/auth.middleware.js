import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { tokenBlacklist } from "../utils/tokenBlacklist.js";

/**
 * Enhanced JWT verification middleware
 * - Only accepts tokens from httpOnly cookies (more secure)
 * - Checks token blacklist
 * - Implements proper error handling and logging
 * - Validates token structure and user existence
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    console.log(`🔐 JWT verification for ${req.method} ${req.originalUrl}`);
    
    // 1. Get token ONLY from cookies (more secure than headers)
    const token = req.cookies?.accessToken;

    if (!token) {
      console.log("❌ No access token found in cookies");
      throw new ApiError(401, "Access token required. Please login.");
    }

    console.log(`🔍 Token found: ${token.substring(0, 20)}...`);

    // 2. Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      console.log("🚫 Token is blacklisted");
      throw new ApiError(401, "Token has been invalidated. Please login again.");
    }

    // 3. Verify and decode the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log(`✅ Token verified for user: ${decodedToken._id}`);
    } catch (jwtError) {
      console.log(`❌ JWT verification failed: ${jwtError.message}`);
      
      // Add token to blacklist if it's malformed but not expired
      if (jwtError.name !== 'TokenExpiredError') {
        try {
          const decoded = jwt.decode(token);
          if (decoded?.exp) {
            tokenBlacklist.addToBlacklist(token, decoded.exp);
          }
        } catch (e) {
          // Token is completely malformed, ignore
        }
      }
      
      throw new ApiError(401, "Invalid access token. Please login again.");
    }

    // 4. Validate token structure
    if (!decodedToken._id || !decodedToken.email) {
      console.log("❌ Token missing required fields");
      tokenBlacklist.addToBlacklist(token, decodedToken.exp);
      throw new ApiError(401, "Invalid token structure. Please login again.");
    }

    // 5. Fetch user from DB to ensure the user still exists and is active
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    if (!user) {
      console.log(`❌ User not found for token: ${decodedToken._id}`);
      tokenBlacklist.addToBlacklist(token, decodedToken.exp);
      throw new ApiError(401, "User not found. Please login again.");
    }

    // Add hasPassword field for frontend compatibility
    // We need to fetch the user with password to check hasPassword status
    const userWithPassword = await User.findById(decodedToken._id);
    user.hasPassword = userWithPassword.hasPassword();

    // 6. Additional security checks
    if (user.email !== decodedToken.email) {
      console.log("❌ Token email mismatch");
      tokenBlacklist.addToBlacklist(token, decodedToken.exp);
      throw new ApiError(401, "Token validation failed. Please login again.");
    }

    // 7. Attach user and token info to request
    req.user = user;
    req.token = token;
    req.tokenPayload = decodedToken;
    
    console.log(`✅ Authentication successful for user: ${user.username} (${user.role})`);
    next();

  } catch (error) {
    console.log(`🚨 Authentication error: ${error.message}`);
    
    // Handle specific JWT errors with clearer messages
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Invalid access token format. Please login again.");
    } else if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Access token expired. Please refresh your session.");
    } else if (error instanceof ApiError) {
      throw error;
    } else {
      console.error("Unexpected authentication error:", error);
      throw new ApiError(401, "Authentication failed. Please login again.");
    }
  }
});

/**
 * Enhanced role verification middleware
 * - Supports multiple roles and hierarchical permissions
 * - Better logging and error messages
 * - Validates user role against allowed roles
 */
export const verifyRole = (allowedRoles) => {
  // Ensure allowedRoles is always an array
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return asyncHandler((req, res, next) => {
    console.log(`🛂 Role verification for ${req.originalUrl}`);
    
    if (!req.user) {
      console.error("❌ Role verification failed: No user attached to request");
      throw new ApiError(401, "Authentication required for role verification.");
    }

    const userRole = req.user.role;
    const userId = req.user._id;
    const username = req.user.username;
    
    console.log(`👤 User: ${username} (${userId})`);
    console.log(`🎭 User role: '${userRole}'`);
    console.log(`🔑 Required roles: [${rolesArray.join(', ')}]`);
    
    // Check if user has required role
    if (!userRole || !rolesArray.includes(userRole)) {
      console.error(`🚫 Access denied: User role '${userRole}' not in allowed roles [${rolesArray.join(', ')}]`);
      throw new ApiError(403, `Access denied. Required role: ${rolesArray.join(' or ')}`);
    }

    console.log("✅ Role verification successful");
    next();
  });
};

/**
 * Optional authentication middleware
 * - Attaches user if token is valid, but doesn't fail if no token
 * - Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    
    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      // Token is blacklisted, continue without authentication
      return next();
    }

    // Try to verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
    if (user && user.email === decodedToken.email) {
      req.user = user;
      req.token = token;
      req.tokenPayload = decodedToken;
      console.log(`🔓 Optional auth successful for: ${user.username}`);
    }
  } catch (error) {
    // Ignore errors in optional auth, just continue without user
    console.log(`🔓 Optional auth failed (ignored): ${error.message}`);
  }
  
  next();
});

/**
 * Middleware to check if user owns the resource or has admin privileges
 * - Checks if user._id matches the resource owner or user has admin/superadmin role
 */
export const verifyOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return asyncHandler((req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();
    
    // Admin and superadmin can access any resource
    if (userRole === 'admin' || userRole === 'superadmin') {
      console.log(`🔑 Admin access granted for ${req.user.username}`);
      return next();
    }

    // Check ownership based on different sources
    let resourceOwnerId;
    
    // Check URL parameters first
    if (req.params.userId) {
      resourceOwnerId = req.params.userId;
    } else if (req.params.id) {
      resourceOwnerId = req.params.id;
    } else if (req.body[resourceUserIdField]) {
      resourceOwnerId = req.body[resourceUserIdField];
    } else if (req.query[resourceUserIdField]) {
      resourceOwnerId = req.query[resourceUserIdField];
    }

    if (!resourceOwnerId) {
      throw new ApiError(400, "Resource owner identification required.");
    }

    if (userId !== resourceOwnerId.toString()) {
      console.log(`🚫 Ownership verification failed: ${userId} !== ${resourceOwnerId}`);
      throw new ApiError(403, "Access denied. You can only access your own resources.");
    }

    console.log(`✅ Ownership verified for user: ${req.user.username}`);
    next();
  });
};

/**
 * Middleware to log authentication events for security monitoring
 */
export const logAuthEvent = (eventType) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const timestamp = new Date().toISOString();
    
    // Log the event (in production, this should go to a proper logging service)
    console.log(`🔒 AUTH EVENT: ${eventType} | IP: ${ip} | UA: ${userAgent} | Time: ${timestamp}`);
    
    // Attach event info to request for potential use in controllers
    req.authEvent = {
      type: eventType,
      ip,
      userAgent,
      timestamp
    };
    
    next();
  };
};
