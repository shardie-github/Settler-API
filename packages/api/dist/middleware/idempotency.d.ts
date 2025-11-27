import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
export declare function idempotencyMiddleware(): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=idempotency.d.ts.map