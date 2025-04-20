import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { UnAuthorized, BadRequestError } from "../errors";
import { AuthTokens } from "../types/auth.types";

export enum ROLES {
  ADMIN = "admin",
  USER = "user",
  SELLER = "seller",
}

export interface ISellerInfo {
  storeName?: string;
  logo?: string;
  description?: string;
  rating: number;
  numReviews: number;
}

export interface IAddress {
  street?: string;
  city?: string;
  postalCode?: string;
  province?: string;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isVerified: boolean;
  avatar: string;
  role: ROLES;
  contactNo: string;
  seller?: ISellerInfo;
  address?: IAddress;
  createdAt: Date;
  updatedAt: Date;
  generateJWTToken(): string;
  generateRefreshToken(): string;
  resetPassword(password: string): Promise<string>;
}

interface IUserModel extends Model<IUser> {
  login(email: string, password: string): Promise<AuthTokens>;
}

const UserSchema = new Schema<IUser, IUserModel>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    avatar: { type: String },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    contactNo: {
      type: String,
      required: true,
      unique: true,
      minlength: 10,
      maxlength: 10,
    },
    seller: {
      storeName: { type: String },
      logo: { type: String },
      description: { type: String },
      rating: { type: Number, default: 0 },
      numReviews: { type: Number, default: 0 },
    },
    address: {
      street: { type: String },
      city: { type: String },
      postalCode: { type: String },
      province: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.methods.generateJWTToken = function (): string {
  const payload = {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    avatar: this.avatar,
    isVerified: this.isVerified,
  };

  // Ensure the secret is retrieved securely
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

// Generate refresh token
UserSchema.methods.generateRefreshToken = function (): string {
  const payload = { id: this._id };

  // Ensure the refresh secret is retrieved securely
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
  }

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

// Reset password method
UserSchema.methods.resetPassword = async function (
  password: string
): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Static login method
UserSchema.statics.login = async function (
  email: string,
  password: string
): Promise<AuthTokens> {
  const user = await this.findOne({ email });

  if (!user) {
    throw new BadRequestError("User does not exist with this email");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new UnAuthorized("Incorrect credentials");
  }

  return {
    accessToken: user.generateJWTToken(),
    refreshToken: user.generateRefreshToken(),
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    isVerified: user.isVerified,
  };
};

const User = mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;
