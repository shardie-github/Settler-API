-- Event Sourcing Foundation Migration
-- This migration creates the event store and snapshot tables for event sourcing

-- ============================================================================
-- 1. EVENT STORE TABLE
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
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  -- Indexes for common queries
  CONSTRAINT event_store_metadata_check CHECK (
    metadata ? 'tenant_id' AND metadata ? 'user_id' AND metadata ? 'timestamp' AND metadata ? 'correlation_id'
  )
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate ON event_store(aggregate_id, aggregate_type, created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_type ON event_store(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_tenant ON event_store(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_correlation ON event_store((metadata->>'correlation_id'), created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_causation ON event_store((metadata->>'causation_id'), created_at);
CREATE INDEX IF NOT EXISTS idx_event_store_created_at ON event_store(created_at DESC);

-- Composite index for aggregate replay
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate_replay ON event_store(aggregate_id, aggregate_type, id);

-- ============================================================================
-- 2. SNAPSHOT TABLE
-- ============================================================================

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

-- Indexes for snapshot queries
CREATE INDEX IF NOT EXISTS idx_snapshots_aggregate ON snapshots(aggregate_id, aggregate_type, snapshot_version DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_tenant ON snapshots(tenant_id, created_at);

-- ============================================================================
-- 3. SAGA STATE TABLE
-- ============================================================================

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

-- Indexes for saga queries
CREATE INDEX IF NOT EXISTS idx_saga_state_saga_id ON saga_state(saga_id, saga_type);
CREATE INDEX IF NOT EXISTS idx_saga_state_status ON saga_state(status, next_retry_at) WHERE status IN ('running', 'failed');
CREATE INDEX IF NOT EXISTS idx_saga_state_timeout ON saga_state(timeout_at) WHERE status = 'running' AND timeout_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saga_state_tenant ON saga_state(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_saga_state_correlation ON saga_state(correlation_id);

-- ============================================================================
-- 4. DEAD LETTER QUEUE TABLE
-- ============================================================================

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

-- Indexes for dead letter queue
CREATE INDEX IF NOT EXISTS idx_dlq_unresolved ON dead_letter_queue(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dlq_tenant ON dead_letter_queue(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dlq_saga ON dead_letter_queue(saga_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY FOR EVENT STORE
-- ============================================================================

ALTER TABLE event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE saga_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their tenant's events
CREATE POLICY tenant_isolation_event_store ON event_store
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- RLS Policy: Users can only see their tenant's snapshots
CREATE POLICY tenant_isolation_snapshots ON snapshots
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- RLS Policy: Users can only see their tenant's saga state
CREATE POLICY tenant_isolation_saga_state ON saga_state
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- RLS Policy: Users can only see their tenant's dead letter queue
CREATE POLICY tenant_isolation_dlq ON dead_letter_queue
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- 6. FUNCTIONS FOR EVENT STORE OPERATIONS
-- ============================================================================

-- Function to get latest snapshot for an aggregate
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

-- Function to get events after a snapshot
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

-- Function to get all events for an aggregate (for replay without snapshot)
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
