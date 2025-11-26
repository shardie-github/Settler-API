import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";
import { AuthRequest } from "./auth";
import { config } from "../config";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error with context
  logError('Request error', err, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    traceId: (req as AuthRequest).traceId,
    userId: (req as AuthRequest).userId,
  });

  // Default error response
  const statusCode = (err as any).statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Never expose stack traces in production
  const response: any = {
    error: err.name || "Internal Server Error",
    message,
  };

  // Only include stack in development
  if (config.nodeEnv === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
