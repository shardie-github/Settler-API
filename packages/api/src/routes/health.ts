import { Router, Request, Response } from "express";
import { query } from "../db";
import { pool } from "../db";
import { logError } from "../utils/logger";
import { HealthCheckService } from "../infrastructure/observability/health";

const router = Router();
const healthCheckService = new HealthCheckService();

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  error?: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await query('SELECT 1');
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkConnectionPool(): Promise<HealthCheck> {
  try {
    const totalConnections = pool.totalCount;
    const idleConnections = pool.idleCount;
    const waitingCount = pool.waitingCount;
    
    const utilization = (totalConnections - idleConnections) / pool.options.max!;
    
    if (utilization > 0.9) {
      return {
        status: 'degraded',
        error: `High connection pool utilization: ${(utilization * 100).toFixed(1)}%`,
      };
    }
    
    if (waitingCount > 0) {
      return {
        status: 'degraded',
        error: `${waitingCount} connections waiting`,
      };
    }
    
    return { status: 'healthy' };
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message };
  }
}

// Basic health check (liveness probe)
router.get("/", async (req: Request, res: Response) => {
  const health = await healthCheckService.checkLive();
  res.json({
    status: health.status,
    timestamp: new Date().toISOString(),
    service: "settler-api",
    version: "1.0.0",
  });
});

// Detailed health check with dependency checks
router.get("/detailed", async (req: Request, res: Response) => {
  const health = await healthCheckService.checkAll();
  res.status(health.status === 'healthy' ? 200 : 503).json({
    status: health.status,
    checks: health.checks,
    timestamp: health.timestamp,
    service: "settler-api",
    version: "1.0.0",
  });
});

// Liveness probe (always returns OK if process is alive)
router.get("/live", async (req: Request, res: Response) => {
  const health = await healthCheckService.checkLive();
  res.status(200).json(health);
});

// Readiness probe (returns ready only if dependencies are healthy)
router.get("/ready", async (req: Request, res: Response) => {
  const health = await healthCheckService.checkReady();
  res.status(health.status === 'ready' ? 200 : 503).json(health);
});

export { router as healthRouter };
