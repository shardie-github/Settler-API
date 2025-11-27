/**
 * Standardized API Response Utilities
 * Provides consistent response format across all endpoints
 */

import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    cursor?: string;
  };
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  error: string,
  message: string,
  statusCode: number = 400,
  code?: string,
  details?: unknown
): void {
  const response: ApiError = {
    error,
    message,
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: {
    page: number;
    limit: number;
    total: number;
    cursor?: string;
  }
): void {
  const response: ApiResponse<T[]> = {
    data,
    meta: {
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      ...(meta.cursor !== undefined && { cursor: meta.cursor }),
    },
  };

  res.status(200).json(response);
}

/**
 * Send created response
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string
): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Send no content response
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}
