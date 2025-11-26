/**
 * Structured Logging with OpenTelemetry Integration
 * JSON structured logs with trace_id, span_id, tenant_id
 */

import winston from 'winston';
import { redact } from './redaction';
import { trace, context } from '@opentelemetry/api';

// Get current trace and span IDs from OpenTelemetry context
function getTraceContext(): { trace_id?: string; span_id?: string } {
  const span = trace.getActiveSpan();
  if (!span) {
    return {};
  }

  const spanContext = span.spanContext();
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
}

// Custom format that adds trace context
const traceContextFormat = winston.format((info) => {
  const traceContext = getTraceContext();
  return {
    ...info,
    ...traceContext,
  };
})();

const logFormat = winston.format.combine(
  traceContextFormat,
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'settler-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, trace_id, span_id, tenant_id, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(redact(meta)) : '';
          const traceInfo = trace_id ? `[trace_id=${trace_id.substring(0, 16)}]` : '';
          const spanInfo = span_id ? `[span_id=${span_id.substring(0, 16)}]` : '';
          const tenantInfo = tenant_id ? `[tenant_id=${tenant_id}]` : '';
          return `${timestamp} [${level}]${traceInfo}${spanInfo}${tenantInfo}: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

// Log sampling configuration
const LOG_SAMPLING_RATE = parseFloat(process.env.LOG_SAMPLING_RATE || '1.0');

function shouldLog(): boolean {
  if (LOG_SAMPLING_RATE >= 1.0) {
    return true;
  }
  return Math.random() < LOG_SAMPLING_RATE;
}

// Helper to log with automatic redaction and trace context
export function logInfo(message: string, meta?: any) {
  if (!shouldLog()) {
    return;
  }
  logger.info(message, redact(meta));
}

export function logError(message: string, error?: any, meta?: any) {
  // Always log errors (no sampling)
  logger.error(message, {
    ...redact(meta),
    error: error?.message,
    stack: error?.stack,
  });
}

export function logWarn(message: string, meta?: any) {
  if (!shouldLog()) {
    return;
  }
  logger.warn(message, redact(meta));
}

export function logDebug(message: string, meta?: any) {
  if (!shouldLog()) {
    return;
  }
  logger.debug(message, redact(meta));
}

// Business event logging
export function logBusinessEvent(
  event: string,
  meta?: {
    tenant_id?: string;
    user_id?: string;
    job_id?: string;
    execution_id?: string;
    [key: string]: any;
  }
) {
  logger.info(`business_event:${event}`, {
    event_type: event,
    ...redact(meta),
  });
}

// Performance logging
export function logPerformance(
  operation: string,
  durationMs: number,
  meta?: {
    tenant_id?: string;
    [key: string]: any;
  }
) {
  logger.info(`performance:${operation}`, {
    operation,
    duration_ms: durationMs,
    ...redact(meta),
  });
}
