import jwt, { SignOptions } from "jsonwebtoken";
import { IUser } from "../models/user.model";

export const generateAccessToken = (user: IUser): string => {
  const payload = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
  };

  const secret = process.env.JWT_SECRET || "jwt_secret";
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    id: user._id,
  };

  const secret = process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret";
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ||
      "30d") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};

export default {
  generateAccessToken,
  generateRefreshToken,
};
