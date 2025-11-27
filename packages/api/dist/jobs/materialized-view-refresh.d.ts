/**
 * Materialized View Refresh Job
 * Periodically refreshes materialized views for optimal query performance
 */
/**
 * Refresh all materialized views
 * Should be run periodically (e.g., every 15 minutes)
 */
export declare function refreshMaterializedViewsJob(): Promise<void>;
/**
 * Start periodic materialized view refresh
 * Runs every 15 minutes
 */
export declare function startMaterializedViewRefreshJob(): void;
//# sourceMappingURL=materialized-view-refresh.d.ts.map