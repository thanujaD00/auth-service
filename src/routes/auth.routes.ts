// src/routes/auth.routes.ts

import express from "express";
import {
  userSignUp,
  userSignIn,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  updateUserToSeller,
  getAllUsers,
} from "../controllers/auth.controller";
import validate from "../middleware/schemavalidator.middleware";
import {
  createUserSignUpSchema,
  createUserSignInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserProfileSchema,
  updateUserToSellerSchema,
} from "../schema/auth.schema";
import { upload } from "../utils/multerConfig";
import { validateUserRoleAndToken } from "../middleware/auth.middleware";
import { ROLES } from "../models/user.model";

const router = express.Router();

// Public routes
// User signup route
router.post(
  "/signup",
  upload.single("avatar"),
  validate(createUserSignUpSchema),
  userSignUp
);

// User signin route
router.post("/signin", validate(createUserSignInSchema), userSignIn);

// Email verification route
router.get("/verify/:token", verifyEmail);

// Refresh token route
router.get("/refresh", refreshAccessToken);

// Forgot password route
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

// Reset password route
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPassword
);

// Protected routes (require authentication)
// Get user profile
router.get(
  "/profile",
  validateUserRoleAndToken([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]),
  getUserProfile
);

// Update user profile
router.patch(
  "/profile",
  validateUserRoleAndToken([ROLES.USER, ROLES.SELLER, ROLES.ADMIN]),
  upload.single("avatar"),
  validate(updateUserProfileSchema),
  updateUserProfile
);

// Update user to seller
router.patch("/update-role/:id", upload.single("logo"), updateUserToSeller);

// Get all users (admin only)
router.get("/users", validateUserRoleAndToken([ROLES.ADMIN]), getAllUsers);

// Health check route
router.get("/health", (req, res) =>
  res.status(200).json({ status: "Auth Service is healthy" })
);

export default router;
