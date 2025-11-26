/**
 * Health Check Service
 * Provides comprehensive health checks for all dependencies
 */

import { query } from '../../db';
import { logError } from '../../utils/logger';
import { createClient } from 'redis';

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  error?: string;
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: HealthCheck;
    redis?: HealthCheck;
    [key: string]: HealthCheck | undefined;
  };
  timestamp: string;
}

export class HealthCheckService {
  private redisClient: ReturnType<typeof createClient> | null = null;

  constructor() {
    // Initialize Redis client if URL is provided
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redisClient = createClient({ url: redisUrl });
      this.redisClient.on('error', (err) => {
        logError('Redis client error', err);
      });
    }
  }

  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await query('SELECT 1');
      const latency = Date.now() - start;
      return {
        status: 'healthy',
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    if (!this.redisClient) {
      return {
        status: 'degraded',
        error: 'Redis not configured',
        timestamp: new Date().toISOString(),
      };
    }

    const start = Date.now();
    try {
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }
      await this.redisClient.ping();
      const latency = Date.now() - start;
      return {
        status: 'healthy',
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkAll(): Promise<HealthStatus> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.redisClient ? this.checkRedis() : Promise.resolve<HealthCheck>({
        status: 'degraded',
        error: 'Redis not configured',
        timestamp: new Date().toISOString(),
      }),
    ]);

    const checks = {
      database,
      redis,
    };

    const allHealthy = Object.values(checks).every(
      (check) => check.status === 'healthy'
    );
    const anyUnhealthy = Object.values(checks).some(
      (check) => check.status === 'unhealthy'
    );

    const overallStatus = anyUnhealthy
      ? 'unhealthy'
      : allHealthy
      ? 'healthy'
      : 'degraded';

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  async checkLive(): Promise<{ status: 'ok' }> {
    // Liveness check - always returns OK if process is alive
    return { status: 'ok' };
  }

  async checkReady(): Promise<{ status: 'ready' | 'not_ready' }> {
    // Readiness check - only returns ready if critical dependencies are healthy
    const health = await this.checkAll();
    return {
      status: health.status === 'healthy' ? 'ready' : 'not_ready',
    };
  }
}
