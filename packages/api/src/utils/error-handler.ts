/**
 * Standardized Error Handling Utilities
 * Provides type-safe error extraction and handling
 */

import { Response } from 'express';
import { sendError } from './api-response';
import { logError } from './logger';

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Safely extracts error stack trace
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

/**
 * Checks if error is a known error type with status code
 */
export interface HttpError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as HttpError).statusCode === 'number'
  );
}

/**
 * Handles errors in route handlers with proper typing
 */
export function handleRouteError(
  res: Response,
  error: unknown,
  defaultMessage: string = 'An error occurred',
  defaultStatusCode: number = 500,
  context?: Record<string, unknown>
): void {
  const message = getErrorMessage(error);
  const statusCode = isHttpError(error) ? error.statusCode ?? defaultStatusCode : defaultStatusCode;
  const code = isHttpError(error) ? error.code : undefined;
  const details = isHttpError(error) ? error.details : undefined;

  logError(defaultMessage, error, context);

  sendError(res, 'Internal Server Error', message, statusCode, code, details);
}
