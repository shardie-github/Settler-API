/**
 * Prometheus Metrics
 * Exports Prometheus-compatible metrics
 */

import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// HTTP Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
  registers: [register],
});

// Business Metrics
export const reconciliationsTotal = new Counter({
  name: 'reconciliations_total',
  help: 'Total number of reconciliations performed',
  labelNames: ['job_id', 'status'],
  registers: [register],
});

export const reconciliationsDuration = new Histogram({
  name: 'reconciliation_duration_seconds',
  help: 'Duration of reconciliation jobs in seconds',
  labelNames: ['job_id'],
  buckets: [1, 5, 10, 30, 60, 300],
  registers: [register],
});

export const webhookProcessingDuration = new Histogram({
  name: 'webhook_processing_duration_seconds',
  help: 'Duration of webhook processing in seconds',
  labelNames: ['adapter', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const webhookDeliveriesTotal = new Counter({
  name: 'webhook_deliveries_total',
  help: 'Total number of webhook deliveries',
  labelNames: ['status', 'status_code'],
  registers: [register],
});

// System Metrics
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active database connections',
  registers: [register],
});

export const queueDepth = new Gauge({
  name: 'queue_depth',
  help: 'Number of items in processing queue',
  labelNames: ['queue_name'],
  registers: [register],
});

export const apiKeyUsageTotal = new Counter({
  name: 'api_key_usage_total',
  help: 'Total API key usage',
  labelNames: ['api_key_id', 'user_id'],
  registers: [register],
});

// Register default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });
