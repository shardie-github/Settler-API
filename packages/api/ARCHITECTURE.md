# Settler API Architecture

## Overview

Settler API is built using **Hexagonal Architecture** (also known as Ports and Adapters) with **CQRS** (Command Query Responsibility Segregation) and **Event-Driven** patterns. This architecture ensures separation of concerns, testability, and maintainability.

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

The core business logic, independent of infrastructure.

- **Entities**: Core business objects (User, Job, Execution, ApiKey)
- **Value Objects**: Immutable objects representing domain concepts
- **Domain Events**: Events that represent business occurrences
- **Repository Interfaces**: Contracts for data persistence (ports)

**Key Principles:**
- No dependencies on external frameworks
- Pure business logic
- Rich domain models with behavior

### 2. Application Layer (`src/application/`)

Orchestrates domain objects to fulfill use cases.

- **Commands**: Write operations (CreateUser, CreateJob)
- **Queries**: Read operations (GetJob, ListJobs)
- **Services**: Application services that coordinate domain logic
- **DTOs**: Data Transfer Objects for API boundaries

**Key Principles:**
- Thin layer that delegates to domain
- Transaction boundaries
- Use case orchestration

### 3. Infrastructure Layer (`src/infrastructure/`)

Implements technical concerns and adapters.

- **Repositories**: Database implementations of repository interfaces
- **Security**: Password hashing, encryption, JWT handling
- **Events**: Event bus implementation
- **Observability**: Logging, tracing, metrics
- **Resilience**: Retry logic, circuit breakers
- **DI Container**: Dependency injection

**Key Principles:**
- Implements interfaces defined in domain/application
- Can be swapped without changing business logic
- Handles technical concerns

### 4. Adapters Layer (`src/routes/`, `src/middleware/`)

HTTP adapters that expose the application to the outside world.

- **Routes**: Express route handlers
- **Middleware**: Auth, validation, error handling
- **Controllers**: Thin controllers that call application services

**Key Principles:**
- Thin adapters that translate HTTP to application calls
- Input validation and output formatting
- Error handling and status codes

## Key Patterns

### CQRS (Command Query Responsibility Segregation)

- **Commands**: Mutate state (CreateJob, UpdateJob)
- **Queries**: Read data (GetJob, ListJobs)
- Separate models for read/write operations
- Enables optimization of read and write paths independently

### Event-Driven Architecture

- Domain events are published when state changes
- Event handlers can react to events asynchronously
- Enables audit trails, webhooks, and async processing

### Repository Pattern

- Abstracts data access behind interfaces
- Domain layer doesn't know about database implementation
- Easy to swap implementations (PostgreSQL, MongoDB, etc.)

### Dependency Injection

- Services are injected via constructor
- Enables easy testing with mocks
- Centralized in DI container

## Security Architecture

### Authentication

1. **API Key Authentication**
   - Hashed storage (bcrypt)
   - Prefix-based lookup for performance
   - Scope-based permissions
   - Rate limiting per key

2. **JWT Authentication**
   - Short-lived access tokens (15min)
   - Refresh tokens (7 days)
   - RS256 signing (production)

### Authorization

- **RBAC**: Role-based access control (Owner, Admin, Developer, Viewer)
- **Resource Ownership**: Users can only access their own resources
- **Scope-based**: API keys have scoped permissions

### Data Protection

- **Encryption at Rest**: AES-256-GCM for sensitive fields
- **Field-level Encryption**: API keys, adapter configs
- **Input Validation**: Zod schemas for all inputs
- **Output Sanitization**: XSS prevention, data redaction

## Observability

### Structured Logging

- Winston with JSON output
- Automatic PII redaction
- Trace IDs for request correlation
- Log levels: ERROR, WARN, INFO, DEBUG

### Distributed Tracing

- OpenTelemetry instrumentation
- Trace every API request end-to-end
- Spans for DB queries, external APIs, queue operations

### Metrics

- Prometheus-compatible metrics endpoint
- HTTP metrics (latency, error rate)
- Business metrics (reconciliations, webhook deliveries)
- System metrics (connections, queue depth)

### Health Checks

- `/health`: Overall health with dependency checks
- `/health/live`: Liveness probe (always OK if process alive)
- `/health/ready`: Readiness probe (OK only if dependencies healthy)

## Resilience Patterns

### Retry Logic

- Exponential backoff with jitter
- Configurable retries (default: 3)
- Retryable error detection
- Prevents thundering herd

### Circuit Breaker

- Opens after error threshold (default: 50%)
- Half-open state for testing
- Prevents cascading failures
- Per-service circuit breakers

### Idempotency

- `Idempotency-Key` header for write operations
- 24-hour TTL
- Returns cached response for duplicate keys
- Prevents duplicate operations

## Database Design

### Connection Pooling

- Max 20 connections
- Min 5 connections
- 30s idle timeout
- Prevents connection exhaustion

### Indexes

- Foreign keys indexed
- Composite indexes for common queries
- Partial indexes for active records
- Optimized for read performance

### Transactions

- ACID compliance for critical operations
- Optimistic locking for concurrency control
- Rollback on errors

## Testing Strategy

### Unit Tests

- Domain entities and value objects
- Business logic in isolation
- 70% coverage minimum
- Jest with ts-jest

### Integration Tests

- Full API flows
- Database interactions
- External service mocks
- Supertest for HTTP testing

### Security Tests

- SQL injection attempts
- XSS payloads
- Rate limit enforcement
- Authorization boundaries

### Load Tests

- Artillery/k6 scripts
- 100+ concurrent users
- Measure p95 latency
- Identify bottlenecks

## Deployment

### Docker

- Multi-stage builds
- Production-optimized images
- Non-root user
- Health checks

### CI/CD

- GitHub Actions
- Automated tests on PR
- Build and push Docker images
- Deploy to staging automatically
- Manual approval for production

### Vercel

- Serverless deployment
- Edge functions for low latency
- Automatic scaling
- Environment variable management

## Environment Variables

Required environment variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=settler
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Encryption
ENCRYPTION_KEY=32-byte-key-for-aes-256

# Observability
OTLP_ENDPOINT=http://localhost:4318
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_DEFAULT=1000
RATE_LIMIT_WINDOW_MS=900000
```

## Development Workflow

1. **Local Development**
   ```bash
   docker-compose up  # Start DB, Redis
   npm run dev        # Start API server
   ```

2. **Testing**
   ```bash
   npm run test              # Unit tests
   npm run test:integration  # Integration tests
   npm run test:coverage     # Coverage report
   ```

3. **Building**
   ```bash
   npm run build     # TypeScript compilation
   npm run lint      # ESLint
   npm run typecheck # Type checking
   ```

## Future Enhancements

- GraphQL API layer
- WebSocket support for real-time updates
- Advanced caching strategies
- Multi-region deployment
- Event sourcing for audit logs
- Saga pattern for distributed transactions
