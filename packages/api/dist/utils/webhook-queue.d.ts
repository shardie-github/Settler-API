/**
 * Webhook payload structure
 */
export interface WebhookPayload {
    event: string;
    data: Record<string, unknown>;
    timestamp: string;
    jobId?: string;
    executionId?: string;
    [key: string]: unknown;
}
interface WebhookDelivery {
    id: string;
    webhookId: string;
    url: string;
    payload: WebhookPayload;
    secret: string;
}
export declare function processWebhookDelivery(delivery: WebhookDelivery): Promise<void>;
export declare function processPendingWebhooks(): Promise<void>;
export declare function queueWebhookDelivery(webhookId: string, payload: any): Promise<string>;
export {};
//# sourceMappingURL=webhook-queue.d.ts.map