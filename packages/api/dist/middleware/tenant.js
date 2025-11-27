"use strict";
/**
 * Tenant Middleware
 * Extracts tenant context from request and sets it for RLS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = tenantMiddleware;
const Container_1 = require("../infrastructure/di/Container");
/**
 * Extract tenant from request
 * Priority: custom domain > subdomain > header > user's tenant
 */
async function tenantMiddleware(req, res, next) {
    try {
        const tenantRepo = Container_1.Container.get('ITenantRepository');
        let tenant = null;
        // 1. Check custom domain
        const host = req.get('host') || '';
        if (host) {
            tenant = await tenantRepo.findByCustomDomain(host);
        }
        // 2. Check subdomain (e.g., tenant-slug.api.settler.io)
        if (!tenant && host.includes('.')) {
            const subdomain = host.split('.')[0];
            if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
                tenant = await tenantRepo.findBySlug(subdomain);
            }
        }
        // 3. Check X-Tenant-ID header
        if (!tenant) {
            const tenantId = req.get('X-Tenant-ID');
            if (tenantId) {
                tenant = await tenantRepo.findById(tenantId);
            }
        }
        // 4. Fall back to user's tenant
        if (!tenant && req.user) {
            // User's tenant is already set via auth middleware
            const userTenantId = req.user.tenantId;
            if (userTenantId) {
                tenant = await tenantRepo.findById(userTenantId);
            }
        }
        if (!tenant) {
            res.status(403).json({
                error: 'TenantNotFound',
                message: 'Unable to determine tenant context',
            });
            return;
        }
        // Check tenant status
        if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
            res.status(403).json({
                error: 'TenantSuspended',
                message: 'Tenant account is suspended or cancelled',
            });
            return;
        }
        req.tenantId = tenant.id;
        req.tenant = tenant;
        next();
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=tenant.js.map