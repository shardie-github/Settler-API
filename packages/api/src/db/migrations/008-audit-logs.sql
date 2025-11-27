-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
-- UX-006: Complete audit trail for compliance and trust

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  event VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_timestamp ON audit_logs(event, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON audit_logs USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs((metadata->>'resourceType'), (metadata->>'resourceId'));

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all user actions and system events';
COMMENT ON COLUMN audit_logs.event IS 'Event type (e.g., job_created, api_key_regenerated, exception_resolved)';
COMMENT ON COLUMN audit_logs.metadata IS 'Event-specific metadata including resourceType and resourceId';
COMMENT ON COLUMN audit_logs.ip IS 'IP address of the request (for security audit)';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string (for security audit)';
