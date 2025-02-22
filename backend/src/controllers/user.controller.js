import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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
 * 1. Get user details from frontend (including optional role)
 * 2. Validate required fields
 * 3. Check if user already exists by username or email
 * 4. Check for uploaded images (avatar, coverImage) and upload them to Cloudinary
 * 5. Create the user in the database
 * 6. Exclude password and refreshToken from the returned document
 * 7. Confirm user creation
 * 8. Return response
 *
 * Role-based note:
 *  - By default, new users have role = "user".
 *  - If a role is specified as "admin", you can optionally restrict this to
 *    only an existing admin user. For that, you would typically wrap this
 *    controller in a route protected by verifyJWT + verifyRole('admin').
 */
const registerUser = asyncHandler(async (req, res) => {
  // 1. Destructure user details (including an optional role) from the request
  const { fullName, email, username, password, role } = req.body;

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

  // 5. Decide the role to assign
  //    - By default, new accounts are "user"
  //    - If your app allows specifying role=admin, ensure you protect this route
  //      with verifyRole('admin') or a similar check if you only want admins to
  //      create admin accounts.
  const assignedRole = role || "user";

  // 6. Create the user document in the database
  const user = await User.create({
    fullName,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
    role: assignedRole, // role is stored here
  });

  // 7. Fetch the newly created user, omitting password & refreshToken
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // 8. Return the final user object in the response (without sensitive fields)
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

  console.log("Login password is: ", password);

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  // Retrieve user object without password & refreshToken
  const loggedInUser = await User.findById(user._id).select("-password -refreshtoken");

  // Cookie options
  const options = {
    // httpOnly: true,
    // secure: true,
    sameSite: "None",
    path: "/",
    httpOnly: false, // Set to true if you don’t want frontend JavaScript to access it
    secure: true,   // Set to true in production (requires HTTPS)
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
    httpOnly: false,
    secure: true,
    sameSite: "None",
    path: "/",
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
      httpOnly: true,
      secure: true,
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
};
