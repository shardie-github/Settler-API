-- Security-related database migrations
-- Zero Trust, authentication, and compliance features

-- Revoked tokens table (for JWT revocation)
CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti VARCHAR(255) PRIMARY KEY,
  revoked_at TIMESTAMP DEFAULT NOW(),
  reason TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);

-- Cleanup expired revoked tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_revoked_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM revoked_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

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
