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
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): void;
/**
 * Send error response
 */
export declare function sendError(res: Response, error: string, message: string, statusCode?: number, code?: string, details?: unknown): void;
/**
 * Send paginated response
 */
export declare function sendPaginated<T>(res: Response, data: T[], meta: {
    page: number;
    limit: number;
    total: number;
    cursor?: string;
}): void;
/**
 * Send created response
 */
export declare function sendCreated<T>(res: Response, data: T, message?: string): void;
/**
 * Send no content response
 */
export declare function sendNoContent(res: Response): void;
//# sourceMappingURL=api-response.d.ts.map