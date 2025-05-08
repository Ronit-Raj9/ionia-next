import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { AttemptedTest } from "../models/attemptedTest.model.js";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService.js";

/**
 * Helper function to generate both Access Token and Refresh Token,
 * then store the refresh token in the user's record.
 */
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    console.log("User Controller login access token: " + accessToken);
    console.log("User Controller login refresh token: " + refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token",
      error
    );
  }
};

/**
 * registerUser
 * 1. Get user details from frontend
 * 2. Validate required fields
 * 3. Check if user already exists by username or email
 * 4. Check for uploaded images (avatar, coverImage) and upload them to Cloudinary
 * 5. Create the user in the database
 * 6. Exclude password and refreshToken from the returned document
 * 7. Confirm user creation
 * 8. Return response
 *
 * Note: Role is not accepted from client; the default role="user" from the model is used
 * Admin roles should be set directly in the database
 */
const registerUser = asyncHandler(async (req, res) => {
  // 1. Destructure user details from the request
  const { fullName, email, username, password } = req.body;

  // 2. Validate required fields
  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(
      400,
      "All fields (fullName, email, username, password) are required"
    );
  }

  // 3. Check if a user with the same username or email already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // 4. Handle optional file uploads (avatar, coverImage) and upload them to Cloudinary
  //    These paths come from Multer's file handling in req.files
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // 5. Create the user document in the database with default role from model
  const user = await User.create({
    fullName,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username?.toLowerCase() || "",
    // No role specified - the model default "user" will be used
  });

  // 6. Fetch the newly created user, omitting password & refreshToken
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 7. Return the final user object in the response (without sensitive fields)
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

/**
 * loginUser
 * 1. Validate that username/email is present in req.body
 * 2. Retrieve user from DB
 * 3. Compare password
 * 4. Generate new access & refresh tokens
 * 5. Return tokens in cookies + user object
 */
const loginUser = asyncHandler(async (req, res) => {
  // 1. req body -> data
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  // Retrieve user object without password & refreshToken
  const loggedInUser = await User.findById(user._id).select("-password -refreshtoken");

  // Cookie options for cross-origin requests
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    domain: process.env.NODE_ENV === 'production' ? '.ionia.sbs' : undefined,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

/**
 * logoutUser
 * 1. Removes refreshToken from DB
 * 2. Clears cookies containing access and refresh tokens
 */
const logoutUser = asyncHandler(async (req, res) => {
  console.log("req.user: ", req.user);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    path: "/",
    httpOnly: false,
    secure: true,
    sameSite: "None",
    maxAge: 0, // Expire immediately
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

/**
 * refreshAccessToken
 * 1. Reads refreshToken from cookies or req.body
 * 2. Verifies token, checks DB for user
 * 3. Compares stored refreshToken
 * 4. Issues new accessToken & refreshToken
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  console.log("Cookie", req.cookies);
  console.log("Incoming refresh token is: ", incomingRefreshToken);

  console.log("Error starting");
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  console.log("Error ending");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("Decoded token: ", decodedToken);

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    console.log("Start");
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    console.log("end");

    const options = {
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
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
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
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
    // Fetch basic user info
    const user = await User.findById(userId)
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")
      .lean();
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    
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
  updateUserRole
};
