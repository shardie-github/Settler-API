/**
 * Typed Error Classes for API
 * Provides strongly-typed error handling with status codes and error codes
 */
export declare abstract class ApiError extends Error {
    abstract readonly statusCode: number;
    abstract readonly errorCode: string;
    readonly details?: unknown;
    constructor(message: string, details?: unknown);
    toJSON(): {
        error: string;
        errorCode: string;
        message: string;
        details?: unknown;
    };
}
export declare class ValidationError extends ApiError {
    readonly statusCode = 400;
    readonly errorCode = "VALIDATION_ERROR";
    readonly field?: string;
    constructor(message: string, field?: string, details?: unknown);
}
export declare class AuthenticationError extends ApiError {
    readonly statusCode = 401;
    readonly errorCode = "AUTHENTICATION_ERROR";
}
export declare class AuthorizationError extends ApiError {
    readonly statusCode = 403;
    readonly errorCode = "AUTHORIZATION_ERROR";
}
export declare class NotFoundError extends ApiError {
    readonly statusCode = 404;
    readonly errorCode = "NOT_FOUND";
    readonly resourceType?: string;
    readonly resourceId?: string;
    constructor(message: string, resourceType?: string, resourceId?: string, details?: unknown);
}
export declare class ConflictError extends ApiError {
    readonly statusCode = 409;
    readonly errorCode = "CONFLICT";
}
export declare class RateLimitError extends ApiError {
    readonly statusCode = 429;
    readonly errorCode = "RATE_LIMIT_EXCEEDED";
    readonly retryAfter?: number;
    readonly limit?: number;
    readonly remaining?: number;
    constructor(message: string, retryAfter?: number, limit?: number, remaining?: number, details?: unknown);
}
export declare class InternalServerError extends ApiError {
    readonly statusCode = 500;
    readonly errorCode = "INTERNAL_SERVER_ERROR";
}
export declare class ServiceUnavailableError extends ApiError {
    readonly statusCode = 503;
    readonly errorCode = "SERVICE_UNAVAILABLE";
    readonly retryAfter?: number;
    constructor(message: string, retryAfter?: number, details?: unknown);
}
/**
 * Type guard to check if error is an ApiError
 */
export declare function isApiError(error: unknown): error is ApiError;
/**
 * Convert unknown error to ApiError
 */
export declare function toApiError(error: unknown): ApiError;
//# sourceMappingURL=typed-errors.d.ts.map