#!/bin/bash
# Quick migration script - prompts for connection if needed

echo "🚀 Supabase Migration Runner"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  No database connection found!"
    echo ""
    echo "Please provide your Supabase connection details:"
    echo ""
    echo "Option 1: Set DATABASE_URL environment variable"
    echo "  export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'"
    echo ""
    echo "Option 2: Set Supabase variables"
    echo "  export SUPABASE_URL='https://[PROJECT-REF].supabase.co'"
    echo "  export SUPABASE_DB_PASSWORD='[PASSWORD]'"
    echo ""
    echo "Option 3: Create .env file"
    echo "  cp .env.template .env"
    echo "  # Edit .env and add your connection string"
    echo ""
    
    # Try to read from .env if it exists
    if [ -f .env ]; then
        echo "📄 Found .env file, loading..."
        export $(cat .env | grep -v '^#' | xargs)
    else
        echo "❌ Cannot proceed without database connection."
        echo ""
        echo "💡 Quick setup:"
        echo "   1. Get connection string from Supabase Dashboard → Settings → Database"
        echo "   2. Run: export DATABASE_URL='your-connection-string'"
        echo "   3. Run: npm run db:migrate:auto"
        exit 1
    fi
fi

echo "✓ Connection configured, running migrations..."
npm run db:migrate:auto
