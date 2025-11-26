import { Router, Request, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";

const router = Router();

const getReportSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    format: z.enum(["json", "csv"]).optional(),
  }),
});

// Get reconciliation report
router.get(
  "/:jobId",
  validateRequest(getReportSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const { startDate, endDate, format = "json" } = req.query;

      // In production, generate report from database
      const report = {
        jobId,
        dateRange: {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString(),
        },
        summary: {
          matched: 145,
          unmatched: 3,
          errors: 1,
          accuracy: 98.7,
          totalTransactions: 149,
        },
        matches: [
          {
            id: "match_1",
            sourceId: "order_123",
            targetId: "payment_456",
            amount: 99.99,
            currency: "USD",
            matchedAt: new Date().toISOString(),
            confidence: 1.0,
          },
        ],
        unmatched: [
          {
            id: "unmatch_1",
            sourceId: "order_789",
            amount: 49.99,
            currency: "USD",
            reason: "No matching payment found",
          },
        ],
        errors: [
          {
            id: "error_1",
            message: "Webhook timeout",
            occurredAt: new Date().toISOString(),
          },
        ],
        generatedAt: new Date().toISOString(),
      };

      if (format === "csv") {
        // In production, convert to CSV
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="report-${jobId}.csv"`);
        res.send("id,sourceId,targetId,amount,currency,status\nmatch_1,order_123,payment_456,99.99,USD,matched\n");
      } else {
        res.json({ data: report });
      }
    } catch (error) {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to generate report",
      });
    }
  }
);

// Get report history
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || "anonymous";
    
    // In production, fetch from database
    const reports = [
      {
        id: "report_1",
        jobId: "job_123",
        summary: {
          matched: 145,
          unmatched: 3,
          accuracy: 98.7,
        },
        generatedAt: new Date().toISOString(),
      },
    ];

    res.json({
      data: reports,
      count: reports.length,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch reports",
    });
  }
});

export { router as reportsRouter };
