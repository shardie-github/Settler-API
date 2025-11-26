/**
 * Authorization Middleware
 * Enforces least privilege access control
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { TenantRequest } from './tenant';
import { Permission, PermissionChecker } from '../infrastructure/security/Permissions';
import { UserRole } from '../domain/entities/User';
import { query } from '../db';

export interface AuthorizedRequest extends TenantRequest {
  permissions?: Permission[];
}

/**
 * Require specific permission(s)
 */
export function requirePermission(...permissions: Permission[]) {
  return async (
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.userId || !req.tenantId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      // Get user role and scopes
      const user = await query<{ role: UserRole; scopes: string[] }>(
        `SELECT u.role, COALESCE(ak.scopes, ARRAY[]::TEXT[]) as scopes
         FROM users u
         LEFT JOIN api_keys ak ON ak.user_id = u.id AND ak.id = $2
         WHERE u.id = $1 AND u.tenant_id = $3`,
        [req.userId, req.apiKeyId || null, req.tenantId]
      );

      if (user.length === 0) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'User not found',
        });
        return;
      }

      const { role, scopes } = user[0];

      // Check permissions
      const hasPermission = PermissionChecker.hasAllPermissions(
        role,
        scopes,
        permissions
      );

      if (!hasPermission) {
        // Log unauthorized access attempt
        await query(
          `INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            'unauthorized_access',
            req.userId,
            req.tenantId,
            req.ip,
            req.headers['user-agent'],
            req.path,
            JSON.stringify({ requiredPermissions: permissions }),
          ]
        );

        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          required: permissions,
        });
        return;
      }

      // Store permissions in request for downstream use
      req.permissions = PermissionChecker.getPermissionsForRole(role);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return async (
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.userId || !req.tenantId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const user = await query<{ role: UserRole; scopes: string[] }>(
        `SELECT u.role, COALESCE(ak.scopes, ARRAY[]::TEXT[]) as scopes
         FROM users u
         LEFT JOIN api_keys ak ON ak.user_id = u.id AND ak.id = $2
         WHERE u.id = $1 AND u.tenant_id = $3`,
        [req.userId, req.apiKeyId || null, req.tenantId]
      );

      if (user.length === 0) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'User not found',
        });
        return;
      }

      const { role, scopes } = user[0];

      const hasPermission = PermissionChecker.hasAnyPermission(
        role,
        scopes,
        permissions
      );

      if (!hasPermission) {
        await query(
          `INSERT INTO audit_logs (event, user_id, tenant_id, ip, user_agent, path, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            'unauthorized_access',
            req.userId,
            req.tenantId,
            req.ip,
            req.headers['user-agent'],
            req.path,
            JSON.stringify({ requiredPermissions: permissions }),
          ]
        );

        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
        return;
      }

      req.permissions = PermissionChecker.getPermissionsForRole(role);
      next();
    } catch (error) {
      next(error);
    }
  };
}
