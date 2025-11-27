/**
 * Authorization Middleware
 * Enforces least privilege access control
 */
import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenant';
import { Permission } from '../infrastructure/security/Permissions';
export interface AuthorizedRequest extends TenantRequest {
    permissions?: Permission[];
}
/**
 * Require specific permission(s)
 */
export declare function requirePermission(...permissions: Permission[]): (req: AuthorizedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Require any of the specified permissions
 */
export declare function requireAnyPermission(...permissions: Permission[]): (req: AuthorizedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authorization.d.ts.map