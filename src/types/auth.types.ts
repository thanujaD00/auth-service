export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  contactNo: string;
  avatar?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  password: string;
}

export interface TokenPayload {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatar?: string;
  isVerified?: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  role: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isVerified: boolean;
}
