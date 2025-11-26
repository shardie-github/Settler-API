/**
 * Reconciliation Summary Endpoint
 * Optimized endpoint for fetching reconciliation summaries with caching
 */

import { Router, Request, Response } from 'express';
import { query } from '../db';
import { cacheKey, get, set } from '../utils/cache';
import { setCacheHeaders, cachePresets } from '../middleware/cache-headers';
import { etagMiddleware } from '../middleware/etag';
import { traceDatabase, traceBusiness } from '../infrastructure/observability/tracing';
import { httpRequestDuration } from '../infrastructure/observability/metrics';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Apply ETag middleware for cache validation
router.use(etagMiddleware);

/**
 * GET /api/v1/reconciliations/:jobId/summary
 * Get reconciliation summary for a job with caching
 */
router.get(
  '/:jobId/summary',
  async (req: AuthRequest, res: Response) => {
    const startTime = Date.now();
    const { jobId } = req.params;
    const tenantId = req.tenantId || req.userId; // Fallback if tenantId not set

    try {
      // Check cache first
      const cacheKeyStr = cacheKey('reconciliation_summary', tenantId, jobId);
      const cached = await get<any>(cacheKeyStr);

      if (cached) {
        // Set cache headers
        setCacheHeaders(res, cachePresets.short());
        res.setHeader('X-Cache', 'HIT');
        
        // Record metrics
        const duration = (Date.now() - startTime) / 1000;
        httpRequestDuration.observe(
          { method: 'GET', route: '/reconciliations/:jobId/summary', status_code: 200, tenant_id: tenantId },
          duration
        );

        return res.json({ data: cached });
      }

      // Fetch from database with optimized query
      const summary = await traceDatabase(
        'select_reconciliation_summary',
        `
          SELECT 
            e.id as execution_id,
            e.job_id,
            e.status,
            e.started_at,
            e.completed_at,
            EXTRACT(EPOCH FROM (e.completed_at - e.started_at)) * 1000 as duration_ms,
            e.summary->>'total_source_records' as total_source_records,
            e.summary->>'total_target_records' as total_target_records,
            e.summary->>'matched_count' as matched_count,
            e.summary->>'unmatched_source_count' as unmatched_source_count,
            e.summary->>'unmatched_target_count' as unmatched_target_count,
            e.summary->>'errors_count' as errors_count,
            e.summary->>'accuracy_percentage' as accuracy_percentage,
            COUNT(DISTINCT m.id) as match_count,
            COUNT(DISTINCT u.id) as unmatched_count
          FROM executions e
          LEFT JOIN matches m ON e.id = m.execution_id
          LEFT JOIN unmatched u ON e.id = u.execution_id
          WHERE e.job_id = $1 AND e.tenant_id = $2
          GROUP BY e.id, e.job_id, e.status, e.started_at, e.completed_at, e.summary
          ORDER BY e.started_at DESC
          LIMIT 1
        `,
        async () => {
          return await query(
            `
              SELECT 
                e.id as execution_id,
                e.job_id,
                e.status,
                e.started_at,
                e.completed_at,
                EXTRACT(EPOCH FROM (e.completed_at - e.started_at)) * 1000 as duration_ms,
                e.summary->>'total_source_records' as total_source_records,
                e.summary->>'total_target_records' as total_target_records,
                e.summary->>'matched_count' as matched_count,
                e.summary->>'unmatched_source_count' as unmatched_source_count,
                e.summary->>'unmatched_target_count' as unmatched_target_count,
                e.summary->>'errors_count' as errors_count,
                e.summary->>'accuracy_percentage' as accuracy_percentage,
                COUNT(DISTINCT m.id) as match_count,
                COUNT(DISTINCT u.id) as unmatched_count
              FROM executions e
              LEFT JOIN matches m ON e.id = m.execution_id
              LEFT JOIN unmatched u ON e.id = u.execution_id
              WHERE e.job_id = $1 AND e.tenant_id = $2
              GROUP BY e.id, e.job_id, e.status, e.started_at, e.completed_at, e.summary
              ORDER BY e.started_at DESC
              LIMIT 1
            `,
            [jobId, tenantId]
          );
        },
        tenantId
      );

      if (summary.length === 0) {
        return res.status(404).json({ error: 'Reconciliation summary not found' });
      }

      const result = {
        executionId: summary[0].execution_id,
        jobId: summary[0].job_id,
        status: summary[0].status,
        startedAt: summary[0].started_at,
        completedAt: summary[0].completed_at,
        durationMs: summary[0].duration_ms ? parseInt(summary[0].duration_ms, 10) : null,
        totalSourceRecords: summary[0].total_source_records ? parseInt(summary[0].total_source_records, 10) : 0,
        totalTargetRecords: summary[0].total_target_records ? parseInt(summary[0].total_target_records, 10) : 0,
        matchedCount: summary[0].matched_count ? parseInt(summary[0].matched_count, 10) : 0,
        unmatchedSourceCount: summary[0].unmatched_source_count ? parseInt(summary[0].unmatched_source_count, 10) : 0,
        unmatchedTargetCount: summary[0].unmatched_target_count ? parseInt(summary[0].unmatched_target_count, 10) : 0,
        errorsCount: summary[0].errors_count ? parseInt(summary[0].errors_count, 10) : 0,
        accuracyPercentage: summary[0].accuracy_percentage ? parseFloat(summary[0].accuracy_percentage) : null,
      };

      // Cache for 60 seconds (short cache for frequently changing data)
      await set(cacheKeyStr, result, 60);

      // Set cache headers
      setCacheHeaders(res, cachePresets.short());
      res.setHeader('X-Cache', 'MISS');

      // Record metrics
      const duration = (Date.now() - startTime) / 1000;
      httpRequestDuration.observe(
        { method: 'GET', route: '/reconciliations/:jobId/summary', status_code: 200, tenant_id: tenantId },
        duration
      );

      res.json({ data: result });
    } catch (error: any) {
      const duration = (Date.now() - startTime) / 1000;
      httpRequestDuration.observe(
        { method: 'GET', route: '/reconciliations/:jobId/summary', status_code: 500, tenant_id: tenantId },
        duration
      );

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch reconciliation summary',
      });
    }
  }
);

export { router as reconciliationSummaryRouter };
