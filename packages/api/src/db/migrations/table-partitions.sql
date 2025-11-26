-- Table Partitioning Migration
-- Partitions large tables by month for better query performance and maintenance

-- ============================================================================
-- 1. PARTITION EXECUTIONS TABLE BY MONTH
-- ============================================================================

-- Create partitioned table structure
CREATE TABLE IF NOT EXISTS executions_partitioned (
  LIKE executions INCLUDING ALL
) PARTITION BY RANGE (started_at);

-- Create partitions for current and next 3 months
DO $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..3 LOOP
    partition_date := date_trunc('month', NOW()) + (i || ' months')::INTERVAL;
    partition_name := 'executions_' || to_char(partition_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF executions_partitioned
      FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      partition_date + '1 month'::INTERVAL
    );
  END LOOP;
END $$;

-- Migrate existing data (if any)
INSERT INTO executions_partitioned 
SELECT * FROM executions 
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. PARTITION MATCHES TABLE BY MONTH
-- ============================================================================

CREATE TABLE IF NOT EXISTS matches_partitioned (
  LIKE matches INCLUDING ALL
) PARTITION BY RANGE (matched_at);

DO $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..3 LOOP
    partition_date := date_trunc('month', NOW()) + (i || ' months')::INTERVAL;
    partition_name := 'matches_' || to_char(partition_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF matches_partitioned
      FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      partition_date + '1 month'::INTERVAL
    );
  END LOOP;
END $$;

-- Migrate existing data
INSERT INTO matches_partitioned 
SELECT * FROM matches 
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. PARTITION UNMATCHED TABLE BY MONTH
-- ============================================================================

CREATE TABLE IF NOT EXISTS unmatched_partitioned (
  LIKE unmatched INCLUDING ALL
) PARTITION BY RANGE (created_at);

DO $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..3 LOOP
    partition_date := date_trunc('month', NOW()) + (i || ' months')::INTERVAL;
    partition_name := 'unmatched_' || to_char(partition_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF unmatched_partitioned
      FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      partition_date + '1 month'::INTERVAL
    );
  END LOOP;
END $$;

-- Migrate existing data
INSERT INTO unmatched_partitioned 
SELECT * FROM unmatched 
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. PARTITION AUDIT LOGS TABLE BY MONTH
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (timestamp);

DO $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..3 LOOP
    partition_date := date_trunc('month', NOW()) + (i || ' months')::INTERVAL;
    partition_name := 'audit_logs_' || to_char(partition_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs_partitioned
      FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      partition_date + '1 month'::INTERVAL
    );
  END LOOP;
END $$;

-- Migrate existing data
INSERT INTO audit_logs_partitioned 
SELECT * FROM audit_logs 
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. FUNCTION TO CREATE FUTURE PARTITIONS AUTOMATICALLY
-- ============================================================================

CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
  table_name TEXT;
  partition_tables TEXT[] := ARRAY[
    'executions_partitioned',
    'matches_partitioned',
    'unmatched_partitioned',
    'audit_logs_partitioned'
  ];
BEGIN
  FOREACH table_name IN ARRAY partition_tables LOOP
    -- Create partition for next month if it doesn't exist
    partition_date := date_trunc('month', NOW()) + '4 months'::INTERVAL;
    partition_name := replace(table_name, '_partitioned', '') || '_' || to_char(partition_date, 'YYYY_MM');
    
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
      FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      table_name,
      partition_date,
      partition_date + '1 month'::INTERVAL
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. FUNCTION TO DROP OLD PARTITIONS (DATA RETENTION)
-- ============================================================================

CREATE OR REPLACE FUNCTION drop_old_partitions(retention_months INTEGER DEFAULT 12)
RETURNS void AS $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
  table_name TEXT;
  partition_tables TEXT[] := ARRAY[
    'executions_partitioned',
    'matches_partitioned',
    'unmatched_partitioned',
    'audit_logs_partitioned'
  ];
BEGIN
  FOREACH table_name IN ARRAY partition_tables LOOP
    partition_date := date_trunc('month', NOW()) - (retention_months || ' months')::INTERVAL;
    partition_name := replace(table_name, '_partitioned', '') || '_' || to_char(partition_date, 'YYYY_MM');
    
    -- Check if partition exists before dropping
    IF EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = partition_name
    ) THEN
      EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', partition_name);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. SCHEDULE PARTITION MAINTENANCE (requires pg_cron extension)
-- ============================================================================

-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('create-monthly-partitions', '0 0 1 * *', 'SELECT create_monthly_partitions()');
-- SELECT cron.schedule('drop-old-partitions', '0 2 1 * *', 'SELECT drop_old_partitions(12)');
