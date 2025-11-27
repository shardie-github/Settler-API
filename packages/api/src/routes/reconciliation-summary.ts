/**
 * Reconciliation Summary Route
 * Optimized endpoint using materialized views and caching
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { Permission } from '../infrastructure/security/Permissions';
import { apiGatewayCache, cacheConfigs } from '../middleware/api-gateway-cache';
import { cacheInvalidation } from '../middleware/api-gateway-cache';
import { getReconciliationSummary, getJobPerformance, getMatchAccuracy } from '../infrastructure/query-optimization';
import { sendSuccess, sendError } from '../utils/api-response';
import { logError } from '../utils/logger';
import { handleRouteError } from '../utils/error-handler';

const router = Router();

const getSummarySchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
  query: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    useView: z.string().transform((val) => val === 'true').optional(),
    refreshView: z.string().transform((val) => val === 'true').optional(),
  }),
});

// Get reconciliation summary (cached, uses materialized view)
router.get(
  '/:jobId',
  requirePermission(Permission.REPORTS_READ),
  apiGatewayCache(cacheConfigs.reconciliationSummary()),
  validateRequest(getSummarySchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const { start, end, useView = true, refreshView = false } = req.query;

      const dateRange = start && end
        ? { start: new Date(start as string), end: new Date(end as string) }
        : undefined;

      const summary = await getReconciliationSummary(jobId, dateRange, {
        useMaterializedView: useView as boolean,
        refreshView: refreshView as boolean,
        cache: true,
        cacheTtl: 60,
      });

      sendSuccess(res, summary, 'Reconciliation summary retrieved successfully');
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get reconciliation summary', 500, { jobId: req.params.jobId });
    }
  }
);

// Get job performance metrics
router.get(
  '/:jobId/performance',
  requirePermission(Permission.REPORTS_READ),
  apiGatewayCache({ ttl: 300, includeUserId: true }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const performance = await getJobPerformance(jobId, {
        useMaterializedView: true,
        cache: true,
      });

      if (!performance) {
        return sendError(res, 'Not Found', 'Job performance data not found', 404);
      }

      sendSuccess(res, performance, 'Job performance retrieved successfully');
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get job performance', 500, { jobId: req.params.jobId });
    }
  }
);

// Get match accuracy
router.get(
  '/:jobId/accuracy',
  requirePermission(Permission.REPORTS_READ),
  apiGatewayCache({ ttl: 300, includeUserId: true }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { jobId } = req.params;
      const accuracy = await getMatchAccuracy(jobId, {
        useMaterializedView: true,
        cache: true,
      });

      if (!accuracy) {
        return sendError(res, 'Not Found', 'Match accuracy data not found', 404);
      }

      sendSuccess(res, accuracy, 'Match accuracy retrieved successfully');
    } catch (error: unknown) {
      handleRouteError(res, error, 'Failed to get match accuracy', 500, { jobId: req.params.jobId });
    }
  }
);

export { router as reconciliationSummaryRouter };
