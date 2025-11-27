-- ============================================================================
-- EVENTS TRACKING TABLE
-- ============================================================================
-- Tracks business events for analytics, dashboards, and product insights
-- Used by Operator-in-a-Box blueprint for activation, usage, revenue tracking

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  event_name VARCHAR(255) NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_name_timestamp ON events(event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_tenant_timestamp ON events(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_name_timestamp ON events(user_id, event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_properties_gin ON events USING GIN (properties);

-- Partition by month for performance (optional, can be added later)
-- CREATE TABLE events_2026_01 PARTITION OF events
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Common event names (for reference):
-- Marketing: PageViewed, SignupStarted, SignupCompleted, EmailVerified, WaitlistJoined
-- Product: APIKeyCreated, IntegrationConfigured, JobCreated, EventIngested, ReconciliationRun, ReconciliationSuccess, ReconciliationError, ExportTriggered
-- Billing: PlanChanged, InvoiceGenerated, PaymentSucceeded, PaymentFailed, QuotaExceeded, OverageCharged
-- Support: SupportTicketCreated, DocumentationViewed, ExampleCopied, PlaygroundUsed, TutorialCompleted
