#!/bin/bash
# Quick migration runner - tries multiple connection methods

set -e

echo "🚀 Attempting to run Supabase migrations..."
echo ""

# Check for .env file
if [ -f .env ]; then
    echo "✓ Found .env file, loading environment variables..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Try to run migrations
echo "Running migration script..."
npm run db:migrate:auto
