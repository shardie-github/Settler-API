import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    userId?: string;
    apiKeyId?: string;
    apiKey?: string;
    traceId?: string;
    tenantId?: string;
}
/**
 * Express middleware for API key or JWT token authentication.
 *
 * Supports two authentication methods:
 * 1. API Key: `X-API-Key` header with `rk_` prefix
 * 2. JWT Token: `Authorization: Bearer <token>` header
 *
 * On success, attaches `userId` and `apiKeyId` (if API key) to `req`.
 * On failure, returns 401 Unauthorized.
 *
 * @example
 * ```typescript
 * app.use("/api/v1", authMiddleware, protectedRouter);
 * ```
 */
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map