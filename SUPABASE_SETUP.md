# Supabase Setup Guide for Settler Strategic Initiatives

This guide explains how to configure Supabase for Settler's strategic initiatives.

## Overview

Settler uses Supabase for:
1. **PostgreSQL Database** - Main data storage
2. **Realtime Subscriptions** - Stream processing (replaces Kafka/Pulsar)
3. **pgvector Extension** - Vector database for AI assistant
4. **Row Level Security (RLS)** - Multi-tenant data isolation

## Infrastructure Stack

### 1. Supabase PostgreSQL
- **Purpose:** Main database for all strategic initiatives
- **Features:** JSONB support, full-text search, RLS policies
- **Extensions:** pgvector (vector database), uuid-ossp

### 2. Supabase Realtime
- **Purpose:** Real-time updates (replaces Kafka/Pulsar)
- **Use Cases:**
  - Continuous Reconciliation Graph updates
  - Real-time anomaly detection alerts
  - Live performance metrics

### 3. Upstash Redis
- **Purpose:** In-memory caching and matching engine
- **Use Cases:**
  - Sub-second reconciliation (in-memory matching)
  - Caching reconciliation results
  - Rate limiting

### 4. pgvector (Supabase Extension)
- **Purpose:** Vector database for AI assistant
- **Use Cases:**
  - Knowledge base embeddings
  - Semantic search for decisions/incidents
  - AI-powered question answering

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys:
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: Found in Settings > API
   - Service Role Key: Found in Settings > API (keep secret!)

### Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Fallback Redis (for local development)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Step 3: Run Database Migrations

1. Connect to your Supabase SQL Editor
2. Run the migration file: `packages/api/src/db/migrations/002-strategic-initiatives.sql`
3. This creates all tables, indexes, and RLS policies

### Step 4: Enable Realtime

In Supabase Dashboard:
1. Go to Database > Replication
2. Enable replication for:
   - `reconciliation_graph_nodes`
   - `reconciliation_graph_edges`
   - `detected_anomalies`
   - `compliance_exports`

### Step 5: Enable pgvector Extension

In Supabase SQL Editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Step 6: Set Up Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy REST URL and token
4. Add to `.env` file

## Database Schema

### Strategic Initiative Tables

1. **reconciliation_graph_nodes** - Graph nodes (transactions, matches)
2. **reconciliation_graph_edges** - Graph edges (relationships)
3. **network_patterns** - Anonymized cross-customer patterns
4. **customer_patterns** - Customer pattern associations
5. **performance_metrics** - Performance tuning pool data
6. **performance_insights** - Materialized view of aggregated metrics
7. **decision_logs** - Decision log entries
8. **knowledge_embeddings** - Vector embeddings for AI assistant
9. **compliance_exports** - Compliance export records
10. **optimization_opportunities** - Infrastructure optimizer findings
11. **detected_anomalies** - Anomaly detector results

## Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:
- Users can only access their own data
- Network patterns are anonymized (public read access)
- Decision logs are team-accessible (adjust as needed)

## Realtime Subscriptions

### Example: Subscribe to Graph Updates

```typescript
import { supabaseRealtime } from './infrastructure/supabase/client';

const channel = supabaseRealtime
  .channel('reconciliation-graph-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'reconciliation_graph_nodes',
      filter: 'job_id=eq.job_123',
    },
    (payload) => {
      console.log('Graph update:', payload);
    }
  )
  .subscribe();
```

## Vector Database Usage

### Store Embeddings

```typescript
import { supabase } from './infrastructure/supabase/client';

await supabase
  .from('knowledge_embeddings')
  .insert({
    content_type: 'decision',
    content_id: decisionId,
    content_text: decisionText,
    embedding: embeddingVector, // 1536-dimensional vector
  });
```

### Semantic Search

```sql
-- Find similar decisions using cosine similarity
SELECT 
  content_id,
  content_text,
  1 - (embedding <=> query_embedding) as similarity
FROM knowledge_embeddings
WHERE content_type = 'decision'
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

## Performance Optimization

### Indexes

All tables have appropriate indexes:
- Primary keys
- Foreign keys
- Frequently queried columns
- Vector similarity search (ivfflat index)

### Materialized Views

- **performance_insights** - Aggregated performance metrics
- Refresh with: `REFRESH MATERIALIZED VIEW CONCURRENTLY performance_insights;`

## Monitoring

### Supabase Dashboard

Monitor:
- Database size
- Query performance
- Realtime connections
- API usage

### Upstash Dashboard

Monitor:
- Redis operations
- Cache hit rate
- Memory usage

## Troubleshooting

### Realtime Not Working

1. Check Replication settings in Supabase Dashboard
2. Verify tables are enabled for replication
3. Check network connectivity

### pgvector Not Available

1. Verify extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';`
2. Some Supabase plans may not include pgvector (upgrade if needed)

### Redis Connection Issues

1. Check Upstash credentials
2. Verify network access (firewall rules)
3. Use fallback Redis for local development

## Next Steps

1. ✅ Run migrations
2. ✅ Configure environment variables
3. ✅ Enable Realtime
4. ✅ Test Realtime subscriptions
5. ✅ Test vector search
6. ✅ Monitor performance

---

**Last Updated:** 2026-01-15
