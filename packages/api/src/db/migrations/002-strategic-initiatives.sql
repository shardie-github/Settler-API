-- Strategic Initiatives Database Schema
-- Supabase PostgreSQL with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI vector database

-- ============================================================================
-- Continuous Reconciliation Graph
-- ============================================================================

-- Graph nodes (transactions, matches, etc.)
CREATE TABLE IF NOT EXISTS reconciliation_graph_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('transaction', 'match', 'unmatched', 'error')),
  source_id VARCHAR(255),
  target_id VARCHAR(255),
  data JSONB NOT NULL DEFAULT '{}',
  amount DECIMAL(10, 2),
  currency VARCHAR(10),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  confidence DECIMAL(3, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_job_id ON reconciliation_graph_nodes(job_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON reconciliation_graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_source_id ON reconciliation_graph_nodes(source_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_target_id ON reconciliation_graph_nodes(target_id);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_timestamp ON reconciliation_graph_nodes(timestamp);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_job_type ON reconciliation_graph_nodes(job_id, node_type);

-- Graph edges (relationships between nodes)
CREATE TABLE IF NOT EXISTS reconciliation_graph_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_node_id UUID NOT NULL REFERENCES reconciliation_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES reconciliation_graph_nodes(id) ON DELETE CASCADE,
  edge_type VARCHAR(50) NOT NULL CHECK (edge_type IN ('matches', 'conflicts', 'related', 'derived')),
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON reconciliation_graph_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON reconciliation_graph_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_type ON reconciliation_graph_edges(edge_type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_confidence ON reconciliation_graph_edges(confidence);

-- Enable Realtime for graph updates
ALTER PUBLICATION supabase_realtime ADD TABLE reconciliation_graph_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE reconciliation_graph_edges;

-- ============================================================================
-- Network Effects: Cross-Customer Intelligence
-- ============================================================================

-- Anonymized patterns (differential privacy)
CREATE TABLE IF NOT EXISTS network_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_hash VARCHAR(255) NOT NULL UNIQUE,
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('fraud', 'anomaly', 'performance', 'error')),
  frequency INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- Anonymized metadata only
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_patterns_hash ON network_patterns(pattern_hash);
CREATE INDEX IF NOT EXISTS idx_network_patterns_type ON network_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_network_patterns_frequency ON network_patterns(frequency DESC);

-- Customer pattern associations (for opt-in tracking)
CREATE TABLE IF NOT EXISTS customer_patterns (
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_id UUID NOT NULL REFERENCES network_patterns(id) ON DELETE CASCADE,
  opted_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_id, pattern_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_patterns_customer ON customer_patterns(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_patterns_pattern ON customer_patterns(pattern_id);

-- ============================================================================
-- Network Effects: Performance Tuning Pools
-- ============================================================================

-- Performance metrics (anonymized)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  adapter VARCHAR(100) NOT NULL,
  rule_type VARCHAR(100) NOT NULL,
  accuracy DECIMAL(3, 2) NOT NULL,
  latency_ms INTEGER NOT NULL,
  throughput_per_sec INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_customer ON performance_metrics(customer_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_adapter ON performance_metrics(adapter);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_rule_type ON performance_metrics(rule_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_adapter_rule ON performance_metrics(adapter, rule_type);

-- Performance insights (aggregated)
CREATE MATERIALIZED VIEW IF NOT EXISTS performance_insights AS
SELECT
  adapter,
  rule_type,
  AVG(accuracy) as avg_accuracy,
  AVG(latency_ms) as avg_latency,
  COUNT(*) as sample_size,
  MAX(timestamp) as last_updated
FROM performance_metrics
GROUP BY adapter, rule_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_insights_unique ON performance_insights(adapter, rule_type);

-- ============================================================================
-- Knowledge Management: Decision Logs
-- ============================================================================

-- Decision logs
CREATE TABLE IF NOT EXISTS decision_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  decision_makers TEXT[] NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('proposed', 'accepted', 'rejected', 'superseded')) DEFAULT 'proposed',
  context TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT NOT NULL,
  alternatives_considered JSONB DEFAULT '[]',
  expected_outcomes TEXT,
  actual_outcomes JSONB DEFAULT '[]',
  lessons_learned TEXT,
  related_decisions UUID[] DEFAULT '[]',
  tags TEXT[] DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_logs_status ON decision_logs(status);
CREATE INDEX IF NOT EXISTS idx_decision_logs_date ON decision_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_decision_logs_tags ON decision_logs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_decision_logs_decision_makers ON decision_logs USING GIN(decision_makers);
CREATE INDEX IF NOT EXISTS idx_decision_logs_search ON decision_logs USING GIN(to_tsvector('english', title || ' ' || context || ' ' || decision));

-- ============================================================================
-- Knowledge Management: AI Assistant (Vector Database)
-- ============================================================================

-- Knowledge base embeddings (for AI assistant)
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('decision', 'documentation', 'incident', 'pattern')),
  content_id UUID NOT NULL,
  content_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_type ON knowledge_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_content_id ON knowledge_embeddings(content_id);
-- Vector similarity search index (using pgvector)
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector ON knowledge_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- Compliance: Export System
-- ============================================================================

-- Compliance exports
CREATE TABLE IF NOT EXISTS compliance_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jurisdiction VARCHAR(50) NOT NULL CHECK (jurisdiction IN ('GDPR', 'CCPA', 'SOC2', 'PCI-DSS', 'HIPAA', 'custom')),
  format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'csv', 'xml', 'pdf')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  data JSONB DEFAULT '{}',
  download_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_compliance_exports_customer ON compliance_exports(customer_id);
CREATE INDEX IF NOT EXISTS idx_compliance_exports_status ON compliance_exports(status);
CREATE INDEX IF NOT EXISTS idx_compliance_exports_jurisdiction ON compliance_exports(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_compliance_exports_expires ON compliance_exports(expires_at);

-- ============================================================================
-- AI Agents: Infrastructure Optimizer
-- ============================================================================

-- Optimization opportunities
CREATE TABLE IF NOT EXISTS optimization_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_type VARCHAR(50) NOT NULL CHECK (opportunity_type IN ('query', 'cost', 'performance', 'capacity')),
  description TEXT NOT NULL,
  current_state JSONB NOT NULL,
  proposed_change JSONB NOT NULL,
  expected_impact JSONB NOT NULL,
  risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  recommended_action VARCHAR(20) NOT NULL CHECK (recommended_action IN ('auto-apply', 'human-review')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'applied', 'rejected')) DEFAULT 'pending',
  applied_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_optimization_opportunities_type ON optimization_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_optimization_opportunities_status ON optimization_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_optimization_opportunities_risk ON optimization_opportunities(risk_level);

-- ============================================================================
-- AI Agents: Anomaly Detector
-- ============================================================================

-- Detected anomalies
CREATE TABLE IF NOT EXISTS detected_anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anomaly_type VARCHAR(50) NOT NULL CHECK (anomaly_type IN ('reconciliation', 'security', 'data_quality', 'business_logic')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description TEXT NOT NULL,
  evidence JSONB NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  recommended_action TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')) DEFAULT 'open',
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detected_anomalies_type ON detected_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_detected_anomalies_severity ON detected_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_detected_anomalies_status ON detected_anomalies(status);
CREATE INDEX IF NOT EXISTS idx_detected_anomalies_created ON detected_anomalies(created_at DESC);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_reconciliation_graph_nodes_updated_at
  BEFORE UPDATE ON reconciliation_graph_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_patterns_updated_at
  BEFORE UPDATE ON network_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decision_logs_updated_at
  BEFORE UPDATE ON decision_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_embeddings_updated_at
  BEFORE UPDATE ON knowledge_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refresh performance insights materialized view
CREATE OR REPLACE FUNCTION refresh_performance_insights()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY performance_insights;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on strategic initiative tables
ALTER TABLE reconciliation_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_anomalies ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
-- Note: These are examples - adjust based on your auth setup

-- Reconciliation graph nodes (users can access their own job's nodes)
CREATE POLICY reconciliation_graph_nodes_policy ON reconciliation_graph_nodes
  FOR ALL USING (
    job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid())
  );

-- Compliance exports (users can access their own exports)
CREATE POLICY compliance_exports_policy ON compliance_exports
  FOR ALL USING (customer_id = auth.uid());

-- Performance metrics (users can access their own metrics)
CREATE POLICY performance_metrics_policy ON performance_metrics
  FOR ALL USING (customer_id = auth.uid());

-- Network patterns (read-only, anonymized)
CREATE POLICY network_patterns_policy ON network_patterns
  FOR SELECT USING (true); -- Public read access (anonymized data)

-- Decision logs (internal team access - adjust based on your needs)
CREATE POLICY decision_logs_policy ON decision_logs
  FOR ALL USING (true); -- Adjust based on your team structure
