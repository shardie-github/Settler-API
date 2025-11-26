/**
 * Real-time Updates Route
 * WebSocket/SSE endpoint for reconciliation status updates
 */

import { Router, Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';
import { logInfo, logError } from '../utils/logger';

const router = Router();

// Store active SSE connections
const sseConnections = new Map<string, Response>();

/**
 * GET /api/v1/realtime/reconciliations/:jobId
 * Server-Sent Events (SSE) endpoint for reconciliation status updates
 */
router.get(
  '/reconciliations/:jobId',
  async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const tenantId = req.tenantId || req.userId;

    // Verify job ownership
    const jobs = await query(
      `SELECT id FROM jobs WHERE id = $1 AND tenant_id = $2`,
      [jobId, tenantId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Store connection
    const connectionId = `${tenantId}-${jobId}-${Date.now()}`;
    sseConnections.set(connectionId, res);

    logInfo('SSE connection established', { connectionId, jobId, tenantId });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', jobId })}\n\n`);

    // Poll for updates every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        // Check if connection is still alive
        if (res.destroyed || res.closed) {
          clearInterval(pollInterval);
          sseConnections.delete(connectionId);
          return;
        }

        // Fetch latest execution status
        const executions = await query(
          `
            SELECT 
              id,
              status,
              started_at,
              completed_at,
              error,
              summary
            FROM executions
            WHERE job_id = $1 AND tenant_id = $2
            ORDER BY started_at DESC
            LIMIT 1
          `,
          [jobId, tenantId]
        );

        if (executions.length > 0) {
          const execution = executions[0];
          const update = {
            type: 'execution_update',
            executionId: execution.id,
            status: execution.status,
            startedAt: execution.started_at,
            completedAt: execution.completed_at,
            error: execution.error,
            summary: execution.summary,
          };

          res.write(`data: ${JSON.stringify(update)}\n\n`);
        }
      } catch (error: any) {
        logError('SSE polling error', error, { connectionId, jobId });
        res.write(`event: error\ndata: ${JSON.stringify({ error: 'Polling failed' })}\n\n`);
      }
    }, 2000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(pollInterval);
      sseConnections.delete(connectionId);
      logInfo('SSE connection closed', { connectionId, jobId });
    });

    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(() => {
      if (!res.destroyed && !res.closed) {
        res.write(': heartbeat\n\n');
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Every 30 seconds

    req.on('close', () => {
      clearInterval(heartbeatInterval);
    });
  }
);

/**
 * Broadcast update to all connections for a job
 */
export function broadcastJobUpdate(jobId: string, tenantId: string, update: any) {
  const connections = Array.from(sseConnections.entries()).filter(
    ([id]) => id.includes(jobId) && id.includes(tenantId)
  );

  connections.forEach(([connectionId, res]) => {
    try {
      if (!res.destroyed && !res.closed) {
        res.write(`data: ${JSON.stringify(update)}\n\n`);
      } else {
        sseConnections.delete(connectionId);
      }
    } catch (error) {
      logError('Failed to broadcast update', error, { connectionId });
      sseConnections.delete(connectionId);
    }
  });
}

export { router as realtimeRouter };
