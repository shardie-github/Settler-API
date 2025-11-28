/**
 * Enhanced Error Handler
 * UX-003: Detailed error messages with field-level validation and AI-powered suggestions
 * Future-forward: AI suggests fixes, provides code examples, links to docs
 */
import { Response } from "express";
export interface EnhancedErrorResponse {
    error: {
        code: string;
        message: string;
        type: string;
        details?: Array<{
            field: string;
            message: string;
            code: string;
            suggestion?: string;
            example?: string;
            docLink?: string;
        }>;
        suggestion?: string;
        docLink?: string;
        example?: string;
        traceId?: string;
    };
}
/**
 * Enhanced error handler with AI-powered suggestions
 */
export declare function handleEnhancedError(res: Response, error: unknown, defaultMessage: string, statusCode?: number, context?: Record<string, unknown>): void;
//# sourceMappingURL=enhanced-error-handler.d.ts.map