-- ============================================================================
-- FEEDBACK SYSTEM TABLE
-- ============================================================================
-- VOC: Voice-of-Customer feedback collection and aggregation

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('sales_call', 'user_interview', 'support_ticket', 'github_issue', 'community', 'survey')),
  persona VARCHAR(50) CHECK (persona IN ('cto', 'cfo', 'finance_ops', 'developer')),
  company VARCHAR(255),
  context JSONB DEFAULT '{}'::jsonb,
  pain JSONB NOT NULL,
  desired_outcome JSONB NOT NULL,
  workaround JSONB,
  quotes TEXT[],
  feature_requests JSONB[],
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tenant_id ON feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_persona ON feedback(persona);
CREATE INDEX IF NOT EXISTS idx_feedback_tags ON feedback USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON feedback(user_id, created_at DESC);
