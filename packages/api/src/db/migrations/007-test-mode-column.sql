-- ============================================================================
-- TEST MODE COLUMN
-- ============================================================================
-- UX-004: Add test_mode_enabled column to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS test_mode_enabled BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_test_mode ON users(test_mode_enabled) WHERE test_mode_enabled = true;
