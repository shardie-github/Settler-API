/**
 * Event Envelope
 * Standard event envelope for event sourcing
 */
export interface EventMetadata {
    tenant_id: string;
    user_id?: string;
    timestamp: string;
    correlation_id: string;
    causation_id?: string;
    [key: string]: unknown;
}
export interface EventEnvelope<T = unknown> {
    id: string;
    aggregate_id: string;
    aggregate_type: string;
    event_type: string;
    event_version: number;
    data: T;
    metadata: EventMetadata;
    created_at: Date;
}
export interface SnapshotEnvelope<T = unknown> {
    aggregate_id: string;
    aggregate_type: string;
    snapshot_data: T;
    snapshot_version: number;
    event_id: string;
    created_at: Date;
}
/**
 * Helper to create event metadata
 */
export declare function createEventMetadata(tenantId: string, userId?: string, correlationId?: string, causationId?: string): EventMetadata;
/**
 * Helper to create event envelope
 */
export declare function createEventEnvelope<T>(aggregateId: string, aggregateType: string, eventType: string, data: T, metadata: EventMetadata, eventVersion?: number): EventEnvelope<T>;
//# sourceMappingURL=EventEnvelope.d.ts.map