import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission, requireResourceOwnership } from "../middleware/authorization";
import { query } from "../db";
import { verifyWebhookSignature, generateWebhookSignature } from "../utils/webhook-signature";
import { validateExternalUrl } from "../infrastructure/security/SSRFProtection";
import { logInfo, logError, logWarn } from "../utils/logger";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiting for webhook receive endpoint
const webhookReceiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Per adapter per IP
  keyGenerator: (req) => `webhook:${req.params.adapter}:${req.ip}`,
  message: "Too many webhook requests",
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const createWebhookSchema = z.object({
  body: z.object({
    url: z.string().url(),
    events: z.array(z.string()),
    secret: z.string().optional(),
  }),
});

const getWebhookSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Create webhook endpoint with SSRF protection
router.post(
  "/",
  requirePermission("webhooks", "create"),
  validateRequest(createWebhookSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { url, events, secret } = req.body;
      const userId = req.userId!;

      // Validate webhook URL (SSRF protection)
      const isValidUrl = await validateExternalUrl(url);
      if (!isValidUrl) {
        return res.status(400).json({
          error: "Invalid Webhook URL",
          message: "URL must be HTTPS and cannot point to internal/private IP addresses",
        });
      }

      // Generate secret if not provided
      const webhookSecret = secret || `whsec_${require('crypto').randomBytes(32).toString('base64url')}`;

      const result = await query<{ id: string }>(
        `INSERT INTO webhooks (user_id, url, events, secret, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING id`,
        [userId, url, events, webhookSecret]
      );

      const webhookId = result[0].id;

      // Log audit event
      await query(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        [
          'webhook_created',
          userId,
          JSON.stringify({ webhookId, url: url.substring(0, 50) }), // Don't log full URL
        ]
      );

      logInfo('Webhook created', { webhookId, userId });

      res.status(201).json({
        data: {
          id: webhookId,
          userId,
          url,
          events,
          status: "active",
          createdAt: new Date().toISOString(),
        },
        message: "Webhook created successfully",
      });
    } catch (error: any) {
      logError('Failed to create webhook', error, { userId: req.userId });
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create webhook",
      });
    }
  }
);

// List webhooks with pagination
router.get(
  "/",
  requirePermission("webhooks", "read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
      const offset = (page - 1) * limit;

      const [webhooks, totalResult] = await Promise.all([
        query<{
          id: string;
          url: string;
          events: string[];
          status: string;
          created_at: Date;
        }>(
          `SELECT id, url, events, status, created_at
           FROM webhooks
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3`,
          [userId, limit, offset]
        ),
        query<{ count: string }>(
          `SELECT COUNT(*) as count FROM webhooks WHERE user_id = $1`,
          [userId]
        ),
      ]);

      const total = parseInt(totalResult[0].count);

      res.json({
        data: webhooks.map(w => ({
          id: w.id,
          userId,
          url: w.url,
          events: w.events,
          status: w.status,
          createdAt: w.created_at.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      logError('Failed to fetch webhooks', error, { userId: req.userId });
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch webhooks",
      });
    }
  }
);

// Webhook endpoint for receiving external webhooks with signature verification
router.post(
  "/receive/:adapter",
  webhookReceiveLimiter,
  async (req: Request, res: Response) => {
    try {
      const { adapter } = req.params;
      const signature = req.headers["x-webhook-signature"] as string;
      const timestamp = req.headers["x-webhook-timestamp"] as string;

      // Get raw body for signature verification
      const rawBody = JSON.stringify(req.body);

      // Verify timestamp (prevent replay attacks)
      if (timestamp) {
        const requestTime = parseInt(timestamp);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = Math.abs(currentTime - requestTime);

        if (timeDiff > 300) { // 5 minutes
          logWarn('Webhook timestamp too old', { adapter, timeDiff });
          return res.status(401).json({ error: "Request timestamp too old" });
        }
      }

      // Verify webhook signature
      if (!signature) {
        logWarn('Missing webhook signature', { adapter, ip: req.ip });
        return res.status(401).json({ error: "Missing webhook signature" });
      }

      try {
        const isValid = await verifyWebhookSignature(adapter, rawBody, signature);
        if (!isValid) {
          logWarn('Invalid webhook signature', { adapter, ip: req.ip });
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
      } catch (error: any) {
        logError('Webhook signature verification failed', error, { adapter });
        return res.status(400).json({ error: error.message });
      }

      // Store webhook payload for async processing
      await query(
        `INSERT INTO webhook_payloads (adapter, payload, signature, received_at)
         VALUES ($1, $2, $3, NOW())`,
        [adapter, JSON.stringify(req.body), signature]
      );

      // Queue for async processing (in production, use Bull/Redis queue)
      // For now, acknowledge immediately
      logInfo('Webhook received', { adapter, ip: req.ip });

      res.status(202).json({
        received: true,
        message: "Webhook received and queued for processing",
      });
    } catch (error: any) {
      logError('Failed to process webhook', error, { adapter: req.params.adapter });
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to process webhook",
      });
    }
  }
);

// Delete webhook
router.delete(
  "/:id",
  requirePermission("webhooks", "delete"),
  validateRequest(getWebhookSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // Check ownership
      await new Promise<void>((resolve, reject) => {
        requireResourceOwnership(req, res, (err?: any) => {
          if (err) reject(err);
          else resolve();
        }, 'webhook', id);
      });

      await query(
        `DELETE FROM webhooks WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      // Log audit event
      await query(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        [
          'webhook_deleted',
          userId,
          JSON.stringify({ webhookId: id }),
        ]
      );

      logInfo('Webhook deleted', { webhookId: id, userId });

      res.status(204).send();
    } catch (error: any) {
      logError('Failed to delete webhook', error, { userId: req.userId, webhookId: req.params.id });
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to delete webhook",
      });
    }
  }
);

export { router as webhooksRouter };
