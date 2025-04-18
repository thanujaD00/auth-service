import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { ROLES } from "../models/user.model";
import { BadRequestError, UnAuthorized } from "../errors";
import { TokenPayload } from "../types/auth.types";

export function validateUserRoleAndToken(requiredRoles: ROLES[] = []) {
  return async function (req: Request, res: Response, next: NextFunction) {
    // Get the token from the authorization header
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnAuthorized("Authorization header is missing");
    }

    // Extract the token from the authorization header
    const token = authHeader.split(" ")[1];

    try {
      // Extract the user data from the token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "jwt_secret"
      ) as TokenPayload;

      // Find the user in the database
      const user = await User.findById(decoded.id).select("-password");

      // Check if the user exists
      if (!user) {
        throw new BadRequestError("User not found");
      }

      // If no specific roles are required, just attach the user to the request
      if (requiredRoles.length === 0) {
        req.user = user;
        return next();
      }

      // Check if the user has one of the required roles
      if (!requiredRoles.includes(user.role as ROLES)) {
        throw new UnAuthorized(
          "You are not authorized to access this resource"
        );
      }

      // Attach the user to the request
      req.user = user;
      next();
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnAuthorized("Invalid token");
      }
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnAuthorized("Token expired");
      }
      throw err;
    }
  };
}

export { ROLES };
