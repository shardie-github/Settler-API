#!/bin/bash
set -e

echo "Verifying migration files..."

MIGRATIONS_DIR="supabase/migrations"
ERRORS=0

for file in "$MIGRATIONS_DIR"/*.sql; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    
    # Skip rollback template
    if [ "$filename" = "rollback_template.sql" ]; then
      continue
    fi
    
    # Check filename format
    if ! echo "$filename" | grep -qE '^[0-9]{14}_[a-z_]+\.sql$'; then
      echo "ERROR: Invalid filename format: $filename"
      echo "  Expected: YYYYMMDDHHMMSS_description.sql"
      ERRORS=$((ERRORS + 1))
    fi
    
    # Check for BEGIN/COMMIT
    if ! grep -q "BEGIN" "$file" || ! grep -q "COMMIT" "$file"; then
      echo "WARNING: $filename missing BEGIN/COMMIT transaction wrapper"
    fi
    
    # Check for DROP without IF EXISTS
    if grep -qE "^DROP (TABLE|FUNCTION|TRIGGER|POLICY)" "$file" && ! grep -q "IF EXISTS" "$file"; then
      echo "WARNING: $filename has DROP without IF EXISTS"
    fi
    
    echo "✓ $filename"
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo "Verification failed with $ERRORS errors"
  exit 1
fi

echo "All migrations verified successfully"
