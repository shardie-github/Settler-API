/**
 * Feature Flag Service
 * Per-tenant and per-user feature flags with A/B testing and kill switches
 */
export interface FeatureFlag {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    rolloutPercentage: number;
    tenantId?: string;
    userId?: string;
    conditions: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface FeatureFlagChange {
    featureFlagId: string;
    changedBy?: string;
    oldValue: unknown;
    newValue: unknown;
    reason?: string;
}
export declare class FeatureFlagService {
    /**
     * Check if a feature is enabled for tenant/user
     */
    isEnabled(flagName: string, tenantId: string, userId?: string): Promise<boolean>;
    /**
     * Get feature flag
     */
    getFlag(flagName: string, tenantId?: string, userId?: string): Promise<FeatureFlag | null>;
    /**
     * Create or update feature flag
     */
    setFlag(flagName: string, enabled: boolean, options: {
        tenantId?: string;
        userId?: string;
        rolloutPercentage?: number;
        description?: string;
        conditions?: Record<string, unknown>;
        changedBy?: string;
        reason?: string;
    }): Promise<FeatureFlag>;
    /**
     * Kill switch: immediately disable a feature for all tenants/users
     */
    killSwitch(flagName: string, reason: string, changedBy?: string): Promise<void>;
    /**
     * Get all flags for a tenant
     */
    getTenantFlags(tenantId: string): Promise<FeatureFlag[]>;
    /**
     * Hash string to number (for consistent A/B testing)
     */
    private hashString;
}
//# sourceMappingURL=FeatureFlagService.d.ts.map