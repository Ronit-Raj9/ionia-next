import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { LMSUser } from '../models/lmsUser.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { rateLimiter } from '../utils/rateLimiter.js';
import { Logger } from '../middlewares/error.middleware.js';

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Set secure cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    domain: process.env.COOKIE_DOMAIN || 'localhost'
  };
  
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Register user
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, fullName, username, role = 'student' } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Rate limiting
    if (!rateLimiter.isAllowed(clientIP, 'register')) {
      throw new ApiError(429, 'Too many registration attempts. Please try again later.');
    }
    
    // Check if user already exists
    const existingUser = await LMSUser.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ApiError(400, 'Email already registered');
      } else {
        throw new ApiError(400, 'Username already taken');
      }
    }
    
    // Create new user
    const user = new LMSUser({
      email,
      password,
      fullName,
      username,
      role,
      lastLoginIP: clientIP
    });
    
    // Generate student ID for students
    if (role === 'student') {
      user.generateStudentId();
    }
    
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Update user with refresh token
    user.refreshToken = refreshToken;
    await user.save();
    
    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);
    
    // Log registration
    Logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: clientIP
    });
    
    res.status(201).json(
      new ApiResponse(
        201,
        {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            username: user.username,
            role: user.role,
            studentId: user.studentId,
            isEmailVerified: user.isEmailVerified
          },
          accessToken,
          refreshToken
        },
        'User registered successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Login user
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Rate limiting
    if (!rateLimiter.isAllowed(clientIP, 'login')) {
      throw new ApiError(429, 'Too many login attempts. Please try again later.');
    }
    
    // Find user
    const user = await LMSUser.findOne({ email }).select('+password');
    
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(401, 'Account is deactivated');
    }
    
    if (user.isBlocked) {
      throw new ApiError(401, 'Account is blocked');
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }
    
    // Update login information
    user.lastLoginAt = new Date();
    user.lastLoginIP = clientIP;
    user.lastActivity = new Date();
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    
    await user.save();
    
    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);
    
    // Log login
    Logger.info('User logged in successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: clientIP
    });
    
    res.json(
      new ApiResponse(
        200,
        {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            username: user.username,
            role: user.role,
            avatar: user.avatar,
            studentId: user.studentId,
            grade: user.grade,
            subjects: user.subjects,
            isEmailVerified: user.isEmailVerified,
            totalQuestionsAttempted: user.totalQuestionsAttempted,
            totalQuestionsCorrect: user.totalQuestionsCorrect,
            averageScore: user.averageScore,
            learningStreak: user.learningStreak,
            accuracyPercentage: user.accuracyPercentage
          },
          accessToken,
          refreshToken
        },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Logout user
export const logoutUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Clear refresh token
    await LMSUser.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 }
    });
    
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    // Log logout
    Logger.info('User logged out successfully', {
      userId,
      email: req.user.email
    });
    
    res.json(
      new ApiResponse(200, null, 'Logout successful')
    );
  } catch (error) {
    next(error);
  }
};

// Refresh access token
export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token is required');
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find user
    const user = await LMSUser.findById(decoded.userId);
    
    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }
    
    if (!user.isActive) {
      throw new ApiError(401, 'Account is deactivated');
    }
    
    if (user.isBlocked) {
      throw new ApiError(401, 'Account is blocked');
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Update refresh token
    user.refreshToken = newRefreshToken;
    user.lastActivity = new Date();
    await user.save();
    
    // Set new cookies
    setTokenCookies(res, accessToken, newRefreshToken);
    
    res.json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken: newRefreshToken
        },
        'Token refreshed successfully'
      )
    );
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Invalid refresh token'));
    } else {
      next(error);
    }
  }
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await LMSUser.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists or not
      return res.json(
        new ApiResponse(200, null, 'If the email exists, a reset link has been sent')
      );
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();
    
    // TODO: Send email with reset link
    // For now, just log the token (in production, send email)
    Logger.info('Password reset token generated', {
      userId: user._id,
      email: user.email,
      resetToken // Remove this in production
    });
    
    res.json(
      new ApiResponse(200, null, 'If the email exists, a reset link has been sent')
    );
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    const user = await LMSUser.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }
    
    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    // Log password reset
    Logger.info('Password reset successfully', {
      userId: user._id,
      email: user.email
    });
    
    res.json(
      new ApiResponse(200, null, 'Password reset successfully')
    );
  } catch (error) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    const user = await LMSUser.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });
    
    if (!user) {
      throw new ApiError(400, 'Invalid or expired verification token');
    }
    
    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    // Log email verification
    Logger.info('Email verified successfully', {
      userId: user._id,
      email: user.email
    });
    
    res.json(
      new ApiResponse(200, null, 'Email verified successfully')
    );
  } catch (error) {
    next(error);
  }
};
