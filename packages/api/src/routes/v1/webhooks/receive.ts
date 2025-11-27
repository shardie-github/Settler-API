/**
 * Webhook Receive Routes
 * 
 * Endpoints for receiving webhooks from payment providers
 */

import { Router, Request, Response } from 'express';
import { WebhookIngestionService } from '../../../application/webhooks/WebhookIngestionService';
import { sendSuccess, sendError } from '../../../utils/api-response';
import { AuthRequest } from '../../../middleware/auth';

const router = Router();
const webhookService = new WebhookIngestionService();

/**
 * POST /api/v1/webhooks/receive/:adapter
 * Receive webhook from payment provider
 */
router.post(
  '/:adapter',
  async (req: Request, res: Response) => {
    try {
      const { adapter } = req.params;
      const tenantId = req.headers['x-tenant-id'] as string || req.body.tenant_id;
      
      if (!tenantId) {
        return sendError(res, 'Bad Request', 'Tenant ID required', 400);
      }

      // Get signature from headers (provider-specific)
      const signature = req.headers['x-signature'] || 
                       req.headers['stripe-signature'] ||
                       req.headers['paypal-transmission-sig'] ||
                       req.headers['x-square-signature'] ||
                       req.headers['x-square-hmacsha256-signature'] ||
                       '';

      // Get webhook secret from config or database
      const secret = await getWebhookSecret(adapter, tenantId);
      
      if (!secret) {
        return sendError(res, 'Unauthorized', 'Webhook secret not configured', 401);
      }

      // Process webhook
      const result = await webhookService.processWebhook(
        adapter,
        req.body,
        signature as string,
        secret,
        tenantId
      );

      if (!result.success) {
        return sendError(res, 'Processing Failed', result.errors?.join(', ') || 'Failed to process webhook', 400);
      }

      sendSuccess(res, { 
        processed: true, 
        events: result.events.length 
      });
    } catch (error: any) {
      sendError(res, 'Internal Server Error', error.message || 'Failed to process webhook', 500);
    }
  }
);

/**
 * Get webhook secret from database
 */
async function getWebhookSecret(adapter: string, tenantId: string): Promise<string | null> {
  const { query } = require('../../../db');
  const result = await query(
    `SELECT secret FROM webhook_configs WHERE adapter = $1 LIMIT 1`,
    [adapter]
  );
  return result.length > 0 ? result[0].secret : null;
}

export default router;
