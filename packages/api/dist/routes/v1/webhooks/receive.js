"use strict";
/**
 * Webhook Receive Routes
 *
 * Endpoints for receiving webhooks from payment providers
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WebhookIngestionService_1 = require("../../../application/webhooks/WebhookIngestionService");
const api_response_1 = require("../../../utils/api-response");
const error_handler_1 = require("../../../utils/error-handler");
const router = (0, express_1.Router)();
const webhookService = new WebhookIngestionService_1.WebhookIngestionService();
/**
 * POST /api/v1/webhooks/receive/:adapter
 * Receive webhook from payment provider
 */
router.post('/:adapter', async (req, res) => {
    try {
        const { adapter } = req.params;
        const tenantId = req.headers['x-tenant-id'] || req.body.tenant_id;
        if (!tenantId) {
            return (0, api_response_1.sendError)(res, 'Bad Request', 'Tenant ID required', 400);
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
            return (0, api_response_1.sendError)(res, 'Unauthorized', 'Webhook secret not configured', 401);
        }
        // Process webhook
        const result = await webhookService.processWebhook(adapter, req.body, signature, secret, tenantId);
        if (!result.success) {
            return (0, api_response_1.sendError)(res, 'Processing Failed', result.errors?.join(', ') || 'Failed to process webhook', 400);
        }
        (0, api_response_1.sendSuccess)(res, {
            processed: true,
            events: result.events.length
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, 'Failed to process webhook', 500);
    }
});
/**
 * Get webhook secret from database
 */
async function getWebhookSecret(adapter, tenantId) {
    const { query } = require('../../../db');
    const result = await query(`SELECT secret FROM webhook_configs WHERE adapter = $1 LIMIT 1`, [adapter]);
    return result.length > 0 ? result[0].secret : null;
}
exports.default = router;
//# sourceMappingURL=receive.js.map