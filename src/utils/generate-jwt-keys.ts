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

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET_KEY || "fallback-secret-key",
    { expiresIn: "1h" }
  );

  return accessToken;
};

export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    id: user._id,
  };

  const secret = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret";
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
