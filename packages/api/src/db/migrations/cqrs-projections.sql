-- CQRS Read Model Projections Migration
-- Creates tables for read model projections

-- ============================================================================
-- 1. RECONCILIATION SUMMARY PROJECTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS reconciliation_summary (
  reconciliation_id UUID PRIMARY KEY,
  job_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  total_source_records INTEGER DEFAULT 0,
  total_target_records INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_source_count INTEGER DEFAULT 0,
  unmatched_target_count INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms BIGINT,
  accuracy_percentage DECIMAL(5, 2),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_summary_job ON reconciliation_summary(job_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_summary_status ON reconciliation_summary(status);
CREATE INDEX IF NOT EXISTS idx_reconciliation_summary_tenant ON reconciliation_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_summary_started ON reconciliation_summary(started_at DESC);

-- ============================================================================
-- 2. TENANT USAGE VIEW PROJECTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_usage_view (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reconciliation_count INTEGER DEFAULT 0,
  total_duration_ms BIGINT DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  PRIMARY KEY (tenant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_date ON tenant_usage_view(date DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_date ON tenant_usage_view(tenant_id, date DESC);

-- ============================================================================
-- 3. ERROR HOTSPOTS VIEW PROJECTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS error_hotspots_view (
  reconciliation_id UUID NOT NULL,
  job_id UUID NOT NULL,
  error_type VARCHAR(100) NOT NULL,
  error_count INTEGER DEFAULT 1,
  step VARCHAR(100),
  first_occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  PRIMARY KEY (reconciliation_id, error_type, step)
);

CREATE INDEX IF NOT EXISTS idx_error_hotspots_job ON error_hotspots_view(job_id);
CREATE INDEX IF NOT EXISTS idx_error_hotspots_type ON error_hotspots_view(error_type);
CREATE INDEX IF NOT EXISTS idx_error_hotspots_step ON error_hotspots_view(step);
CREATE INDEX IF NOT EXISTS idx_error_hotspots_tenant ON error_hotspots_view(tenant_id);
CREATE INDEX IF NOT EXISTS idx_error_hotspots_last_occurred ON error_hotspots_view(last_occurred_at DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE reconciliation_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_hotspots_view ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_reconciliation_summary ON reconciliation_summary
  FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_tenant_usage_view ON tenant_usage_view
  FOR ALL
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_error_hotspots_view ON error_hotspots_view
  FOR ALL
  USING (tenant_id = current_tenant_id());
