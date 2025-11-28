/**
 * Event Tracking Utility
 * Tracks business events for analytics, dashboards, and product insights
 * Part of Operator-in-a-Box blueprint
 */
export interface EventProperties {
    [key: string]: unknown;
}
/**
 * Track a business event
 * @param userId - User ID (optional, can be null for anonymous events)
 * @param eventName - Event name (e.g., 'APIKeyCreated', 'ReconciliationSuccess')
 * @param properties - Event properties (JSON-serializable)
 * @param tenantId - Tenant ID (optional, inferred from userId if not provided)
 */
export declare function trackEvent(userId: string | null, eventName: string, properties?: EventProperties, tenantId?: string): Promise<void>;
/**
 * Track event synchronously (fire and forget)
 * Use this when you don't need to wait for the event to be stored
 */
export declare function trackEventAsync(userId: string | null, eventName: string, properties?: EventProperties, tenantId?: string): void;
/**
 * Track multiple events in a batch
 */
export declare function trackEvents(events: Array<{
    userId: string | null;
    eventName: string;
    properties?: EventProperties;
    tenantId?: string;
}>): Promise<void>;
//# sourceMappingURL=event-tracker.d.ts.map