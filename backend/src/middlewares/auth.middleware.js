import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

/**
 * verifyJWT
 *  - Reads the token from cookies or Authorization header
 *  - Verifies it and attaches user to req.user
 *  - Throws 401 Unauthorized if invalid
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  // 1. Get token from cookies or Bearer scheme in headers
  const token =
    req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request. No access token found.");
  }

  // 2. Verify and decode the token
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token.");
  }

  // 3. Fetch user from DB to ensure the user still exists
  const user = await User.findById(decodedToken._id).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(401, "Invalid Access Token. User not found.");
  }

  // 4. Attach user to request
  req.user = user;
  next();
});

/**
 * verifyRole(...roles)
 *  - Checks if req.user has any of the allowed roles
 *  - If not, throws 403 Forbidden
 */
export const verifyRole = (...allowedRoles) => {
  return asyncHandler((req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized: No user attached to request.");
    }

    // user.role must exist on the user model
    const userRole = req.user.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new ApiError(403, "Forbidden: You do not have the required permissions.");
    }

    next();
  });
};
