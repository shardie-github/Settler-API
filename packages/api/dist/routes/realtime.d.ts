/**
 * Real-time Updates Route
 * WebSocket/SSE endpoint for reconciliation status updates
 */
declare const router: import("express-serve-static-core").Router;
/**
 * Broadcast update to all connections for a job
 */
export declare function broadcastJobUpdate(jobId: string, tenantId: string, update: Record<string, unknown>): void;
export { router as realtimeRouter };
//# sourceMappingURL=realtime.d.ts.map