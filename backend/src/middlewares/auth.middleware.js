import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

/**
 * verifyJWT
 *  - Reads the token from cookies, Authorization header, or request body
 *  - Verifies it and attaches user to req.user
 *  - Throws 401 Unauthorized if invalid
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1. Get token from multiple possible sources for maximum compatibility
    const token = 
      req.cookies?.accessToken || 
      req.header("Authorization")?.replace("Bearer ", "") || 
      req.body?.accessToken || 
      req.query?.accessToken;

    if (!token) {
      throw new ApiError(401, "Unauthorized request. No access token found.");
    }

    // 2. Verify and decode the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. Fetch user from DB to ensure the user still exists
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "Invalid Access Token. User not found.");
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Handle common JWT errors with clearer messages
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, "Invalid access token.");
    } else if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, "Access token expired.");
    } else if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(401, "Authentication failed. Please login again.");
    }
  }
});

/**
 * verifyRole(rolesArray)
 *  - Checks if req.user has any of the allowed roles provided in the array
 *  - If not, throws 403 Forbidden
 */
export const verifyRole = (allowedRoles) => {
  // Ensure allowedRoles is always an array, even if a single role string is passed accidentally
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return asyncHandler((req, res, next) => {
    console.log(`🛂 Verifying role for path: ${req.originalUrl}`);
    if (!req.user) {
      console.error("❌ Role verification failed: No user attached to request.");
      throw new ApiError(401, "Unauthorized: No user attached to request.");
    }

    const userRole = req.user.role;
    console.log(`🧑 User role found: '${userRole}'`);
    console.log(`🔑 Allowed roles: ${rolesArray.join(', ')}`);
    
    if (!userRole || !rolesArray.includes(userRole)) {
      console.error(`🚫 Role verification failed: User role '${userRole}' is not in allowed roles [${rolesArray.join(', ')}].`);
      throw new ApiError(403, "Forbidden: You do not have the required permissions.");
    }

    console.log("✅ Role verification successful.");
    next();
  });
};
