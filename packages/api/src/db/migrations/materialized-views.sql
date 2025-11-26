-- Materialized Views Migration
-- Pre-computed views for analytics and reporting queries

-- ============================================================================
-- 1. RECONCILIATION SUMMARY BY TENANT (DAILY)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_reconciliation_summary_daily AS
SELECT
  tenant_id,
  DATE(started_at) as date,
  COUNT(*) as total_reconciliations,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_reconciliations,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_reconciliations,
  AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as p50_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as p95_duration_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as p99_duration_ms,
  SUM((summary->>'matched_count')::INTEGER) FILTER (WHERE summary->>'matched_count' IS NOT NULL) as total_matches,
  SUM((summary->>'unmatched_source_count')::INTEGER) FILTER (WHERE summary->>'unmatched_source_count' IS NOT NULL) as total_unmatched_source,
  SUM((summary->>'unmatched_target_count')::INTEGER) FILTER (WHERE summary->>'unmatched_target_count' IS NOT NULL) as total_unmatched_target
FROM executions
WHERE started_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY tenant_id, DATE(started_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_reconciliation_summary_daily_unique 
  ON mv_reconciliation_summary_daily(tenant_id, date);

CREATE INDEX IF NOT EXISTS idx_mv_reconciliation_summary_daily_date 
  ON mv_reconciliation_summary_daily(date DESC);

-- ============================================================================
-- 2. JOB PERFORMANCE METRICS
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_job_performance AS
SELECT
  j.tenant_id,
  j.id as job_id,
  j.name as job_name,
  COUNT(e.id) as execution_count,
  COUNT(e.id) FILTER (WHERE e.status = 'completed') as success_count,
  COUNT(e.id) FILTER (WHERE e.status = 'failed') as failure_count,
  AVG(e.duration_ms) FILTER (WHERE e.duration_ms IS NOT NULL) as avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY e.duration_ms) FILTER (WHERE e.duration_ms IS NOT NULL) as p95_duration_ms,
  MAX(e.started_at) as last_execution_at,
  SUM((e.summary->>'matched_count')::INTEGER) FILTER (WHERE e.summary->>'matched_count' IS NOT NULL) as total_matches_all_time
FROM jobs j
LEFT JOIN executions e ON j.id = e.job_id
WHERE j.status = 'active'
GROUP BY j.tenant_id, j.id, j.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_job_performance_unique 
  ON mv_job_performance(tenant_id, job_id);

CREATE INDEX IF NOT EXISTS idx_mv_job_performance_tenant 
  ON mv_job_performance(tenant_id);

-- ============================================================================
-- 3. TENANT USAGE METRICS (HOURLY)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tenant_usage_hourly AS
SELECT
  tenant_id,
  DATE_TRUNC('hour', started_at) as hour,
  COUNT(*) as reconciliation_count,
  COUNT(*) FILTER (WHERE status = 'completed') as success_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failure_count,
  AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) as avg_duration_ms,
  SUM((summary->>'total_source_records')::INTEGER) FILTER (WHERE summary->>'total_source_records' IS NOT NULL) as total_source_records,
  SUM((summary->>'total_target_records')::INTEGER) FILTER (WHERE summary->>'total_target_records' IS NOT NULL) as total_target_records
FROM executions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tenant_id, DATE_TRUNC('hour', started_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tenant_usage_hourly_unique 
  ON mv_tenant_usage_hourly(tenant_id, hour);

CREATE INDEX IF NOT EXISTS idx_mv_tenant_usage_hourly_hour 
  ON mv_tenant_usage_hourly(hour DESC);

-- ============================================================================
-- 4. MATCH ACCURACY BY JOB
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_match_accuracy_by_job AS
SELECT
  m.tenant_id,
  m.job_id,
  COUNT(*) as total_matches,
  AVG(m.confidence) as avg_confidence,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY m.confidence) as median_confidence,
  COUNT(*) FILTER (WHERE m.confidence >= 0.95) as high_confidence_matches,
  COUNT(*) FILTER (WHERE m.confidence < 0.8) as low_confidence_matches,
  COUNT(DISTINCT m.execution_id) as execution_count
FROM matches m
WHERE m.matched_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY m.tenant_id, m.job_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_match_accuracy_by_job_unique 
  ON mv_match_accuracy_by_job(tenant_id, job_id);

CREATE INDEX IF NOT EXISTS idx_mv_match_accuracy_by_job_tenant 
  ON mv_match_accuracy_by_job(tenant_id);

-- ============================================================================
-- 5. REFRESH FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reconciliation_summary_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_job_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tenant_usage_hourly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_match_accuracy_by_job;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. AUTOMATIC REFRESH SCHEDULE (requires pg_cron)
-- ============================================================================

-- Refresh daily summary every hour
-- SELECT cron.schedule('refresh-daily-summary', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reconciliation_summary_daily');

-- Refresh hourly usage every 15 minutes
-- SELECT cron.schedule('refresh-hourly-usage', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tenant_usage_hourly');

-- Refresh job performance every hour
-- SELECT cron.schedule('refresh-job-performance', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_job_performance');

-- Refresh match accuracy daily
-- SELECT cron.schedule('refresh-match-accuracy', '0 2 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_match_accuracy_by_job');
