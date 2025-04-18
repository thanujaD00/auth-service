import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { BadRequestError, UnAuthorized } from "../errors";
import { generateAccessToken } from "../utils/generate-jwt-keys";
import { SignUpInput, SignInInput, TokenPayload } from "../types/auth.types";

async function signUp(userData: SignUpInput): Promise<string> {
  try {
    const user = await User.create({
      ...userData,
      isVerified: true,
    });
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET || "jwt_secret", {
      expiresIn: "10m",
    });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new BadRequestError("User Already Exists");
    }
    throw error;
  }
}

async function signIn(credentials: SignInInput) {
  try {
    return await User.login(credentials.email, credentials.password);
  } catch (error) {
    throw new UnAuthorized("Authentication failed");
  }
}

async function verifyUser(token: string) {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "jwt_secret"
    ) as TokenPayload;

    const user = await User.findById(decoded.id);

    if (!user) throw new BadRequestError("User does not exist");

    user.isVerified = true;
    await user.save();

    return user;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new BadRequestError("Token Expired");
    }
    throw new BadRequestError("Invalid Token");
  }
}

async function resetPassword(userId: string, password: string) {
  try {
    const user = await User.findById(userId);
    if (!user) throw new BadRequestError("User does not exist");

    const newPassword = await user.resetPassword(password);
    await User.findByIdAndUpdate(
      userId,
      { password: newPassword },
      { new: true }
    );

    return await User.login(user.email, password);
  } catch (error) {
    throw new Error("Password Reset Failed");
  }
}

async function findUserByEmail(email: string) {
  const user = await User.findOne({ email });
  if (!user) throw new BadRequestError("No user found with this email");
  return user;
}

async function refreshToken(refreshToken: string) {
  try {
    if (!refreshToken) throw new BadRequestError("Refresh token is required");

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret"
    ) as TokenPayload;

    const user = await User.findById(decoded.id);

    if (!user) throw new BadRequestError("User not found");

    const accessToken = generateAccessToken(user);
    return { accessToken };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new BadRequestError("Refresh token expired");
    }
    throw error;
  }
}
export async function findUserById(id: string) {
  const user = await User.findById(id);
  if (!user) throw new BadRequestError("User not found");
  return user;
}

/**
 * Update a user's profile
 */
async function updateUser(id: string, updateData: any) {
  try {
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) throw new BadRequestError("User not found");
    return user;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new BadRequestError("This contact number is already in use");
    }
    throw error;
  }
}

/**
 * Update a user to seller
 */
async function updateUserToSeller(id: string, sellerData: any) {
  try {
    // Find the user first
    const user: any = await User.findById(id);
    if (!user) throw new BadRequestError("User not found");

    // Update seller information
    user.role = "seller";

    if (sellerData.seller) {
      user.seller = {
        ...user.seller,
        storeName: sellerData.seller.storeName || user.seller?.storeName,
        description: sellerData.seller.description || user.seller?.description,
        logo: sellerData.seller.logo || user.seller?.logo,
        rating: user.seller?.rating || 0,
        numReviews: user.seller?.numReviews || 0,
      };
    }

    // Save the updated user
    await user.save();

    return user;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new BadRequestError("Store name already exists");
    }
    throw error;
  }
}

/**
 * Get all users (for admin)
 */
async function getAllUsers() {
  const users = await User.find().select("-password");
  return users;
}

export {
  signUp,
  signIn,
  verifyUser,
  resetPassword,
  findUserByEmail,
  refreshToken,
  getAllUsers,
  updateUserToSeller,
  updateUser,
};
