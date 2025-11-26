# Observability Guide

This document describes Settler's observability stack: metrics, traces, and logs.

## Architecture

Settler uses the following observability stack:
- **Metrics**: Prometheus + Grafana
- **Traces**: OpenTelemetry (OTLP) → Jaeger/Tempo
- **Logs**: Winston → JSON structured logs → ELK/Loki

## Metrics (RED Method)

### Request Metrics (Rate, Errors, Duration)

**HTTP Request Duration** (`http_request_duration_seconds`)
- Histogram with buckets: [0.1, 0.5, 1, 2, 5, 10] seconds
- Labels: `method`, `route`, `status_code`, `tenant_id`, `tier`
- Target: p95 < 200ms

**HTTP Request Total** (`http_requests_total`)
- Counter
- Labels: `method`, `route`, `status_code`, `tenant_id`, `tier`

**HTTP Request Errors** (`http_request_errors_total`)
- Counter
- Labels: `method`, `route`, `error_type`, `tenant_id`, `tier`

### Business Metrics

**Reconciliations Total** (`reconciliations_total`)
- Counter
- Labels: `job_id`, `status`, `tenant_id`, `tier`

**Reconciliation Duration** (`reconciliation_duration_seconds`)
- Histogram
- Labels: `job_id`, `tenant_id`, `tier`
- Buckets: [1, 5, 10, 30, 60, 300] seconds

**Match Rate** (`match_rate`)
- Gauge
- Calculated: `matched_count / total_records`

### System Metrics

**Active Connections** (`active_connections`)
- Gauge
- Database connection pool usage

**Queue Depth** (`queue_depth`)
- Gauge
- Labels: `queue_name`, `priority`, `tenant_id`

**Tenant Quota Usage** (`tenant_quota_usage`)
- Gauge
- Labels: `tenant_id`, `quota_type`, `tier`

## Prometheus Queries

### Error Rate
```promql
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])
```

### p95 Latency by Endpoint
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (route)
```

### Reconciliation Success Rate
```promql
rate(reconciliations_total{status="completed"}[10m]) / rate(reconciliations_total[10m])
```

### Database Connection Pool Usage
```promql
active_connections / pg_stat_database_max_connections
```

### Queue Backlog
```promql
queue_depth
```

### Tenant Resource Usage
```promql
sum(tenant_resource_usage_seconds_sum) by (tenant_id) / sum(tenant_resource_usage_seconds_sum)
```

## Grafana Dashboards

### API Performance Dashboard

**Panels:**
1. Request Rate (RPS) - Line graph
2. Error Rate (%) - Line graph
3. Latency (p50/p95/p99) - Line graph
4. Status Code Distribution - Pie chart
5. Top Slow Endpoints - Table

**Queries:**
```promql
# Request rate
sum(rate(http_requests_total[5m])) by (route)

# Error rate
sum(rate(http_request_errors_total[5m])) / sum(rate(http_requests_total[5m]))

# p95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (route)
```

### Business Metrics Dashboard

**Panels:**
1. Reconciliations/Hour - Line graph
2. Match Rate (%) - Line graph
3. Failure Rate (%) - Line graph
4. Average Reconciliation Duration - Line graph
5. Top Tenants by Usage - Table

**Queries:**
```promql
# Reconciliations per hour
sum(rate(reconciliations_total[1h])) by (tenant_id)

# Match rate
sum(rate(reconciliations_total{status="completed"}[10m])) / sum(rate(reconciliations_total[10m]))

# Average duration
avg(reconciliation_duration_seconds) by (tenant_id)
```

### System Health Dashboard

**Panels:**
1. Database Connection Pool - Gauge
2. Queue Depth - Line graph
3. Cache Hit Rate - Line graph
4. External API Latency - Line graph
5. Error Rate by Type - Bar chart

## Distributed Tracing

### OpenTelemetry Setup

Settler uses OpenTelemetry for distributed tracing:

```typescript
import { initializeTracing } from './infrastructure/observability/tracing';

// Initialize at startup
initializeTracing();
```

### Instrumentation

**HTTP Server Spans**
- Automatically instrumented via `@opentelemetry/auto-instrumentations-node`
- Spans created for each HTTP request
- Attributes: `http.method`, `http.route`, `http.status_code`, `tenant.id`

**Database Spans**
```typescript
import { traceDatabase } from './infrastructure/observability/tracing';

await traceDatabase('select_jobs', query, async () => {
  return await query('SELECT * FROM jobs WHERE tenant_id = $1', [tenantId]);
}, tenantId);
```

**Cache Spans**
```typescript
import { traceCache } from './infrastructure/observability/tracing';

await traceCache('get', cacheKey, async () => {
  return await cache.get(cacheKey);
}, tenantId);
```

**Business Spans**
```typescript
import { traceBusiness } from './infrastructure/observability/tracing';

await traceBusiness('reconciliation.process', async (span) => {
  span.setAttribute('job.id', jobId);
  span.setAttribute('record.count', recordCount);
  // ... reconciliation logic
}, { job_id: jobId }, tenantId);
```

### Trace Context Propagation

Trace IDs are automatically propagated via:
- HTTP headers: `X-Trace-Id`
- OpenTelemetry context
- Log correlation (trace_id, span_id in logs)

## Structured Logging

### Log Format

All logs are JSON structured with the following fields:
- `timestamp`: ISO 8601 timestamp
- `level`: info, warn, error, debug
- `message`: Log message
- `trace_id`: OpenTelemetry trace ID
- `span_id`: OpenTelemetry span ID
- `tenant_id`: Tenant identifier
- `service`: Service name (settler-api)
- `environment`: Environment (development, staging, production)

### Log Levels

- **ERROR**: Always logged (no sampling)
- **WARN**: Sampled based on `LOG_SAMPLING_RATE`
- **INFO**: Sampled based on `LOG_SAMPLING_RATE`
- **DEBUG**: Sampled based on `LOG_SAMPLING_RATE`

### Log Sampling

Configure via `LOG_SAMPLING_RATE` environment variable:
- `1.0`: Log everything (default for production)
- `0.1`: Log 10% of non-error logs (for high-volume environments)

### PII Redaction

Sensitive fields are automatically redacted:
- API keys, secrets, passwords
- Credit card numbers
- Email addresses (configurable)
- Personal identifiers

### Example Log Entry

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Job created",
  "trace_id": "a1b2c3d4e5f6g7h8",
  "span_id": "i9j0k1l2m3n4o5p6",
  "tenant_id": "tenant-123",
  "service": "settler-api",
  "environment": "production",
  "job_id": "job-456",
  "user_id": "user-789"
}
```

## Log Queries (ELK/Loki)

### Find Errors for a Trace
```
trace_id:"a1b2c3d4e5f6g7h8" AND level:error
```

### Find Slow Requests
```
duration_ms:>200 AND level:info
```

### Find Errors by Tenant
```
tenant_id:"tenant-123" AND level:error
```

### Find Reconciliation Failures
```
message:"reconciliation.*failed" AND tenant_id:"tenant-123"
```

## Best Practices

1. **Always include tenant_id** in logs and metrics
2. **Use structured logging** (JSON format)
3. **Correlate logs with traces** (include trace_id)
4. **Sample high-volume logs** (INFO/DEBUG)
5. **Never log PII** (use redaction)
6. **Set appropriate log levels** (ERROR for errors, INFO for business events)
7. **Use business event logging** for important events:
   ```typescript
   logBusinessEvent('reconciliation.completed', {
     tenant_id: tenantId,
     job_id: jobId,
     execution_id: executionId,
     match_count: 100,
   });
   ```

## Monitoring Checklist

- [ ] Prometheus metrics endpoint exposed (`/metrics`)
- [ ] Grafana dashboards configured
- [ ] Alert rules configured (see ALERTS.md)
- [ ] OpenTelemetry tracing enabled
- [ ] Log aggregation configured (ELK/Loki)
- [ ] Log sampling configured for high-volume
- [ ] PII redaction enabled
- [ ] Trace context propagation working
- [ ] Business metrics tracked
- [ ] Performance metrics tracked (RED)
