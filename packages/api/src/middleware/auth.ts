import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  apiKey?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check for API key in header
    const apiKey = req.headers["x-api-key"] as string;
    if (apiKey) {
      // Validate API key (in production, check against database)
      if (apiKey.startsWith("rk_")) {
        req.apiKey = apiKey;
        // Extract user ID from API key prefix (simplified)
        req.userId = apiKey.split("_")[1] || "anonymous";
        return next();
      }
    }

    // Check for JWT token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
      
      try {
        const decoded = jwt.verify(token, secret) as { userId: string };
        req.userId = decoded.userId;
        return next();
      } catch (err) {
        return res.status(401).json({
          error: "Invalid Token",
          message: "The provided token is invalid or expired",
        });
      }
    }

    // No auth provided
    res.status(401).json({
      error: "Unauthorized",
      message: "API key or Bearer token required",
    });
  } catch (error) {
    next(error);
  }
};
