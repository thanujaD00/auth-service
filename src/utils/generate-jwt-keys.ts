import jwt from "jsonwebtoken";
import { IUser } from "../models/user.model";
import { getSecretKey, getRefreshSecretKey } from "./secret-manager";

export const generateAccessToken = async (user: IUser): Promise<string> => {
  const payload = {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar,
    isVerified: user.isVerified,
  };

  const secret = await getSecretKey();
  const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions); // make sure it's options, not callback
};

export const generateRefreshToken = async (user: IUser): Promise<string> => {
  const payload = { id: user._id.toString() };

  const secret = await getRefreshSecretKey();
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export default {
  generateAccessToken,
  generateRefreshToken,
};
