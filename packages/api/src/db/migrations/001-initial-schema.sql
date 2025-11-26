-- ============================================================================
-- SETTLER API - INITIAL DATABASE SCHEMA
-- ============================================================================
-- This migration creates the complete database schema for Settler API
-- Run this on a fresh PostgreSQL database to set up all tables, indexes,
-- functions, and security policies.
--
-- Prerequisites:
-- - PostgreSQL 14+ with uuid-ossp extension
-- - Database user with CREATE TABLE, INDEX, FUNCTION privileges
--
-- Usage:
--   psql -U postgres -d settler -f 001-initial-schema.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TENANTS TABLE (Multi-tenancy foundation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  tier VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  quotas JSONB NOT NULL DEFAULT '{
    "rateLimitRpm": 1000,
    "storageBytes": 1073741824,
    "concurrentJobs": 5,
    "monthlyReconciliations": 1000,
    "customDomains": 0
  }'::jsonb,
  config JSONB NOT NULL DEFAULT '{
    "customDomainVerified": false,
    "dataResidencyRegion": "us",
    "enableAdvancedMatching": false,
    "enableMLFeatures": false,
    "webhookTimeout": 30000,
    "maxRetries": 3
  }'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_parent ON tenants(parent_tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_tier ON tenants(tier);
CREATE INDEX IF NOT EXISTS idx_tenants_deleted ON tenants(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants USING GIN ((config->'customDomain'));

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'developer',
  data_residency_region VARCHAR(10) DEFAULT 'us',
  data_retention_days INTEGER DEFAULT 365,
  deleted_at TIMESTAMP,
  deletion_scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(tenant_id, LOWER(email));

-- ============================================================================
-- 3. API KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  key_prefix VARCHAR(20) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  scopes TEXT[] DEFAULT ARRAY['jobs:read', 'jobs:write', 'reports:read'],
  rate_limit INTEGER DEFAULT 1000,
  ip_whitelist TEXT[],
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active_tenant ON api_keys(tenant_id, created_at DESC) WHERE revoked_at IS NULL;

-- ============================================================================
-- 4. JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  source_adapter VARCHAR(100) NOT NULL,
  source_config_encrypted TEXT NOT NULL,
  target_adapter VARCHAR(100) NOT NULL,
  target_config_encrypted TEXT NOT NULL,
  rules JSONB NOT NULL,
  schedule VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_status ON jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_created_at ON jobs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant_status_created ON jobs(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_active_tenant_created ON jobs(tenant_id, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_rules_gin ON jobs USING GIN (rules);
CREATE INDEX IF NOT EXISTS idx_jobs_list_covering ON jobs(tenant_id, created_at DESC) INCLUDE (id, name, status, source_adapter, target_adapter);
CREATE INDEX IF NOT EXISTS idx_jobs_cursor_pagination ON jobs(tenant_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_name_lower ON jobs(tenant_id, LOWER(name));

-- ============================================================================
-- 5. EXECUTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'running',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error TEXT,
  summary JSONB,
  duration_ms BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_job_id ON executions(job_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_tenant_id ON executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_executions_tenant_status_started ON executions(tenant_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_job_status_started ON executions(job_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_running_tenant_started ON executions(tenant_id, started_at DESC) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_executions_failed_tenant_started ON executions(tenant_id, started_at DESC) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_executions_summary_gin ON executions USING GIN (summary);
CREATE INDEX IF NOT EXISTS idx_executions_list_covering ON executions(tenant_id, started_at DESC) INCLUDE (id, job_id, status, completed_at);
CREATE INDEX IF NOT EXISTS idx_executions_cursor_pagination ON executions(tenant_id, started_at DESC, id DESC);

-- ============================================================================
-- 6. MATCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  source_id VARCHAR(255) NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2),
  currency VARCHAR(10),
  confidence DECIMAL(3, 2),
  matched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_job_id ON matches(job_id);
CREATE INDEX IF NOT EXISTS idx_matches_execution_id ON matches(execution_id);
CREATE INDEX IF NOT EXISTS idx_matches_source_id ON matches(source_id);
CREATE INDEX IF NOT EXISTS idx_matches_target_id ON matches(target_id);
CREATE INDEX IF NOT EXISTS idx_matches_job_status ON matches(job_id, confidence);
CREATE INDEX IF NOT EXISTS idx_matches_tenant_id ON matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_matches_tenant_execution ON matches(tenant_id, execution_id, matched_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_tenant_job_confidence ON matches(tenant_id, job_id, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_matches_cursor_pagination ON matches(tenant_id, matched_at DESC, id DESC);

-- ============================================================================
-- 7. UNMATCHED TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS unmatched (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  source_id VARCHAR(255),
  target_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(10),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unmatched_job_id ON unmatched(job_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_execution_id ON unmatched(execution_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_tenant_id ON unmatched(tenant_id);
CREATE INDEX IF NOT EXISTS idx_unmatched_tenant_execution ON unmatched(tenant_id, execution_id, created_at DESC);

-- ============================================================================
-- 8. REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  date_range_start TIMESTAMP,
  date_range_end TIMESTAMP,
  summary JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_job_id ON reports(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_execution_id ON reports(execution_id);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_id ON reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_execution ON reports(tenant_id, execution_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_date_range ON reports(tenant_id, date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_reports_summary_gin ON reports USING GIN (summary);

-- ============================================================================
-- 9. WEBHOOKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant_id ON webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active_tenant ON webhooks(tenant_id, created_at DESC) WHERE status = 'active';

-- ============================================================================
-- 10. WEBHOOK PAYLOADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_payloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter VARCHAR(100) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  signature VARCHAR(255),
  received_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_payloads_adapter ON webhook_payloads(adapter);
CREATE INDEX IF NOT EXISTS idx_webhook_payloads_processed ON webhook_payloads(processed, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_payloads_tenant_id ON webhook_payloads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_payloads_payload_gin ON webhook_payloads USING GIN (payload);

-- ============================================================================
-- 11. WEBHOOK DELIVERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50),
  status_code INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_pending_retry ON webhook_deliveries(webhook_id, next_retry_at) WHERE status = 'failed' AND next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_payload_gin ON webhook_deliveries USING GIN (payload);

-- ============================================================================
-- 12. WEBHOOK CONFIGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_configs (
  adapter VARCHAR(100) PRIMARY KEY,
  secret VARCHAR(255) NOT NULL,
  signature_algorithm VARCHAR(50) DEFAULT 'hmac-sha256',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 13. AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  event VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  ip VARCHAR(45),
  user_agent TEXT,
  method VARCHAR(10),
  path VARCHAR(500),
  status_code INTEGER,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_event_timestamp ON audit_logs(tenant_id, event, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON audit_logs USING GIN (metadata);

-- ============================================================================
-- 14. IDEMPOTENCY KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_user_key ON idempotency_keys(user_id, key);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_tenant_id ON idempotency_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_active_tenant ON idempotency_keys(tenant_id, created_at DESC) WHERE expires_at > NOW();

-- ============================================================================
-- 15. SECURITY TABLES
-- ============================================================================

-- Revoked tokens table (for JWT revocation)
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti VARCHAR(255) PRIMARY KEY,
  revoked_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);

-- Blocked IPs table (for incident response)
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip VARCHAR(45) NOT NULL,
  reason TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  blocked_at TIMESTAMP DEFAULT NOW(),
  unblocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ip, tenant_id) WHERE unblocked_at IS NULL
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_tenant_id ON blocked_ips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(ip) WHERE unblocked_at IS NULL;

-- Security events table (enhanced audit logging)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  ip VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_id ON security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

-- ============================================================================
-- 16. TENANT USAGE TRACKING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- 'reconciliation', 'storage', 'api_call', 'job_execution'
  metric_value BIGINT NOT NULL DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, metric_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_id ON tenant_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON tenant_usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_type ON tenant_usage(metric_type);

-- Real-time quota tracking
CREATE TABLE IF NOT EXISTS tenant_quota_usage (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  current_storage_bytes BIGINT DEFAULT 0,
  current_concurrent_jobs INTEGER DEFAULT 0,
  current_monthly_reconciliations INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 17. FEATURE FLAGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0, -- 0-100 for A/B testing
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = global flag
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = tenant-level flag
  conditions JSONB DEFAULT '{}'::jsonb, -- Additional conditions for targeting
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE(name, tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant_id ON feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_user_id ON feature_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled) WHERE deleted_at IS NULL;

-- Feature flag audit log
CREATE TABLE IF NOT EXISTS feature_flag_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_changes_flag_id ON feature_flag_changes(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_changes_created_at ON feature_flag_changes(created_at);

-- ============================================================================
-- 18. EVENT SOURCING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_store (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_version INTEGER NOT NULL DEFAULT 1,
  data JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_store_aggregate ON event_store(aggregate_id, aggregate_type, created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_type ON event_store(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_tenant ON event_store(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_correlation ON event_store((metadata->>'correlation_id'), created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_causation ON event_store((metadata->>'causation_id'), created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_created_at ON event_store(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate_replay ON event_store(aggregate_id, aggregate_type, id);

CREATE TABLE IF NOT EXISTS snapshots (
  id BIGSERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  snapshot_data JSONB NOT NULL,
  snapshot_version INTEGER NOT NULL,
  event_id UUID NOT NULL REFERENCES event_store(event_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(aggregate_id, aggregate_type, snapshot_version)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_aggregate ON snapshots(aggregate_id, aggregate_type, snapshot_version DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_tenant ON snapshots(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS saga_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saga_id VARCHAR(255) NOT NULL,
  saga_type VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  current_step VARCHAR(100) NOT NULL,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT 'running', -- running, completed, failed, cancelled, compensating
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP,
  timeout_at TIMESTAMP,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  correlation_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE(saga_id, saga_type)
);

CREATE INDEX IF NOT EXISTS idx_saga_state_saga_id ON saga_state(saga_id, saga_type);
CREATE INDEX IF NOT EXISTS idx_saga_state_status ON saga_state(status, next_retry_at) WHERE status IN ('running', 'failed');
CREATE INDEX IF NOT EXISTS idx_saga_state_timeout ON saga_state(timeout_at) WHERE status = 'running' AND timeout_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saga_state_tenant ON saga_state(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_saga_state_correlation ON saga_state(correlation_id);

CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saga_id VARCHAR(255),
  event_id UUID REFERENCES event_store(event_id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  payload JSONB NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  correlation_id UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_dlq_unresolved ON dead_letter_queue(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dlq_tenant ON dead_letter_queue(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dlq_saga ON dead_letter_queue(saga_id);

-- ============================================================================
-- 19. CQRS PROJECTIONS TABLES
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
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE saga_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_hotspots_view ENABLE ROW LEVEL SECURITY;

-- Create a function to get current tenant context
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT current_setting('app.current_tenant_id', true)::UUID;
$$ LANGUAGE sql STABLE;

-- RLS Policies for tenant isolation
CREATE POLICY tenant_isolation_users ON users FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_jobs ON jobs FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_executions ON executions FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_matches ON matches FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_unmatched ON unmatched FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_reports ON reports FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_webhooks ON webhooks FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_api_keys ON api_keys FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_webhook_payloads ON webhook_payloads FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_audit_logs ON audit_logs FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_idempotency_keys ON idempotency_keys FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_tenant_usage ON tenant_usage FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_tenant_quota_usage ON tenant_quota_usage FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_event_store ON event_store FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_snapshots ON snapshots FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_saga_state ON saga_state FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_dlq ON dead_letter_queue FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_reconciliation_summary ON reconciliation_summary FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_tenant_usage_view ON tenant_usage_view FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_error_hotspots_view ON error_hotspots_view FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- 21. TRIGGERS FOR AUTOMATIC TENANT_ID PROPAGATION
-- ============================================================================

-- Function to propagate tenant_id from user to jobs
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_jobs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_tenant_id BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_jobs();

-- Function to propagate tenant_id from job to executions
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_executions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_execution_tenant_id BEFORE INSERT OR UPDATE ON executions
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_executions();

-- Function to propagate tenant_id from job to matches
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_matches()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_match_tenant_id BEFORE INSERT OR UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_matches();

-- Function to propagate tenant_id from job to unmatched
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_unmatched()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_unmatched_tenant_id BEFORE INSERT OR UPDATE ON unmatched
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_unmatched();

-- Function to propagate tenant_id from job to reports
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_reports()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM jobs WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_report_tenant_id BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_reports();

-- Function to propagate tenant_id from user to webhooks
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_webhooks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_webhook_tenant_id BEFORE INSERT OR UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_webhooks();

-- Function to propagate tenant_id from user to api_keys
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_api_keys()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_api_key_tenant_id BEFORE INSERT OR UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_api_keys();

-- Function to propagate tenant_id from user to idempotency_keys
CREATE OR REPLACE FUNCTION propagate_tenant_id_to_idempotency_keys()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_idempotency_key_tenant_id BEFORE INSERT OR UPDATE ON idempotency_keys
  FOR EACH ROW EXECUTE FUNCTION propagate_tenant_id_to_idempotency_keys();

-- ============================================================================
-- 22. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip VARCHAR(45), p_tenant_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_ips
    WHERE ip = p_ip
      AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
      AND unblocked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired revoked tokens
CREATE OR REPLACE FUNCTION cleanup_expired_revoked_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM revoked_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check if tenant has exceeded quota
CREATE OR REPLACE FUNCTION check_tenant_quota(
  p_tenant_id UUID,
  p_quota_type TEXT,
  p_requested_value BIGINT DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_quota_limit BIGINT;
  v_current_usage BIGINT;
  v_quotas JSONB;
BEGIN
  SELECT quotas INTO v_quotas FROM tenants WHERE id = p_tenant_id AND deleted_at IS NULL;
  
  IF v_quotas IS NULL THEN
    RETURN false;
  END IF;
  
  CASE p_quota_type
    WHEN 'rateLimitRpm' THEN
      RETURN true;
    WHEN 'storageBytes' THEN
      v_quota_limit := (v_quotas->>'storageBytes')::BIGINT;
      SELECT COALESCE(current_storage_bytes, 0) INTO v_current_usage
      FROM tenant_quota_usage WHERE tenant_id = p_tenant_id;
      RETURN (v_current_usage + p_requested_value) <= v_quota_limit;
    WHEN 'concurrentJobs' THEN
      v_quota_limit := (v_quotas->>'concurrentJobs')::BIGINT;
      SELECT COALESCE(current_concurrent_jobs, 0) INTO v_current_usage
      FROM tenant_quota_usage WHERE tenant_id = p_tenant_id;
      RETURN (v_current_usage + p_requested_value) <= v_quota_limit;
    WHEN 'monthlyReconciliations' THEN
      v_quota_limit := (v_quotas->>'monthlyReconciliations')::BIGINT;
      SELECT COALESCE(SUM(metric_value), 0) INTO v_current_usage
      FROM tenant_usage
      WHERE tenant_id = p_tenant_id
        AND metric_type = 'reconciliation'
        AND period_start >= date_trunc('month', NOW());
      RETURN (v_current_usage + p_requested_value) <= v_quota_limit;
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment quota usage
CREATE OR REPLACE FUNCTION increment_tenant_quota_usage(
  p_tenant_id UUID,
  p_quota_type TEXT,
  p_value BIGINT DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO tenant_quota_usage (tenant_id, current_storage_bytes, current_concurrent_jobs, updated_at)
  VALUES (p_tenant_id, 0, 0, NOW())
  ON CONFLICT (tenant_id) DO UPDATE SET
    current_storage_bytes = CASE
      WHEN p_quota_type = 'storageBytes' THEN tenant_quota_usage.current_storage_bytes + p_value
      ELSE tenant_quota_usage.current_storage_bytes
    END,
    current_concurrent_jobs = CASE
      WHEN p_quota_type = 'concurrentJobs' THEN tenant_quota_usage.current_concurrent_jobs + p_value
      ELSE tenant_quota_usage.current_concurrent_jobs
    END,
    updated_at = NOW();
    
  IF p_quota_type = 'reconciliation' THEN
    INSERT INTO tenant_usage (tenant_id, metric_type, metric_value, period_start, period_end)
    VALUES (
      p_tenant_id,
      'reconciliation',
      p_value,
      date_trunc('month', NOW()),
      date_trunc('month', NOW()) + INTERVAL '1 month'
    )
    ON CONFLICT (tenant_id, metric_type, period_start) DO UPDATE SET
      metric_value = tenant_usage.metric_value + p_value;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Event store helper functions
CREATE OR REPLACE FUNCTION get_latest_snapshot(
  p_aggregate_id UUID,
  p_aggregate_type VARCHAR(100)
)
RETURNS TABLE (
  snapshot_data JSONB,
  snapshot_version INTEGER,
  event_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.snapshot_data, s.snapshot_version, s.event_id
  FROM snapshots s
  WHERE s.aggregate_id = p_aggregate_id
    AND s.aggregate_type = p_aggregate_type
  ORDER BY s.snapshot_version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_events_after_snapshot(
  p_aggregate_id UUID,
  p_aggregate_type VARCHAR(100),
  p_snapshot_version INTEGER
)
RETURNS TABLE (
  event_id UUID,
  event_type VARCHAR(100),
  event_version INTEGER,
  data JSONB,
  metadata JSONB,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.event_id, e.event_type, e.event_version, e.data, e.metadata, e.created_at
  FROM event_store e
  WHERE e.aggregate_id = p_aggregate_id
    AND e.aggregate_type = p_aggregate_type
    AND e.id > (
      SELECT id FROM event_store
      WHERE event_id = (
        SELECT event_id FROM snapshots
        WHERE aggregate_id = p_aggregate_id
          AND aggregate_type = p_aggregate_type
          AND snapshot_version = p_snapshot_version
        LIMIT 1
      )
    )
  ORDER BY e.id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_all_events_for_aggregate(
  p_aggregate_id UUID,
  p_aggregate_type VARCHAR(100)
)
RETURNS TABLE (
  event_id UUID,
  event_type VARCHAR(100),
  event_version INTEGER,
  data JSONB,
  metadata JSONB,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.event_id, e.event_type, e.event_version, e.data, e.metadata, e.created_at
  FROM event_store e
  WHERE e.aggregate_id = p_aggregate_id
    AND e.aggregate_type = p_aggregate_type
  ORDER BY e.id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 23. UPDATE TABLE STATISTICS
-- ============================================================================

ANALYZE tenants;
ANALYZE users;
ANALYZE jobs;
ANALYZE executions;
ANALYZE matches;
ANALYZE unmatched;
ANALYZE reports;
ANALYZE webhooks;
ANALYZE audit_logs;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The database schema is now ready for use.
-- Next steps:
-- 1. Create initial tenant and admin user
-- 2. Configure environment variables
-- 3. Start the API server
-- ============================================================================
