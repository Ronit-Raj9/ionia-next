import jwt from 'jsonwebtoken';
import { LMSUser } from '../models/lmsUser.model.js';
import { ApiError } from '../utils/ApiError.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new ApiError(401, 'Access token is required');
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Find user and check if still active
    const user = await LMSUser.findById(decoded.userId).select('-password -refreshToken');
    
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'User account is deactivated');
    }

    if (user.isBlocked) {
      throw new ApiError(401, 'User account is blocked');
    }

    // Update last activity
    user.lastActivity = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired'));
    } else {
      next(error);
    }
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireStudent = requireRole('student');
export const requireInstructor = requireRole('instructor');

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await LMSUser.findById(decoded.userId).select('-password -refreshToken');
      
      if (user && user.isActive && !user.isBlocked) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};
