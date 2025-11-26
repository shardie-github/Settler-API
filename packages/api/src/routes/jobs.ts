import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// Validation schemas
const createJobSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    source: z.object({
      adapter: z.string(),
      config: z.record(z.any()),
    }),
    target: z.object({
      adapter: z.string(),
      config: z.record(z.any()),
    }),
    rules: z.object({
      matching: z.array(z.object({
        field: z.string(),
        type: z.enum(["exact", "fuzzy", "range"]),
        tolerance: z.number().optional(),
        days: z.number().optional(),
        threshold: z.number().optional(),
      })),
      conflictResolution: z.enum(["first-wins", "last-wins", "manual-review"]).optional(),
    }),
    schedule: z.string().optional(), // Cron expression
  }),
});

const getJobSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Create reconciliation job
router.post(
  "/",
  validateRequest(createJobSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, source, target, rules, schedule } = req.body;
      const userId = req.userId || "anonymous";

      // In production, save to database
      const job = {
        id: `job_${Date.now()}`,
        userId,
        name,
        source,
        target,
        rules,
        schedule,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.status(201).json({
        data: job,
        message: "Reconciliation job created successfully",
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create reconciliation job",
      });
    }
  }
);

// Get all jobs
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || "anonymous";
    
    // In production, fetch from database
    const jobs = [
      {
        id: "job_123",
        userId,
        name: "Shopify-Stripe Reconciliation",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({
      data: jobs,
      count: jobs.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch jobs",
    });
  }
});

// Get job by ID
router.get(
  "/:id",
  validateRequest(getJobSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId || "anonymous";

      // In production, fetch from database
      const job = {
        id,
        userId,
        name: "Shopify-Stripe Reconciliation",
        source: {
          adapter: "shopify",
          config: {},
        },
        target: {
          adapter: "stripe",
          config: {},
        },
        rules: {
          matching: [
            { field: "order_id", type: "exact" },
            { field: "amount", type: "exact", tolerance: 0.01 },
          ],
          conflictResolution: "last-wins",
        },
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      res.json({ data: job });
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to fetch job",
      });
    }
  }
);

// Trigger job execution
router.post(
  "/:id/run",
  validateRequest(getJobSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // In production, queue job execution
      const execution = {
        id: `exec_${Date.now()}`,
        jobId: id,
        status: "running",
        startedAt: new Date().toISOString(),
      };

      res.status(202).json({
        data: execution,
        message: "Job execution started",
      });
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to start job execution",
      });
    }
  }
);

// Delete job
router.delete(
  "/:id",
  validateRequest(getJobSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      // In production, delete from database
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to delete job",
      });
    }
  }
);

export { router as jobsRouter };
