import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    userId?: string;
    apiKeyId?: string;
    apiKey?: string;
    traceId?: string;
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map