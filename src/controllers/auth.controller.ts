import { Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();
import * as authService from "../services/auth.service";
import { BadRequestError } from "../errors";
import {
  generateVerifiedEmailBody,
  generateResetPasswordEmailBody,
} from "../utils/mail-html-body-gen";
import { sendEmail } from "../utils/send-mail";
import logger from "../config/logger.config";
import { TokenPayload } from "../types/auth.types";
import { getSecretKey, getRefreshSecretKey } from "../utils/secret-manager";

// Use environment variables and remove hardcoded fallbacks
export const userSignUp = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, contactNo } = req.body;
    let avatar =
      "https://ds-nature-ayur.s3.ap-southeast-1.amazonaws.com/Default_pfp.svg.png";

    if (req.file) {
      avatar = req.file.path;
    }

    const token = await authService.signUp({
      email,
      password,
      firstName,
      lastName,
      avatar,
      contactNo,
    });
    const emailBody = generateVerifiedEmailBody(
      firstName + " " + lastName,
      token
    );

    // await sendEmail({
    //   toEmail: email,
    //   subject: "Verify Email",
    //   emailBody,
    // });

    return res.status(200).json({
      message: "Please verify your email address",
    });
  } catch (error: any) {
    logger.error(`SignUp Error: ${error.message}`);
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const userSignIn = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    { session: false },
    async (err: any, userData: any) => {
      if (err) {
        return res.status(400).json({
          message: err.message,
        });
      }

      if (!userData) {
        return res.status(400).json({
          message: "Authentication failed",
        });
      }

      try {
        // Use the secure refresh secret from environment
        const refreshSecret = await getRefreshSecretKey();
        
        // Create the token structure correctly
        const tokenData = {
          accessToken: userData.id, // The JWT is currently in the id field
          refreshToken: jwt.sign(
            { id: userData._id || userData.id.split(".")[1] },
            refreshSecret as Secret,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" } as SignOptions
          ),
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          // Include other fields as needed
        };

        // Set refresh token in HTTP-only cookie
        res.cookie("refreshToken", tokenData.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Return access token and user info in response
        return res.status(200).json({
          accessToken: tokenData.accessToken,
          role: tokenData.role,
          firstName: tokenData.firstName,
          lastName: tokenData.lastName,
          message: "User Logged In Successfully",
        });
      } catch (error: any) {
        logger.error(`JWT Generation Error: ${error.message}`);
        return res.status(500).json({
          message: "Authentication error",
        });
      }
    }
  )(req, res, next);
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (!token) throw new BadRequestError("Token not found");

    await authService.verifyUser(token);

    res.json({
      message: "Email Verified",
      redirectUrl: `/signin`,
    });
  } catch (error: any) {
    logger.error(`Email Verification Error: ${error.message}`);
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await authService.findUserByEmail(email);
    
    // Get secure secret key
    const secretKey = await getSecretKey();
    
    const token = jwt.sign(
      { id: user._id },
      secretKey,
      { expiresIn: "5m" }
    );

    const emailBody = generateResetPasswordEmailBody(
      user.firstName + " " + user.lastName,
      token
    );

    await sendEmail({
      toEmail: email,
      subject: "Reset Password",
      emailBody,
    });

    return res.status(200).json({
      message: "Please check your email to reset password",
    });
  } catch (error: any) {
    logger.error(`Forgot Password Error: ${error.message}`);
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Get secure secret key
    const secretKey = await getSecretKey();
    
    // Verify the token and get the user ID
    const decoded = jwt.verify(token, secretKey) as TokenPayload;

    await authService.resetPassword(decoded.id, password);

    return res.status(200).json({
      message: "Password Reset Successfully",
    });
  } catch (error: any) {
    logger.error(`Reset Password Error: ${error.message}`);
    return res.status(400).json({
      message: error.message,
    });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const result = await authService.refreshToken(refreshToken);

    return res.status(200).json({
      accessToken: result.accessToken,
      message: "New Access Token Issued",
    });
  } catch (error: any) {
    logger.error(`Refresh Token Error: ${error.message}`);
    return res.status(401).json({
      message: error.message,
    });
  }
};

export const getUserProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await authService.findUserById(userId);

    // Remove sensitive data
    const userProfile = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNo: user.contactNo,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
      address: user.address,
      seller: user.seller,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      user: userProfile,
    });
  } catch (error: any) {
    logger.error(`Get User Profile Error: ${error.message}`);
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Update user profile
export const updateUserProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, contactNo, address } = req.body;

    // Create update object with only provided fields
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (contactNo) updateData.contactNo = contactNo;
    if (address) updateData.address = address;

    // Add avatar if provided
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    // Update user
    const updatedUser = await authService.updateUser(userId, updateData);

    // Remove sensitive data
    const userProfile = {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      contactNo: updatedUser.contactNo,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      address: updatedUser.address,
      seller: updatedUser.seller,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return res.status(200).json({
      message: "Profile updated successfully",
      user: userProfile,
    });
  } catch (error: any) {
    logger.error(`Update User Profile Error: ${error.message}`);
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Update user to seller
export const updateUserToSeller = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = id;
    const { storeName, description, logo } = req.body;

    // Create seller update object
    const sellerData = {
      isSeller: true,
      seller: {
        storeName,
        description,
        logo: logo || req.file?.path || undefined,
      },
    };

    // Update user's role and seller info
    const updatedUser = await authService.updateUserToSeller(
      userId,
      sellerData
    );

    return res.status(200).json({
      message: "User updated to seller successfully",
      user: {
        _id: updatedUser._id,
        role: updatedUser.role,
        seller: updatedUser.seller,
      },
    });
  } catch (error: any) {
    logger.error(`Update User To Seller Error: ${error.message}`);
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req: any, res: Response) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      throw new BadRequestError("Unauthorized: Admin access required");
    }

    const users = await authService.getAllUsers();

    // Filter out sensitive information
    const userList = users.map((user) => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNo: user.contactNo,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    }));

    return res.status(200).json({
      users: userList,
    });
  } catch (error: any) {
    logger.error(`Get All Users Error: ${error.message}`);
    return res.status(400).json({
      message: error.message,
    });
  }
};