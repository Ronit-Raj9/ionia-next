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
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * Public Routes
 *  - Everyone can access without being authenticated
 */
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

/**
 * Protected Routes (Must be Authenticated)
 *  - Requires verifyJWT to ensure the user is logged in
 */
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(verifyJWT, refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrrentUser);

/**
 * Role-Based Routes
 *  - In many cases, normal users should be able to update their own profiles,
 *    but you might want to allow ONLY admin to update other users' profiles.
 *  - Below are examples of how to apply role checks with verifyRole.
 */

// Example: Any authenticated user or admin can update their own account
router
  .route("/update-account")
  .patch(verifyJWT, verifyRole("user", "admin"), updateAccountDetails);

// Example: Only authenticated user or admin can update avatar
router
  .route("/avatar")
  .patch(
    verifyJWT,
    verifyRole("user", "admin"),
    upload.single("avatar"),
    updateUserAvatar
  );

// Example: Only authenticated user or admin can update cover image
router
  .route("/cover-image")
  .patch(
    verifyJWT,
    verifyRole("user", "admin"),
    upload.single("coverImage"),
    updateUserCoverImage
  );

export default router;
