# Settler Strategic Initiatives - Services

This directory contains the implementation of Settler's strategic initiatives as outlined in the strategic framework.

## Directory Structure

```
services/
├── reconciliation-graph/     # Continuous Reconciliation Graph
│   ├── types.ts              # Type definitions
│   ├── graph-engine.ts       # Graph database engine
│   └── stream-processor.ts   # Real-time stream processing
│
├── ai-agents/                # AI Agent Mesh
│   ├── orchestrator.ts       # Agent orchestration layer
│   ├── infrastructure-optimizer.ts  # Infrastructure optimization agent
│   └── anomaly-detector.ts   # Anomaly detection agent
│
├── network-effects/          # Network Effects Systems
│   ├── cross-customer-intelligence.ts  # Cross-customer pattern sharing
│   └── performance-pools.ts  # Performance tuning pools
│
├── privacy-preserving/       # Privacy-Preserving Reconciliation
│   └── edge-agent.ts         # Edge computing agent
│
├── knowledge/                # Knowledge Management
│   ├── decision-log.ts       # Decision logging system
│   └── ai-assistant.ts       # AI knowledge assistant
│
└── compliance/                # Compliance Systems
    └── export-system.ts      # Compliance export system
```

## API Endpoints

All services are exposed via `/api/v2/` endpoints:

- **Continuous Reconciliation Graph:** `/api/v2/reconciliation-graph`
- **AI Agents:** `/api/v2/ai-agents`
- **Network Effects:** `/api/v2/network-effects`
- **Knowledge Management:** `/api/v2/knowledge`
- **Compliance:** `/api/v2/compliance`

See individual service files for detailed API documentation.

## Usage Examples

### Continuous Reconciliation Graph

```typescript
// Add a transaction node
POST /api/v2/reconciliation-graph/:jobId/nodes
{
  "type": "transaction",
  "sourceId": "order_123",
  "amount": 99.99,
  "currency": "USD",
  "data": { "orderId": "order_123" }
}

// Query the graph
GET /api/v2/reconciliation-graph/:jobId/query?nodeType=match

// Stream real-time updates
GET /api/v2/reconciliation-graph/:jobId/stream (SSE)
```

### AI Agents

```typescript
// List all agents
GET /api/v2/ai-agents

// Execute an agent action
POST /api/v2/ai-agents/infrastructure-optimizer/execute
{
  "action": "analyze",
  "params": {}
}

// Get agent status
GET /api/v2/ai-agents/infrastructure-optimizer
```

### Network Effects

```typescript
// Opt-in to cross-customer intelligence
POST /api/v2/network-effects/intelligence/opt-in

// Check if pattern matches known patterns
POST /api/v2/network-effects/intelligence/check-pattern
{
  "type": "fraud",
  "data": { "pattern": "..." }
}

// Get performance insights
GET /api/v2/network-effects/performance/insights?adapter=stripe
```

### Knowledge Management

```typescript
// Create a decision
POST /api/v2/knowledge/decisions
{
  "title": "Use Vercel for API Hosting",
  "decisionMakers": ["CTO", "Engineering Lead"],
  "context": "...",
  "decision": "...",
  "rationale": "..."
}

// Query AI assistant
POST /api/v2/knowledge/assistant/query
{
  "question": "How do we deploy to production?"
}
```

### Compliance

```typescript
// Create compliance export
POST /api/v2/compliance/exports
{
  "jurisdiction": "GDPR",
  "format": "json"
}

// Initialize edge agent
POST /api/v2/compliance/edge/initialize
{
  "apiKey": "...",
  "cloudEndpoint": "https://api.settler.io",
  "reconciliationRules": [...]
}
```

## Next Steps

1. **Database Integration:** Connect services to PostgreSQL/Neo4j
2. **LLM Integration:** Connect AI agents to OpenAI/Anthropic APIs
3. **Infrastructure Setup:** Set up Kafka/Pulsar, Redis, vector databases
4. **Testing:** Add unit tests, integration tests, E2E tests
5. **Documentation:** Complete API documentation, add examples

## Status

See [IMPLEMENTATION_STATUS.md](../../../IMPLEMENTATION_STATUS.md) for current implementation status.
