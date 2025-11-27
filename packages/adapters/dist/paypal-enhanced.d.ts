/**
 * Enhanced PayPal Adapter
 *
 * Implements webhook ingestion, API polling, and comprehensive normalization
 * as specified in the Product & Technical Specification.
 */
import { EnhancedAdapter } from './enhanced-base';
export declare class PayPalEnhancedAdapter implements EnhancedAdapter {
    name: string;
    version: string;
    private supportedVersions;
    /**
     * Verify webhook signature
     */
    verifyWebhook(payload: string | Buffer, signature: string, secret: string): boolean;
    /**
     * Normalize webhook payload to canonical format
     */
    normalizeWebhook(payload: Record<string, any>, tenantId: string): any;
}
//# sourceMappingURL=paypal-enhanced.d.ts.map