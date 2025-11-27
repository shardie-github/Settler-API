/**
 * Cache Invalidation Strategies
 * Provides utilities for invalidating cache entries based on patterns
 */
/**
 * Invalidate cache for a specific job
 */
export declare function invalidateJobCache(jobId: string): Promise<void>;
/**
 * Invalidate cache for a specific user
 */
export declare function invalidateUserCache(userId: string): Promise<void>;
/**
 * Invalidate cache for a specific tenant
 */
export declare function invalidateTenantCache(tenantId: string): Promise<void>;
/**
 * Invalidate all adapter-related cache
 */
export declare function invalidateAdapterCache(adapterName: string): Promise<void>;
/**
 * Invalidate cache after job status change
 */
export declare function invalidateJobStatusCache(jobId: string, oldStatus: string, newStatus: string): Promise<void>;
/**
 * Invalidate cache after report generation
 */
export declare function invalidateReportCache(jobId: string): Promise<void>;
//# sourceMappingURL=cache-invalidation.d.ts.map