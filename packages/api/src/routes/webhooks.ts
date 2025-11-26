import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";

const router = Router();

const createWebhookSchema = z.object({
  body: z.object({
    url: z.string().url(),
    events: z.array(z.string()),
    secret: z.string().optional(),
  }),
});

// Create webhook endpoint
router.post(
  "/",
  validateRequest(createWebhookSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { url, events, secret } = req.body;
      const userId = req.userId || "anonymous";

      // In production, save to database
      const webhook = {
        id: `wh_${Date.now()}`,
        userId,
        url,
        events,
        secret: secret || `whsec_${Math.random().toString(36).substring(7)}`,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      res.status(201).json({
        data: webhook,
        message: "Webhook created successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create webhook",
      });
    }
  }
);

// List webhooks
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || "anonymous";
    
    // In production, fetch from database
    const webhooks = [
      {
        id: "wh_123",
        userId,
        url: "https://example.com/webhooks/reconcile",
        events: ["reconciliation.matched", "reconciliation.mismatch"],
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({
      data: webhooks,
      count: webhooks.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch webhooks",
    });
  }
});

// Webhook endpoint for receiving external webhooks (no auth required for this specific route)
router.post("/receive/:adapter", async (req: Request, res: Response) => {
  try {
    const { adapter } = req.params;
    const payload = req.body;

    // In production, validate webhook signature, queue for processing
    console.log(`Received webhook from ${adapter}:`, payload);

    // Acknowledge receipt immediately
    res.status(200).json({
      received: true,
      message: "Webhook received and queued for processing",
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to process webhook",
    });
  }
});

export { router as webhooksRouter };
