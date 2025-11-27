/**
 * Domain Event Base Class
 * All domain events extend this base class
 */
export declare abstract class DomainEvent {
    readonly occurredOn: Date;
    readonly eventId: string;
    constructor();
    abstract get eventName(): string;
}
/**
 * User Domain Events
 */
export declare class UserCreatedEvent extends DomainEvent {
    readonly userId: string;
    readonly email: string;
    constructor(userId: string, email: string);
    get eventName(): string;
}
export declare class UserDeletedEvent extends DomainEvent {
    readonly userId: string;
    constructor(userId: string);
    get eventName(): string;
}
/**
 * Job Domain Events
 */
export declare class JobCreatedEvent extends DomainEvent {
    readonly jobId: string;
    readonly userId: string;
    readonly name: string;
    constructor(jobId: string, userId: string, name: string);
    get eventName(): string;
}
export declare class JobUpdatedEvent extends DomainEvent {
    readonly jobId: string;
    readonly userId: string;
    readonly changes: Record<string, unknown>;
    constructor(jobId: string, userId: string, changes: Record<string, unknown>);
    get eventName(): string;
}
export declare class JobExecutionStartedEvent extends DomainEvent {
    readonly executionId: string;
    readonly jobId: string;
    constructor(executionId: string, jobId: string);
    get eventName(): string;
}
export declare class JobExecutionCompletedEvent extends DomainEvent {
    readonly executionId: string;
    readonly jobId: string;
    readonly summary: {
        matched: number;
        unmatched: number;
        errors: number;
    };
    constructor(executionId: string, jobId: string, summary: {
        matched: number;
        unmatched: number;
        errors: number;
    });
    get eventName(): string;
}
export declare class JobExecutionFailedEvent extends DomainEvent {
    readonly executionId: string;
    readonly jobId: string;
    readonly error: string;
    constructor(executionId: string, jobId: string, error: string);
    get eventName(): string;
}
/**
 * Webhook Domain Events
 */
export declare class WebhookReceivedEvent extends DomainEvent {
    readonly adapter: string;
    readonly payloadId: string;
    constructor(adapter: string, payloadId: string);
    get eventName(): string;
}
export declare class WebhookDeliveredEvent extends DomainEvent {
    readonly webhookId: string;
    readonly deliveryId: string;
    readonly statusCode: number;
    constructor(webhookId: string, deliveryId: string, statusCode: number);
    get eventName(): string;
}
export declare class WebhookDeliveryFailedEvent extends DomainEvent {
    readonly webhookId: string;
    readonly deliveryId: string;
    readonly error: string;
    readonly attempts: number;
    constructor(webhookId: string, deliveryId: string, error: string, attempts: number);
    get eventName(): string;
}
//# sourceMappingURL=DomainEvent.d.ts.map