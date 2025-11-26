import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err);

  // Default error response
  const statusCode = (err as any).statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: err.name || "Internal Server Error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
