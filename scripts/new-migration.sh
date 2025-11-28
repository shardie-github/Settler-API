#!/bin/bash
set -e

MIGRATION_NAME=$1
if [ -z "$MIGRATION_NAME" ]; then
  echo "Usage: ./scripts/new-migration.sh <migration_name>"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d%H%M%S)
FILENAME="${TIMESTAMP}_${MIGRATION_NAME}.sql"
FILEPATH="supabase/migrations/${FILENAME}"

cat > "$FILEPATH" << EOF
-- Migration: ${MIGRATION_NAME}
-- Created: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
-- Description: TODO - Add description

BEGIN;

-- Your migration SQL here

COMMIT;
EOF

echo "Created migration: $FILEPATH"
echo "Edit the file and commit when ready"
