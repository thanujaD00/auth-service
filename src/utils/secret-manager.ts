import * as dotenv from "dotenv";
dotenv.config();
import logger from "../config/logger.config";

// Cache for the secrets to avoid reading from environment variables repeatedly
let secretKeyCache: string | null = null;
let refreshSecretKeyCache: string | null = null;

/**
 * Gets the JWT secret key from environment variables or a secure secret manager
 * In a production environment, this could be replaced with calls to AWS Secrets Manager,
 * Google Secret Manager, Azure Key Vault, etc.
 */
export const getSecretKey = async (): Promise<string> => {
  // If we already have the secret in cache, return it
  if (secretKeyCache) {
    return secretKeyCache;
  }

  // Get the secret from environment variables
  const secretKey = process.env.JWT_SECRET_KEY;

  if (!secretKey) {
    logger.error("JWT_SECRET_KEY is not defined in environment variables");
    throw new Error("JWT secret key is not configured properly");
  }

  // Store in cache
  secretKeyCache = secretKey;
  return secretKey;
};

/**
 * Gets the JWT refresh secret key from environment variables or a secure secret manager
 */
export const getRefreshSecretKey = async (): Promise<string> => {
  // If we already have the secret in cache, return it
  if (refreshSecretKeyCache) {
    return refreshSecretKeyCache;
  }

  // Get the secret from environment variables
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!refreshSecret) {
    logger.error("JWT_REFRESH_SECRET is not defined in environment variables");
    throw new Error("JWT refresh secret key is not configured properly");
  }

  // Store in cache
  refreshSecretKeyCache = refreshSecret;
  return refreshSecret;
};

/**
 * Clears the secret cache - useful for testing or when secrets are rotated
 */
export const clearSecretCache = (): void => {
  secretKeyCache = null;
  refreshSecretKeyCache = null;
};

export default {
  getSecretKey,
  getRefreshSecretKey,
  clearSecretCache,
};