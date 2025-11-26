import { Router, Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// List available adapters
router.get("/", async (req: Request, res: Response) => {
  try {
    const adapters = [
      {
        id: "stripe",
        name: "Stripe",
        description: "Reconcile Stripe payments and charges",
        version: "1.0.0",
        config: {
          required: ["apiKey"],
          optional: ["webhookSecret"],
        },
        supportedEvents: ["payment.succeeded", "charge.refunded"],
      },
      {
        id: "shopify",
        name: "Shopify",
        description: "Reconcile Shopify orders and transactions",
        version: "1.0.0",
        config: {
          required: ["apiKey", "shopDomain"],
          optional: ["webhookSecret"],
        },
        supportedEvents: ["order.created", "order.updated", "transaction.created"],
      },
      {
        id: "quickbooks",
        name: "QuickBooks",
        description: "Reconcile QuickBooks transactions",
        version: "1.0.0",
        config: {
          required: ["clientId", "clientSecret", "realmId"],
          optional: ["sandbox"],
        },
        supportedEvents: ["transaction.created", "transaction.updated"],
      },
      {
        id: "paypal",
        name: "PayPal",
        description: "Reconcile PayPal transactions",
        version: "1.0.0",
        config: {
          required: ["clientId", "clientSecret"],
          optional: ["sandbox"],
        },
        supportedEvents: ["payment.completed", "refund.completed"],
      },
    ];

    res.json({
      data: adapters,
      count: adapters.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch adapters",
    });
  }
});

// Get adapter details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // In production, fetch from adapter registry
    const adapter = {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      description: `Adapter for ${id}`,
      version: "1.0.0",
      config: {
        required: ["apiKey"],
        optional: [],
      },
      documentation: `https://docs.reconcilify.io/adapters/${id}`,
    };

    res.json({ data: adapter });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch adapter",
    });
  }
});

export { router as adaptersRouter };
