-- ============================================================================
-- SETTLER API - CANONICAL DATA MODEL MIGRATION
-- ============================================================================
-- This migration creates the canonical data model as specified in the
-- Product & Technical Specification:
-- - Payment (logical payment intent/order)
-- - Transaction (processor-level record)
-- - Settlement/Payout
-- - Fee (per type)
-- - FX Rate and Conversion
-- - Refund & Chargeback/Dispute
-- ============================================================================

-- ============================================================================
-- 1. PAYMENTS TABLE (Logical Payment Intent/Order)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL, -- Merchant's order ID
  amount_value DECIMAL(15, 2) NOT NULL,
  amount_currency VARCHAR(10) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, authorized, captured, refunded, disputed, failed
  customer_id VARCHAR(255), -- Merchant's customer ID
  metadata JSONB DEFAULT '{}'::jsonb, -- Merchant-provided metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(tenant_id, external_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_metadata_gin ON payments USING GIN (metadata);

-- ============================================================================
-- 2. TRANSACTIONS TABLE (Processor-Level Record)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL, -- Links to Payment
  provider VARCHAR(50) NOT NULL, -- stripe, paypal, square, bank
  provider_transaction_id VARCHAR(255) NOT NULL, -- Provider's transaction ID
  type VARCHAR(50) NOT NULL, -- authorization, capture, refund, chargeback, adjustment
  amount_value DECIMAL(15, 2) NOT NULL,
  amount_currency VARCHAR(10) NOT NULL,
  net_amount_value DECIMAL(15, 2), -- Amount after fees
  net_amount_currency VARCHAR(10),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, refunded, disputed
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Original provider payload
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, provider, provider_transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON transactions(tenant_id, provider);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_id ON transactions(tenant_id, provider, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_raw_payload_gin ON transactions USING GIN (raw_payload);

-- ============================================================================
-- 3. SETTLEMENTS TABLE (Payouts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- stripe, paypal, square, bank
  provider_settlement_id VARCHAR(255) NOT NULL, -- Provider's settlement ID
  amount_value DECIMAL(15, 2) NOT NULL,
  amount_currency VARCHAR(10) NOT NULL, -- Settlement currency (may differ from transaction currency)
  fx_rate DECIMAL(15, 8), -- FX rate if currency conversion occurred
  settlement_date TIMESTAMP NOT NULL, -- When funds were settled
  expected_date TIMESTAMP, -- When settlement was expected
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, provider, provider_settlement_id)
);

CREATE INDEX IF NOT EXISTS idx_settlements_tenant_id ON settlements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_provider ON settlements(tenant_id, provider);
CREATE INDEX IF NOT EXISTS idx_settlements_provider_id ON settlements(tenant_id, provider, provider_settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_settlements_settlement_date ON settlements(tenant_id, settlement_date DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_expected_date ON settlements(tenant_id, expected_date);
CREATE INDEX IF NOT EXISTS idx_settlements_raw_payload_gin ON settlements USING GIN (raw_payload);

-- ============================================================================
-- 4. TRANSACTION_SETTLEMENTS TABLE (Many-to-Many Relationship)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  amount_value DECIMAL(15, 2) NOT NULL, -- Amount of this transaction included in settlement
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(transaction_id, settlement_id)
);

CREATE INDEX IF NOT EXISTS idx_transaction_settlements_tenant_id ON transaction_settlements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transaction_settlements_transaction_id ON transaction_settlements(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_settlements_settlement_id ON transaction_settlements(settlement_id);

-- ============================================================================
-- 5. FEES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- processing, fx, chargeback, refund, adjustment, other
  amount_value DECIMAL(15, 2) NOT NULL,
  amount_currency VARCHAR(10) NOT NULL,
  description TEXT, -- Human-readable description
  rate DECIMAL(10, 6), -- Percentage rate (if applicable)
  raw_payload JSONB DEFAULT '{}'::jsonb, -- Provider-specific fee data
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_tenant_id ON fees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fees_transaction_id ON fees(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fees_settlement_id ON fees(settlement_id);
CREATE INDEX IF NOT EXISTS idx_fees_type ON fees(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_fees_created_at ON fees(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fees_raw_payload_gin ON fees USING GIN (raw_payload);

-- ============================================================================
-- 6. FX_CONVERSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS fx_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  from_amount DECIMAL(15, 2) NOT NULL,
  to_amount DECIMAL(15, 2) NOT NULL,
  fx_rate DECIMAL(15, 8) NOT NULL,
  provider VARCHAR(50), -- FX provider (PSP or third-party)
  rate_date TIMESTAMP NOT NULL, -- When rate was applied
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fx_conversions_tenant_id ON fx_conversions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fx_conversions_transaction_id ON fx_conversions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fx_conversions_currencies ON fx_conversions(tenant_id, from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_fx_conversions_rate_date ON fx_conversions(tenant_id, rate_date DESC);

-- ============================================================================
-- 7. REFUNDS_AND_DISPUTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS refunds_and_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- refund, chargeback, dispute
  amount_value DECIMAL(15, 2) NOT NULL, -- Refund/dispute amount (may be partial)
  amount_currency VARCHAR(10) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, reversed, lost
  reason TEXT, -- Refund reason or dispute reason code
  provider_refund_id VARCHAR(255), -- Provider's refund ID
  provider_dispute_id VARCHAR(255), -- Provider's dispute ID
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_disputes_tenant_id ON refunds_and_disputes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_disputes_transaction_id ON refunds_and_disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_disputes_type ON refunds_and_disputes(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_refunds_disputes_status ON refunds_and_disputes(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_refunds_disputes_provider_refund_id ON refunds_and_disputes(tenant_id, provider_refund_id);
CREATE INDEX IF NOT EXISTS idx_refunds_disputes_provider_dispute_id ON refunds_and_disputes(tenant_id, provider_dispute_id);
CREATE INDEX IF NOT EXISTS idx_refunds_disputes_created_at ON refunds_and_disputes(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refunds_disputes_raw_payload_gin ON refunds_and_disputes USING GIN (raw_payload);

-- ============================================================================
-- 8. RECONCILIATION_MATCHES TABLE (Enhanced Matching)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL,
  match_type VARCHAR(50) NOT NULL, -- 1-to-1, 1-to-many, many-to-1
  confidence_score DECIMAL(3, 2) NOT NULL, -- 0.00 to 1.00
  matching_rules JSONB DEFAULT '{}'::jsonb, -- Rules used for matching
  matched_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_tenant_id ON reconciliation_matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_execution_id ON reconciliation_matches(execution_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_job_id ON reconciliation_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_transaction_id ON reconciliation_matches(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_settlement_id ON reconciliation_matches(settlement_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_confidence ON reconciliation_matches(tenant_id, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_matched_at ON reconciliation_matches(tenant_id, matched_at DESC);

-- ============================================================================
-- 9. EXCEPTIONS TABLE (Exception Queue)
-- ============================================================================

CREATE TABLE IF NOT EXISTS exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL, -- amount_mismatch, date_mismatch, missing_transaction, missing_settlement, duplicate
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  description TEXT NOT NULL,
  resolution_status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, dismissed
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exceptions_tenant_id ON exceptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_execution_id ON exceptions(execution_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_job_id ON exceptions(job_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_category ON exceptions(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_exceptions_resolution_status ON exceptions(tenant_id, resolution_status);
CREATE INDEX IF NOT EXISTS idx_exceptions_severity ON exceptions(tenant_id, severity);
CREATE INDEX IF NOT EXISTS idx_exceptions_created_at ON exceptions(tenant_id, created_at DESC);

-- ============================================================================
-- 10. ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds_and_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_payments ON payments FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_transactions ON transactions FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_settlements ON settlements FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_transaction_settlements ON transaction_settlements FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_fees ON fees FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_fx_conversions ON fx_conversions FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_refunds_disputes ON refunds_and_disputes FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_reconciliation_matches ON reconciliation_matches FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_exceptions ON exceptions FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- 11. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_disputes_updated_at BEFORE UPDATE ON refunds_and_disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exceptions_updated_at BEFORE UPDATE ON exceptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate effective rate for a transaction
CREATE OR REPLACE FUNCTION calculate_effective_rate(
  p_transaction_id UUID
)
RETURNS DECIMAL(10, 6) AS $$
DECLARE
  v_transaction_amount DECIMAL(15, 2);
  v_total_fees DECIMAL(15, 2);
BEGIN
  SELECT amount_value INTO v_transaction_amount
  FROM transactions
  WHERE id = p_transaction_id;

  SELECT COALESCE(SUM(amount_value), 0) INTO v_total_fees
  FROM fees
  WHERE transaction_id = p_transaction_id;

  IF v_transaction_amount = 0 THEN
    RETURN 0;
  END IF;

  RETURN (v_total_fees / v_transaction_amount) * 100;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get base currency amount (convert to merchant's base currency)
CREATE OR REPLACE FUNCTION get_base_currency_amount(
  p_amount DECIMAL(15, 2),
  p_from_currency VARCHAR(10),
  p_to_currency VARCHAR(10),
  p_tenant_id UUID
)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  v_fx_rate DECIMAL(15, 8);
BEGIN
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;

  -- Get most recent FX rate for this currency pair
  SELECT fx_rate INTO v_fx_rate
  FROM fx_conversions
  WHERE tenant_id = p_tenant_id
    AND from_currency = p_from_currency
    AND to_currency = p_to_currency
  ORDER BY rate_date DESC
  LIMIT 1;

  IF v_fx_rate IS NULL THEN
    RETURN NULL; -- No FX rate available
  END IF;

  RETURN p_amount * v_fx_rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 13. ANALYZE TABLES
-- ============================================================================

ANALYZE payments;
ANALYZE transactions;
ANALYZE settlements;
ANALYZE transaction_settlements;
ANALYZE fees;
ANALYZE fx_conversions;
ANALYZE refunds_and_disputes;
ANALYZE reconciliation_matches;
ANALYZE exceptions;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
