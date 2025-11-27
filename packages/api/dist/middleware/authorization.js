"use strict";
/**
 * Authorization Middleware
 * Enforces least privilege access control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
/**
 * Require specific permission(s)
 */
function requirePermission(...permissions) {
    return async (req, res, next) => {
        try {
            if (!req.userId || !req.tenantId) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required',
                });
                return;
            }
            // Get user role and scopes
            const user = await (0, db_1.query)(`SELECT u.role, COALESCE(ak.scopes, ARRAY[]::TEXT[]) as scopes
         FROM users u
         LEFT JOIN api_keys ak ON ak.user_id = u.id AND ak.id = $2
         WHERE u.id = $1 AND u.tenant_id = $3`, [req.userId, req.apiKeyId || null, req.tenantId]);
            if (user.length === 0) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'User not found',
                });
                return;
            }
            const { role, scopes } = user[0];
            // Check permissions
            const hasPermission = Permissions_1.PermissionChecker.hasAllPermissions(role, scopes, permissions);
            if (!hasPermission) {
                // Log unauthorized access attempt
                await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    'unauthorized_access',
                    req.userId,
                    req.tenantId,
                    req.ip,
                    req.headers['user-agent'],
                    req.path,
                    JSON.stringify({ requiredPermissions: permissions }),
                ]);
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                    required: permissions,
                });
                return;
            }
            // Store permissions in request for downstream use
            req.permissions = Permissions_1.PermissionChecker.getPermissionsForRole(role);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Require any of the specified permissions
 */
function requireAnyPermission(...permissions) {
    return async (req, res, next) => {
        try {
            if (!req.userId || !req.tenantId) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required',
                });
                return;
            }
            const user = await (0, db_1.query)(`SELECT u.role, COALESCE(ak.scopes, ARRAY[]::TEXT[]) as scopes
         FROM users u
         LEFT JOIN api_keys ak ON ak.user_id = u.id AND ak.id = $2
         WHERE u.id = $1 AND u.tenant_id = $3`, [req.userId, req.apiKeyId || null, req.tenantId]);
            if (user.length === 0) {
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'User not found',
                });
                return;
            }
            const { role, scopes } = user[0];
            const hasPermission = Permissions_1.PermissionChecker.hasAnyPermission(role, scopes, permissions);
            if (!hasPermission) {
                await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                    'unauthorized_access',
                    req.userId,
                    req.tenantId,
                    req.ip,
                    req.headers['user-agent'],
                    req.path,
                    JSON.stringify({ requiredPermissions: permissions }),
                ]);
                res.status(403).json({
                    error: 'Forbidden',
                    message: 'Insufficient permissions',
                });
                return;
            }
            req.permissions = Permissions_1.PermissionChecker.getPermissionsForRole(role);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=authorization.js.map