/**
 * Test Mode Middleware
 * UX-004: Test mode toggle - Sandbox environment for safe testing
 * Future-forward: Automatic test mode detection, sandbox isolation
 */
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
/**
 * Check if user has test mode enabled
 */
export declare function checkTestMode(req: AuthRequest): Promise<boolean>;
/**
 * Test mode middleware - routes requests to sandbox environment
 */
export declare function testModeMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void>;
/**
 * Validate test mode restrictions
 */
export declare function validateTestMode(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=test-mode.d.ts.map