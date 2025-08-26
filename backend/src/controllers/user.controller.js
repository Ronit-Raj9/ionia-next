import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { AttemptedTest } from "../models/attemptedTest.model.js";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService.js";
import { tokenBlacklist } from "../utils/tokenBlacklist.js";
import { 
  getAccessTokenCookieOptions, 
  getRefreshTokenCookieOptions, 
  getClearCookieOptions,
  getClearRefreshCookieOptions 
} from "../utils/cookieConfig.js";
import { AuditLogger } from "../utils/auditLogger.js";
import passport from "passport";

/**
 * Enhanced helper function to generate both Access Token and Refresh Token
 * with proper session tracking and security
 */
const generateAccessAndRefreshToken = async (userId, req) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Get client information for token tracking
    const clientInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
    };

    // Clean up expired tokens first
    await user.cleanupExpiredTokens();

    // Generate new tokens with client info
    const accessToken = user.generateAccessToken(clientInfo);
    const refreshToken = user.generateRefreshToken(clientInfo);

    // Store refresh token in user record (for backward compatibility)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Store refresh token in blacklist manager for tracking
    const decoded = jwt.decode(refreshToken);
    tokenBlacklist.storeRefreshToken(userId.toString(), refreshToken, decoded.exp);

    console.log(`🔐 Tokens generated for user: ${user.username}`);
    console.log(`📊 Active sessions: ${user.getActiveSessionsCount()}`);

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

/**
 * Enhanced registerUser with security improvements
 * - Rate limiting applied via middleware
 * - Input validation and sanitization
 * - Secure password handling
 * - Proper error handling
 */
const registerUser = asyncHandler(async (req, res) => {
  console.log("🔐 User registration attempt");
  
  // 1. Destructure and validate user details
  const { fullName, email, username, password } = req.body;

  // Enhanced validation
  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields (fullName, email, username, password) are required");
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  // Username validation (alphanumeric + underscore, 3-20 chars)
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    throw new ApiError(400, "Username must be 3-20 characters and contain only letters, numbers, and underscores");
  }

  // Password strength validation
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  // 2. Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  
  if (existedUser) {
    // Record failed attempt for rate limiting
    if (req.rateLimiter && req.rateLimiterIdentifier) {
      req.rateLimiter.recordFailedAttempt(req.rateLimiterIdentifier, 'register');
    }
    throw new ApiError(409, "User with this email or username already exists");
  }

  // 3. Handle file uploads
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let coverImageLocalPath;
  if (req.files?.coverImage?.[0]?.path) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // 4. Create user with enhanced security
  const user = await User.create({
    fullName: fullName.trim(),
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
    email: email.toLowerCase().trim(),
    password,
    username: username.toLowerCase().trim(),
    lastLoginIP: req.ip || req.connection.remoteAddress,
    isEmailVerified: false, // Require email verification in production
    authProviders: [{ provider: 'email', linkedAt: new Date(), isActive: true }]
  });

  // 5. Return user without sensitive data
  const createdUser = await User.findById(user._id).select("-password -refreshToken -activeTokens");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Record successful attempt
  if (req.rateLimiter && req.rateLimiterIdentifier) {
    req.rateLimiter.recordSuccessfulAttempt(req.rateLimiterIdentifier, 'register');
  }

  // Log successful registration
  await AuditLogger.logAuthEvent('register', req, createdUser, {
    authMethod: 'email',
    emailVerified: false
  }, true);

  console.log(`✅ User registered successfully: ${createdUser.username}`);
  
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

/**
 * Enhanced loginUser with comprehensive security
 * - Rate limiting
 * - Session management
 * - Secure cookie handling
 * - Account lockout
 * - Audit logging
 */
const loginUser = asyncHandler(async (req, res) => {
  console.log("🔐 Login attempt");
  
  const { email, username, password, rememberMe } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;

  console.log("req.body", req.body);

  // Validation
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // Find user
  const user = await User.findOne({
    $or: [{ username: username?.toLowerCase() }, { email: email?.toLowerCase() }],
  });

  if (!user) {
    // Record failed attempt
    if (req.rateLimiter && req.rateLimiterIdentifier) {
      req.rateLimiter.recordFailedAttempt(req.rateLimiterIdentifier, 'login');
    }
    
    // Log failed login attempt
    await AuditLogger.logLoginFailure(req, email || username, 'User not found', 'email');
    
    throw new ApiError(404, "Invalid credentials");
  }

  // Check if account is active
  if (!user.isActive) {
    await AuditLogger.logLoginFailure(req, user.email, 'Account deactivated', 'email');
    throw new ApiError(403, "Account has been deactivated. Please contact support.");
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    await AuditLogger.logSecurityEvent('account_locked', req, user, {
      reason: 'Account locked due to failed attempts',
      lockUntil: user.failedLoginAttempts.lockedUntil
    });
    throw new ApiError(423, "Account is temporarily locked due to multiple failed login attempts. Please try again later.");
  }

  // Verify password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    // Record failed attempt
    await user.recordFailedLoginAttempt();
    
    // Record failed attempt for rate limiting
    if (req.rateLimiter && req.rateLimiterIdentifier) {
      req.rateLimiter.recordFailedAttempt(req.rateLimiterIdentifier, 'login');
    }
    
    // Log failed login attempt
    await AuditLogger.logLoginFailure(req, user.email, 'Invalid password', 'email');
    
    throw new ApiError(401, "Invalid credentials");
  }

  // Reset failed login attempts on successful login
  if (user.failedLoginAttempts.count > 0) {
    await user.resetFailedLoginAttempts();
  }

  // Update login tracking
  user.lastLoginAt = new Date();
  user.lastLoginIP = clientIP;
  user.lastActivity = new Date();
  user.lastLoginMethod = 'email';
  await user.save({ validateBeforeSave: false });

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id, req);

  // Get user data without sensitive fields
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -activeTokens"
  );

  // Add hasPassword field for frontend compatibility
  loggedInUser.hasPassword = user.hasPassword();

  // Record successful attempt
  if (req.rateLimiter && req.rateLimiterIdentifier) {
    req.rateLimiter.recordSuccessfulAttempt(req.rateLimiterIdentifier, 'login');
  }

  // Log successful login
  await AuditLogger.logLoginSuccess(req, user, 'email');

  console.log(`✅ Login successful for user: ${user.username} from IP: ${clientIP}`);

  // Set secure cookies with rememberMe support
  console.log("accessToken", accessToken);
  console.log("refreshToken", refreshToken);
  console.log("rememberMe", rememberMe);
  
  // Get cookie options with rememberMe consideration
  const accessTokenOptions = getAccessTokenCookieOptions();
  const refreshTokenOptions = getRefreshTokenCookieOptions(rememberMe);
  
  return res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          sessionInfo: {
            loginTime: user.lastLoginAt,
            activeSessions: user.getActiveSessionsCount(),
            rememberMe: !!rememberMe,
          }
        },
        "User logged in successfully"
      )
    );
});

/**
 * Enhanced logoutUser with proper token invalidation
 * - Blacklists current access token
 * - Invalidates refresh token
 * - Clears cookies securely
 * - Updates session tracking
 */
const logoutUser = asyncHandler(async (req, res) => {
  console.log(`🔐 Logout request for user: ${req.user.username}`);

  try {
    const userId = req.user._id;
    const currentToken = req.token;
    const tokenPayload = req.tokenPayload;

    // 1. Blacklist the current access token
    if (currentToken && tokenPayload?.exp) {
      tokenBlacklist.addToBlacklist(currentToken, tokenPayload.exp);
    }

    // 2. Invalidate the specific refresh token if provided
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken);
        if (decoded?.jti) {
          // Remove from user's active tokens
          await req.user.invalidateToken(decoded.jti);
          // Remove from blacklist manager
          tokenBlacklist.invalidateRefreshToken(userId.toString(), refreshToken);
        }
      } catch (error) {
        console.log("Error invalidating refresh token:", error.message);
      }
    }

    // 3. Update user record
  await User.findByIdAndUpdate(
      userId,
    {
        $unset: { refreshToken: 1 },
        $set: { lastActivity: new Date() }
    },
      { new: true }
  );

    console.log(`✅ Logout successful for user: ${req.user.username}`);

    // 4. Clear cookies
  return res
    .status(200)
      .cookie("accessToken", "", getClearCookieOptions())
      .cookie("refreshToken", "", getClearRefreshCookieOptions())
      .json(new ApiResponse(200, {}, "User logged out successfully"));

  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's an error, clear the cookies
    return res
      .status(200)
      .cookie("accessToken", "", getClearCookieOptions())
      .cookie("refreshToken", "", getClearRefreshCookieOptions())
      .json(new ApiResponse(200, {}, "User logged out"));
  }
});

/**
 * Enhanced refreshAccessToken with security improvements
 * - Validates refresh token from cookies only
 * - Implements token rotation
 * - Tracks sessions properly
 * - Rate limiting protection
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  console.log("🔄 Token refresh request");

  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  try {
    // 1. Verify refresh token
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // 2. Find user and validate token
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token - user not found");
    }

    // 3. Check if refresh token exists in user's active tokens
    const tokenExists = user.activeTokens.some(token => 
      token.jti === decodedToken.jti && token.type === 'refresh'
    );

    if (!tokenExists) {
      throw new ApiError(401, "Refresh token has been invalidated");
    }

    // 4. Check if token is blacklisted
    if (!tokenBlacklist.isRefreshTokenValid(user._id.toString(), incomingRefreshToken)) {
      throw new ApiError(401, "Refresh token has been invalidated");
    }

    // 5. Generate new tokens (token rotation)
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id, req);

    // 6. Invalidate old refresh token
    await user.invalidateToken(decodedToken.jti);
    tokenBlacklist.invalidateRefreshToken(user._id.toString(), incomingRefreshToken);

    // 7. Update user activity
    user.lastActivity = new Date();
    await user.save({ validateBeforeSave: false });

    console.log(`✅ Token refreshed for user: ${user.username}`);

    // 8. Return new tokens
    return res
      .status(200)
      .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
      .cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions())
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );

  } catch (error) {
    console.error("Token refresh error:", error);
    
    // Clear invalid cookies
    res.cookie("accessToken", "", getClearCookieOptions());
    res.cookie("refreshToken", "", getClearRefreshCookieOptions());
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(401, "Invalid refresh token");
  }
});

/**
 * Enhanced logoutFromAllDevices
 * - Invalidates all user sessions
 * - Blacklists all active tokens
 * - Clears current device cookies
 */
const logoutFromAllDevices = asyncHandler(async (req, res) => {
  console.log(`🔐 Logout from all devices for user: ${req.user.username}`);

  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 1. Blacklist all active access tokens
    const now = Math.floor(Date.now() / 1000);
    for (const tokenData of user.activeTokens) {
      if (tokenData.type === 'access' && tokenData.expiresAt > new Date()) {
        // Calculate expiry time for blacklisting
        const expiryTime = Math.floor(tokenData.expiresAt.getTime() / 1000);
        tokenBlacklist.addToBlacklist(`token_${tokenData.jti}`, expiryTime);
      }
    }

    // 2. Invalidate all refresh tokens
    tokenBlacklist.invalidateAllRefreshTokens(userId.toString());

    // 3. Clear all tokens from user record
    await user.invalidateAllTokens();

    console.log(`✅ All sessions invalidated for user: ${req.user.username}`);

    // 4. Clear current device cookies
    return res
      .status(200)
      .cookie("accessToken", "", getClearCookieOptions())
      .cookie("refreshToken", "", getClearRefreshCookieOptions())
      .json(new ApiResponse(200, {}, "Logged out from all devices successfully"));

  } catch (error) {
    console.error("Logout from all devices error:", error);
    throw new ApiError(500, "Failed to logout from all devices");
  }
});

/**
 * changeCurrentPassword
 * 1. Checks oldPassword, newPassword, confirmPassword
 * 2. Ensures oldPassword is correct for the user
 * 3. Sets new password
 * 4. Saves and returns success message
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!(newPassword === confirmPassword)) {
    throw new ApiError(400, "Confirm password did not match");
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * getCurrrentUser
 * - Returns the user from req.user set by verifyJWT
 */
const getCurrrentUser = asyncHandler(async (req, res) => {
  const user = req.user.toObject();
  user.hasPassword = req.user.hasPassword(); // Use the method instead of manual check
  return res
    .status(200)
    .json(new ApiResponse(200, user, "current user fetched successfully"));
});

/**
 * updateAccountDetails
 * - Updates certain fields (fullName, email) for the authenticated user
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true } // if we write new then object is returned after updating
  ).select("-password");

  // Add hasPassword field for frontend compatibility
  user.hasPassword = req.user.hasPassword();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

/**
 * updateUserAvatar
 * - Replaces the authenticated user's avatar image with a new one
 * - Uploads the file to Cloudinary
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  console.log("req.file", req.file);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // TODO: delete old image -- assignment
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  // Add hasPassword field for frontend compatibility
  user.hasPassword = req.user.hasPassword();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

/**
 * updateUserCoverImage
 * - Replaces the authenticated user's coverImage with a new one
 * - Uploads the file to Cloudinary
 */
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  console.log("req.file: " + req.file);

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  // Add hasPassword field for frontend compatibility
  user.hasPassword = req.user.hasPassword();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

/**
 * getUserStatistics
 * - Returns user statistics
 */
const getUserStatistics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  try {
    // Get all attempted tests for this user
    const attemptedTests = await AttemptedTest.find({ userId });
    
    // Calculate statistics
    const totalTests = attemptedTests.length;
    
    // Calculate average score
    const totalScore = attemptedTests.reduce((sum, test) => {
      const correctAnswers = test.totalCorrectAnswers || 0;
      const totalQuestions = test.metadata?.totalQuestions || 1;
      const score = (correctAnswers / totalQuestions) * 100;
      return sum + score;
    }, 0);
    const averageScore = totalTests > 0 ? totalScore / totalTests : 0;
    
    // Calculate tests taken this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const testsThisWeek = attemptedTests.filter(test => 
      new Date(test.createdAt) >= oneWeekAgo
    ).length;
    
    // Calculate overall accuracy
    const totalCorrect = attemptedTests.reduce((sum, test) => sum + (test.totalCorrectAnswers || 0), 0);
    const totalAnswered = attemptedTests.reduce((sum, test) => {
      return sum + ((test.totalCorrectAnswers || 0) + (test.totalWrongAnswers || 0));
    }, 0);
    const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    
    // Return the statistics
    return res.status(200).json(
      new ApiResponse(200, {
        totalTests,
        averageScore,
        testsThisWeek,
        accuracy
      }, "User statistics fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching user statistics", error.message);
  }
});

/**
 * checkUsername
 * - Checks if a username is available (not taken by another user)
 * - Returns success if available, error if already taken
 */
const checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.body;
  
  // Validate input
  if (!username || username.trim() === "") {
    throw new ApiError(400, "Username is required");
  }
  
  // Format the username (lowercase) same way as we store it
  const formattedUsername = username.toLowerCase();
  
  // Check if username exists
  const existingUser = await User.findOne({ username: formattedUsername });
  
  if (existingUser) {
    return res
      .status(400)
      .json(new ApiResponse(400, {}, "Username already taken"));
  }
  
  // Username is available
  return res
    .status(200)
    .json(new ApiResponse(200, { available: true }, "Username is available"));
});

/**
 * forgotPassword
 * - Generates a password reset token and sends email with link
 */
const forgotPassword = asyncHandler(async (req, res) => {
  try {
    console.log("Received forgot password request:", req.body);
    const { email } = req.body;
    
    if (!email) {
      throw new ApiError(400, "Email is required");
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    console.log("User found:", user ? "Yes" : "No");
    
    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist,
      // but still return a success response
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "If your email is registered, you will receive a password reset link"));
    }
    
    // Generate a reset token (random bytes)
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash the token for security before storing it
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    // Set token expiry (10 minutes from now)
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    // Store the token in the user document
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL (frontend URL where user will be redirected)
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendURL}/auth/reset-password?token=${resetToken}`;
    
    console.log("Reset URL generated:", resetUrl);
    
    // Email content
    const subject = "Password Reset Request";
    const text = `You requested a password reset. Please use the following link to reset your password. This link is valid for 10 minutes: ${resetUrl}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #10b981; text-align: center;">Password Reset Request</h1>
        <p>Hello ${user.fullName || user.username},</p>
        <p>You requested a password reset for your Ionia account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>This link is valid for 10 minutes and can only be used once.</p>
        <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          &copy; ${new Date().getFullYear()} Ionia. All rights reserved.
        </p>
      </div>
    `;
    
    try {
      await sendEmail({
        email: user.email,
        subject,
        text,
        html
      });
      
      console.log("Password reset email sent successfully");
      
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset link sent to your email"));
        
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      
      // If email sending fails, reset the stored token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      throw new ApiError(500, "Error sending email, please try again later");
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    
    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Otherwise wrap it in an ApiError
    throw new ApiError(500, "An error occurred processing your request");
  }
});

/**
 * resetPassword
 * - Verifies the reset token and updates the password
 */
const resetPassword = asyncHandler(async (req, res) => {
  try {
    console.log("Received reset password request:", { ...req.body, password: "[REDACTED]" });
    const { token, password } = req.body;
    
    if (!token || !password) {
      throw new ApiError(400, "Token and new password are required");
    }
    
    // Hash the provided token to compare with stored hashed token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    console.log("Looking for user with token:", hashedToken);
    
    // Find user with this token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      console.log("Invalid or expired token");
      throw new ApiError(400, "Invalid or expired token");
    }
    
    console.log("User found with valid token, updating password");
    
    // Update password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    console.log("Password reset successful");
    
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password has been reset successfully"));
  } catch (error) {
    console.error("Reset password error:", error);
    
    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Otherwise wrap it in an ApiError
    throw new ApiError(500, "An error occurred resetting your password");
  }
});

/**
 * getAllUsers
 * - Get all users with pagination, filtering and sorting options
 * - Admin/Superadmin only
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search = "", 
    role = "", 
    sortBy = "createdAt", 
    sortOrder = "desc" 
  } = req.query;

  // Build query
  const query = {};
  
  // Add role filter if provided
  if (role) {
    query.role = role;
  }
  
  // Add search functionality
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }
  
  // Determine sort order
  const sort = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;
  
  // Pagination setup
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    select: "-password -refreshToken -resetPasswordToken -resetPasswordExpires",
    lean: true,
  };
  
  try {
    // Find users
    const users = await User.paginate(query, options);
    
    return res.status(200).json(
      new ApiResponse(200, users, "Users retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching users", error.message);
  }
});

/**
 * getUsersAnalytics
 * - Get analytics data about users
 * - Admin/Superadmin only
 */
const getUsersAnalytics = asyncHandler(async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format users by role for easier frontend consumption
    const roleCountObj = {
      user: 0,
      admin: 0,
      superadmin: 0
    };
    
    usersByRole.forEach(role => {
      if (role._id && roleCountObj.hasOwnProperty(role._id)) {
        roleCountObj[role._id] = role.count;
      }
    });
    
    // New users this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });
    
    // New users this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: oneMonthAgo }
    });
    
    // Recent signups (last 10)
    const recentSignups = await User.find()
      .select("fullName username email role createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    return res.status(200).json(
      new ApiResponse(200, {
        totalUsers,
        usersByRole: roleCountObj,
        newUsersThisWeek,
        newUsersThisMonth,
        recentSignups
      }, "User analytics fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching user analytics", error.message);
  }
});

/**
 * getUserDetails
 * - Get detailed information about a specific user
 * - Admin/Superadmin only
 */
const getUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  
  try {
    // Fetch basic user info with password to check hasPassword status
    const userWithPassword = await User.findById(userId);
    
    if (!userWithPassword) {
      throw new ApiError(404, "User not found");
    }
    
    // Fetch user without sensitive fields for response
    const user = await User.findById(userId)
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")
      .lean();
    
    // Add hasPassword field for frontend compatibility
    user.hasPassword = userWithPassword.hasPassword();
    
    // Fetch test statistics
    const testStats = await AttemptedTest.aggregate([
      { $match: { userId } },
      { $group: {
        _id: null,
        totalTests: { $sum: 1 },
        totalCorrect: { $sum: "$totalCorrectAnswers" },
        totalWrong: { $sum: "$totalWrongAnswers" },
      }}
    ]);
    
    // Calculate test statistics
    const userStats = testStats.length > 0 ? testStats[0] : {
      totalTests: 0,
      totalCorrect: 0,
      totalWrong: 0
    };
    
    // Calculate accuracy
    const totalAnswered = userStats.totalCorrect + userStats.totalWrong;
    const accuracy = totalAnswered > 0 
      ? (userStats.totalCorrect / totalAnswered) * 100 
      : 0;
    
    // Format and return combined data
    const userData = {
      ...user,
      stats: {
        testsCompleted: userStats.totalTests,
        accuracy: accuracy.toFixed(2),
        totalCorrect: userStats.totalCorrect,
        totalWrong: userStats.totalWrong,
      }
    };
    
    return res.status(200).json(
      new ApiResponse(200, userData, "User details fetched successfully")
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Error fetching user details", error.message);
  }
});

/**
 * updateUserRole
 * - Update a user's role (promote to admin or demote to user)
 * - Superadmin only
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  
  if (!role || !['user', 'admin'].includes(role)) {
    throw new ApiError(400, "Invalid role. Role must be 'user' or 'admin'");
  }
  
  try {
    // Prevent updating superadmin role
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    
    if (user.role === 'superadmin') {
      throw new ApiError(403, "Superadmin role cannot be changed");
    }
    
    // Update the role
    user.role = role;
    await user.save();
    
    // Return updated user without sensitive fields
    const updatedUser = await User.findById(userId)
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");
    
    // Add hasPassword field for frontend compatibility
    updatedUser.hasPassword = user.hasPassword();
    
    return res.status(200).json(
      new ApiResponse(200, updatedUser, `User role updated to ${role} successfully`)
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Error updating user role", error.message);
  }
});

// 🔥 GOOGLE OAUTH CONTROLLERS

/**
 * Google OAuth Login
 * Initiates Google OAuth flow
 */
const googleOAuthLogin = asyncHandler(async (req, res) => {
  console.log("🔐 Google OAuth login initiated");
  
  // Store return URL in session if provided
  if (req.query.returnUrl) {
    req.session.returnUrl = req.query.returnUrl;
  }
  
  // Authenticate with Google
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, (err) => {
    if (err) {
      console.error("Google OAuth error:", err);
      throw new ApiError(500, "Google OAuth authentication failed");
    }
  });
});

/**
 * Google OAuth Callback
 * Handles Google OAuth callback and creates JWT tokens
 */
const googleOAuthCallback = asyncHandler(async (req, res) => {
  console.log("🔄 Google OAuth callback received");
  
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        console.error("Google OAuth callback error:", err);
        await AuditLogger.logLoginFailure(req, 'unknown', err.message, 'google');
        throw new ApiError(500, "Google OAuth authentication failed");
      }
      
      if (!user) {
        await AuditLogger.logLoginFailure(req, 'unknown', 'No user returned from Google', 'google');
        throw new ApiError(401, "Google OAuth authentication failed");
      }
      
      // Check if account is locked
      if (user.isAccountLocked()) {
        await AuditLogger.logSecurityEvent('account_locked', req, user, {
          reason: 'Account locked due to failed attempts',
          lockUntil: user.failedLoginAttempts.lockedUntil
        });
        throw new ApiError(423, "Account is temporarily locked due to multiple failed login attempts. Please try again later.");
      }
      
      // Reset failed login attempts on successful login
      if (user.failedLoginAttempts.count > 0) {
        await user.resetFailedLoginAttempts();
      }
      
      // Update login tracking
      user.lastLoginAt = new Date();
      user.lastLoginIP = req.ip || req.connection.remoteAddress;
      user.lastActivity = new Date();
      user.lastLoginMethod = 'google';
      await user.save({ validateBeforeSave: false });
      
      // Generate tokens
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id, req);
      
      // Log successful Google OAuth login
      await AuditLogger.logGoogleOAuthEvent('google_oauth_login', req, user, {
        isNewUser: !user.createdAt || (Date.now() - user.createdAt.getTime()) < 60000
      });
      
      // Get user data without sensitive fields
      const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -activeTokens"
      );
      
      // Add hasPassword field for frontend compatibility
      loggedInUser.hasPassword = user.hasPassword();
      
      console.log(`✅ Google OAuth login successful for user: ${user.username}`);
      
      // Get return URL from session or use default
      const returnUrl = req.session?.returnUrl || '/dashboard';
      delete req.session?.returnUrl;
      
      // Set secure cookies
      const accessTokenOptions = getAccessTokenCookieOptions();
      const refreshTokenOptions = getRefreshTokenCookieOptions();
      
      return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(
          new ApiResponse(
            200,
            {
              user: loggedInUser,
              sessionInfo: {
                loginTime: user.lastLoginAt,
                activeSessions: user.getActiveSessionsCount(),
                authMethod: 'google',
                returnUrl
              }
            },
            "Google OAuth login successful"
          )
        );
        
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      
      // Ensure all errors are properly logged
      await AuditLogger.logLoginFailure(req, user?.email || 'unknown', error.message, 'google');
      
      // Redirect to frontend with error
      const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  })(req, res);
});

/**
 * Link Google Account
 * Links Google OAuth to existing email/password account
 */
const linkGoogleAccount = asyncHandler(async (req, res) => {
  console.log("🔗 Linking Google account for user:", req.user.username);
  
  const { googleToken } = req.body;
  
  if (!googleToken) {
    throw new ApiError(400, "Google token is required");
  }
  
  try {
    // Verify Google token and get profile
    const googleProfile = await verifyGoogleToken(googleToken);
    
    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({ googleId: googleProfile.id });
    if (existingGoogleUser && !existingGoogleUser._id.equals(req.user._id)) {
      throw new ApiError(409, "This Google account is already linked to another user");
    }
    
    // Link Google account to current user
    await req.user.linkGoogleAccount(googleProfile);
    
    // Log the linking event
    await AuditLogger.logGoogleOAuthEvent('google_oauth_link', req, req.user, {
      googleId: googleProfile.id,
      googleEmail: googleProfile.emails[0]?.value
    });
    
    console.log(`✅ Google account linked successfully for user: ${req.user.username}`);
    
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Google account linked successfully"));
      
  } catch (error) {
    console.error("Google account linking error:", error);
    throw new ApiError(500, "Failed to link Google account");
  }
});

/**
 * Unlink Google Account
 * Unlinks Google OAuth from account (requires password to be set)
 */
const unlinkGoogleAccount = asyncHandler(async (req, res) => {
  console.log("🔗 Unlinking Google account for user:", req.user.username);
  
  try {
    await req.user.unlinkGoogleAccount();
    
    // Log the unlinking event
    await AuditLogger.logGoogleOAuthEvent('google_oauth_unlink', req, req.user);
    
    console.log(`✅ Google account unlinked successfully for user: ${req.user.username}`);
    
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Google account unlinked successfully"));
      
  } catch (error) {
    console.error("Google account unlinking error:", error);
    throw new ApiError(400, error.message);
  }
});

/**
 * Get Auth Providers
 * Returns the authentication providers linked to the user's account
 */
const getAuthProviders = asyncHandler(async (req, res) => {
  const providers = req.user.getAuthProviders();
  
  return res
    .status(200)
    .json(new ApiResponse(200, { providers }, "Auth providers retrieved successfully"));
});

// 🔥 EMAIL VERIFICATION CONTROLLERS

/**
 * Send Email Verification
 * Sends verification email to user
 */
const sendEmailVerification = asyncHandler(async (req, res) => {
  console.log("📧 Sending email verification for user:", req.user.username);
  
  // Check if email is already verified
  if (req.user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }
  
  // Check if user is blocked from verification attempts
  if (req.user.isEmailVerificationBlocked()) {
    throw new ApiError(429, "Too many verification attempts. Please try again later.");
  }
  
  try {
    // Generate verification token
    const verificationToken = req.user.generateEmailVerificationToken();
    await req.user.save({ validateBeforeSave: false });
    
    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    // Send verification email
    await sendEmail({
      email: req.user.email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${req.user.fullName},</p>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
            Verify Email
          </a>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 4px;">
            ${verificationUrl}
          </p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      `
    });
    
    // Log the verification email sent
    await AuditLogger.logEmailVerificationEvent('email_verification_sent', req, req.user);
    
    console.log(`✅ Email verification sent to: ${req.user.email}`);
    
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Verification email sent successfully"));
      
  } catch (error) {
    console.error("Email verification error:", error);
    throw new ApiError(500, "Failed to send verification email");
  }
});

/**
 * Verify Email
 * Verifies user's email address using token
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }
  
  try {
    // Find user by verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });
    
    if (!user) {
      // Increment failed attempts
      if (req.user) {
        await req.user.incrementEmailVerificationAttempts();
      }
      
      throw new ApiError(400, "Invalid or expired verification token");
    }
    
    // Verify the email
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.resetEmailVerificationAttempts();
    await user.save({ validateBeforeSave: false });
    
    // Log successful verification
    await AuditLogger.logEmailVerificationEvent('email_verification_success', req, user);
    
    console.log(`✅ Email verified successfully for user: ${user.username}`);
    
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Email verified successfully"));
      
  } catch (error) {
    console.error("Email verification error:", error);
    throw new ApiError(400, error.message);
  }
});

// 🔥 ACCOUNT SECURITY CONTROLLERS

/**
 * Unlock Account (Admin Only)
 * Unlocks a user account that was locked due to failed login attempts
 */
const unlockAccount = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    
    // Reset failed login attempts
    await user.resetFailedLoginAttempts();
    
    // Log the unlock action
    await AuditLogger.logAdminAction('account_unlocked', req, req.user, user);
    
    console.log(`✅ Account unlocked for user: ${user.username} by admin: ${req.user.username}`);
    
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Account unlocked successfully"));
      
  } catch (error) {
    console.error("Account unlock error:", error);
    throw new ApiError(500, "Failed to unlock account");
  }
});

/**
 * Get User Activity Logs (Admin Only)
 * Returns audit logs for a specific user
 */
const getUserActivityLogs = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;
  
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  
  try {
    const logs = await AuditLogger.getUserActivity(userId, parseInt(limit));
    
    return res
      .status(200)
      .json(new ApiResponse(200, { logs }, "User activity logs retrieved successfully"));
      
  } catch (error) {
    console.error("Get user activity logs error:", error);
    throw new ApiError(500, "Failed to retrieve user activity logs");
  }
});

// Helper function to verify Google token (simplified)
const verifyGoogleToken = async (token) => {
  // In a real implementation, you would verify the token with Google's API
  // For now, we'll return a mock profile
  return {
    id: 'mock_google_id',
    displayName: 'Mock User',
    emails: [{ value: 'mock@example.com', verified: true }],
    photos: [{ value: 'https://example.com/photo.jpg' }]
  };
};

export {
  registerUser,
  loginUser,
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
  // Admin controllers
  getAllUsers,
  getUsersAnalytics,
  getUserDetails,
  updateUserRole,
  logoutFromAllDevices,
  // Google OAuth controllers
  googleOAuthLogin,
  googleOAuthCallback,
  linkGoogleAccount,
  unlinkGoogleAccount,
  getAuthProviders,
  // Email verification controllers
  sendEmailVerification,
  verifyEmail,
  // Account security controllers
  unlockAccount,
  getUserActivityLogs
};
