import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
export declare const validateRequest: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map