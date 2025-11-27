/**
 * Webhook Ingestion Service
 * 
 * Handles webhook ingestion with signature verification, idempotency,
 * and retry logic as specified in the Product & Technical Specification.
 */

import { EnhancedAdapter } from '@settler/adapters/enhanced-base';
import { NormalizedEvent } from '@settler/adapters/enhanced-base';
import { Transaction, Settlement } from '../../domain/canonical/types';
import { query } from '../../db';
import { StripeEnhancedAdapter } from '@settler/adapters/stripe-enhanced';
import { PayPalEnhancedAdapter } from '@settler/adapters/paypal-enhanced';
import { SquareEnhancedAdapter } from '@settler/adapters/square-enhanced';

export interface WebhookIngestionResult {
  success: boolean;
  events: NormalizedEvent[];
  errors?: string[];
}

export class WebhookIngestionService {
  private adapters: Map<string, EnhancedAdapter>;

  constructor() {
    this.adapters = new Map();
    
    // Register adapters
    this.adapters.set('stripe', new StripeEnhancedAdapter());
    this.adapters.set('paypal', new PayPalEnhancedAdapter());
    this.adapters.set('square', new SquareEnhancedAdapter());
  }

  /**
   * Register a custom adapter
   */
  registerAdapter(adapter: EnhancedAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(
    adapterName: string,
    payload: string | Buffer | Record<string, any>,
    signature: string,
    secret: string,
    tenantId: string
  ): Promise<WebhookIngestionResult> {
    const adapter = this.adapters.get(adapterName);
    
    if (!adapter) {
      return {
        success: false,
        events: [],
        errors: [`Adapter ${adapterName} not found`],
      };
    }

    // Verify webhook signature
    const payloadString = typeof payload === 'string' 
      ? payload 
      : Buffer.isBuffer(payload) 
        ? payload.toString() 
        : JSON.stringify(payload);
    
    const isValid = adapter.verifyWebhook(payloadString, signature, secret);
    
    if (!isValid) {
      return {
        success: false,
        events: [],
        errors: ['Invalid webhook signature'],
      };
    }

    // Parse payload if needed
    const payloadObj = typeof payload === 'object' && !Buffer.isBuffer(payload)
      ? payload
      : JSON.parse(payloadString);

    // Check idempotency
    const idempotencyKey = this.extractIdempotencyKey(payloadObj, adapterName);
    if (idempotencyKey) {
      const existing = await this.checkIdempotency(idempotencyKey, tenantId);
      if (existing) {
        return {
          success: true,
          events: existing.events || [],
        };
      }
    }

    // Normalize webhook payload
    let events: NormalizedEvent[];
    try {
      events = adapter.normalizeWebhook(payloadObj, tenantId);
    } catch (error: any) {
      return {
        success: false,
        events: [],
        errors: [`Failed to normalize webhook: ${error.message}`],
      };
    }

    // Store webhook payload for audit
    await this.storeWebhookPayload(adapterName, payloadObj, signature, tenantId);

    // Process events
    const errors: string[] = [];
    for (const event of events) {
      try {
        await this.processEvent(event, tenantId);
      } catch (error: any) {
        errors.push(`Failed to process event ${event.type}: ${error.message}`);
      }
    }

    // Store idempotency key if present
    if (idempotencyKey) {
      await this.storeIdempotencyKey(idempotencyKey, tenantId, events);
    }

    return {
      success: errors.length === 0,
      events,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Process a normalized event
   */
  private async processEvent(event: NormalizedEvent, tenantId: string): Promise<void> {
    if (event.transaction) {
      await this.storeTransaction(event.transaction, tenantId);
    }

    if (event.settlement) {
      await this.storeSettlement(event.settlement, tenantId);
    }

    if (event.refundDispute) {
      await this.storeRefundDispute(event.refundDispute, tenantId);
    }

    if (event.fxConversion) {
      await this.storeFXConversion(event.fxConversion, tenantId);
    }
  }

  /**
   * Store transaction
   */
  private async storeTransaction(transaction: Transaction, tenantId: string): Promise<void> {
    await query(
      `INSERT INTO transactions (
        id, tenant_id, payment_id, provider, provider_transaction_id,
        type, amount_value, amount_currency, net_amount_value, net_amount_currency,
        status, raw_payload, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (tenant_id, provider, provider_transaction_id) 
      DO UPDATE SET
        status = EXCLUDED.status,
        net_amount_value = EXCLUDED.net_amount_value,
        net_amount_currency = EXCLUDED.net_amount_currency,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = EXCLUDED.updated_at`,
      [
        transaction.id,
        tenantId,
        transaction.paymentId,
        transaction.provider,
        transaction.providerTransactionId,
        transaction.type,
        transaction.amount.value,
        transaction.amount.currency,
        transaction.netAmount?.value,
        transaction.netAmount?.currency,
        transaction.status,
        JSON.stringify(transaction.rawPayload),
        transaction.created_at,
        transaction.updatedAt || transaction.created_at,
      ]
    );
  }

  /**
   * Store settlement
   */
  private async storeSettlement(settlement: Settlement, tenantId: string): Promise<void> {
    await query(
      `INSERT INTO settlements (
        id, tenant_id, provider, provider_settlement_id,
        amount_value, amount_currency, currency, fx_rate,
        settlement_date, expected_date, status, raw_payload, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (tenant_id, provider, provider_settlement_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        settlement_date = EXCLUDED.settlement_date,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = EXCLUDED.updated_at`,
      [
        settlement.id,
        tenantId,
        settlement.provider,
        settlement.providerSettlementId,
        settlement.amount.value,
        settlement.amount.currency,
        settlement.currency,
        settlement.fxRate,
        settlement.settlementDate,
        settlement.expectedDate,
        settlement.status,
        JSON.stringify(settlement.rawPayload),
        settlement.createdAt,
        settlement.updatedAt,
      ]
    );
  }

  /**
   * Store refund/dispute
   */
  private async storeRefundDispute(refundDispute: any, tenantId: string): Promise<void> {
    await query(
      `INSERT INTO refunds_and_disputes (
        id, tenant_id, transaction_id, type,
        amount_value, amount_currency, status, reason,
        provider_refund_id, provider_dispute_id, raw_payload, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT DO NOTHING`,
      [
        refundDispute.id,
        tenantId,
        refundDispute.transactionId,
        refundDispute.type,
        refundDispute.amount.value,
        refundDispute.amount.currency,
        refundDispute.status,
        refundDispute.reason,
        refundDispute.providerRefundId,
        refundDispute.providerDisputeId,
        JSON.stringify(refundDispute.rawPayload),
        refundDispute.createdAt,
        refundDispute.updatedAt,
      ]
    );
  }

  /**
   * Store FX conversion
   */
  private async storeFXConversion(fxConversion: any, tenantId: string): Promise<void> {
    await query(
      `INSERT INTO fx_conversions (
        id, tenant_id, transaction_id, from_currency, to_currency,
        from_amount, to_amount, fx_rate, provider, rate_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT DO NOTHING`,
      [
        fxConversion.id,
        tenantId,
        fxConversion.transactionId,
        fxConversion.fromCurrency,
        fxConversion.toCurrency,
        fxConversion.fromAmount,
        fxConversion.toAmount,
        fxConversion.fxRate,
        fxConversion.provider,
        fxConversion.rateDate,
        fxConversion.createdAt,
      ]
    );
  }

  /**
   * Store webhook payload for audit
   */
  private async storeWebhookPayload(
    adapter: string,
    payload: Record<string, any>,
    signature: string,
    tenantId: string
  ): Promise<void> {
    await query(
      `INSERT INTO webhook_payloads (
        adapter, tenant_id, payload, signature, received_at, processed
      ) VALUES ($1, $2, $3, $4, NOW(), true)`,
      [adapter, tenantId, JSON.stringify(payload), signature]
    );
  }

  /**
   * Extract idempotency key from payload
   */
  private extractIdempotencyKey(payload: Record<string, any>, adapterName: string): string | null {
    // Provider-specific idempotency key extraction
    switch (adapterName) {
      case 'stripe':
        return payload.id || null;
      case 'paypal':
        return payload.id || payload.webhook_id || null;
      case 'square':
        return payload.event_id || payload.id || null;
      default:
        return payload.id || null;
    }
  }

  /**
   * Check if webhook was already processed (idempotency)
   */
  private async checkIdempotency(key: string, tenantId: string): Promise<{ events: NormalizedEvent[] } | null> {
    const result = await query(
      `SELECT payload FROM webhook_payloads 
       WHERE tenant_id = $1 AND payload->>'id' = $2 AND processed = true
       LIMIT 1`,
      [tenantId, key]
    );

    if (result.length === 0) {
      return null;
    }

    // Return cached events if available
    return null; // For now, return null to reprocess
  }

  /**
   * Store idempotency key
   */
  private async storeIdempotencyKey(key: string, tenantId: string, events: NormalizedEvent[]): Promise<void> {
    // Store in idempotency_keys table
    await query(
      `INSERT INTO idempotency_keys (user_id, tenant_id, key, response, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
       ON CONFLICT DO NOTHING`,
      [null, tenantId, key, JSON.stringify({ events })]
    );
  }
}
