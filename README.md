# Settler

**Reconciliation-as-a-Service API** — Automate financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems.

## What Settler Does

Settler solves the problem of **data reconciliation** — the tedious, error-prone process of matching records between different systems (like Shopify orders with Stripe payments, or QuickBooks invoices with PayPal transactions).

Think of Settler as **"Resend for reconciliation"** — dead-simple onboarding, pure API, usage-based pricing, and composable adapters for every platform.

## Who It's For

- **E-commerce businesses** reconciling orders with payment processors
- **SaaS companies** matching subscription events across billing systems
- **Finance teams** automating accounting reconciliation workflows
- **Developers** building financial data pipelines

## Top 3 Problems Settler Solves

### 1. **Manual Reconciliation is Expensive and Error-Prone**
- Finance teams spend hours each week manually matching records
- Human error leads to incorrect financial reports
- Scaling manual processes doesn't work

**Settler's Solution:** Automated matching with configurable rules, confidence scoring, and exception handling.

### 2. **Fragmented Data Across Multiple Platforms**
- Orders in Shopify, payments in Stripe, accounting in QuickBooks
- Each system has different APIs, data formats, and update frequencies
- Building custom integrations is time-consuming and brittle

**Settler's Solution:** Pre-built adapters for popular platforms (Stripe, Shopify, QuickBooks, PayPal) with a simple API to add custom adapters.

### 3. **Lack of Visibility and Auditability**
- Hard to track what matched, what didn't, and why
- No historical record of reconciliation decisions
- Difficult to debug discrepancies

**Settler's Solution:** Complete audit trail, detailed reports, webhook notifications, and real-time dashboards.

## How Customers Get Value (3 Steps)

### Step 1: Connect Your Systems
```typescript
import Settler from "@settler/sdk";

const client = new Settler({ apiKey: "sk_your_api_key" });

// Create a reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: { apiKey: process.env.SHOPIFY_API_KEY },
  },
  target: {
    adapter: "stripe",
    config: { apiKey: process.env.STRIPE_SECRET_KEY },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});
```

### Step 2: Run Reconciliation
```typescript
// Trigger reconciliation
await client.jobs.run(job.data.id);

// Get results
const report = await client.reports.get(job.data.id);
console.log(report.data.summary);
// {
//   matched: 1250,
//   unmatched_source: 5,
//   unmatched_target: 3,
//   accuracy: 99.4%
// }
```

### Step 3: Handle Exceptions
```typescript
// Set up webhooks for real-time notifications
await client.webhooks.create({
  url: "https://your-app.com/webhooks/settler",
  events: ["reconciliation.completed", "reconciliation.failed"],
});

// Review unmatched records via API or dashboard
const unmatched = await client.reports.getUnmatched(job.data.id);
```

## How Settler Keeps It Simple

### Architecture: Like Connecting Lego Blocks, Not Soldering Wires

**Modular Adapters:** Each platform (Stripe, Shopify, etc.) has a simple adapter that translates its data format into Settler's common format. Adding a new platform is like adding a new Lego block — it just snaps in.

**API-First Design:** Everything is accessible via REST API. No complex SDKs, no vendor lock-in. Use Settler from any language, any framework.

**Serverless-Ready:** Built to run on Vercel, AWS Lambda, or any serverless platform. Scales automatically, pay only for what you use.

### Onboarding: 5 Minutes, Not 5 Days

1. **Sign up** → Get API key
2. **Install SDK** → `npm install @settler/sdk`
3. **Create job** → Connect your systems
4. **Run reconciliation** → Get results
5. **Set up webhooks** → Get notified

No complex setup, no infrastructure to manage, no database to configure.

### Maintenance: Set It and Forget It

- **Automatic retries** for failed webhooks
- **Built-in monitoring** and alerting
- **Data retention policies** to manage storage
- **Multi-tenant isolation** for enterprise customers

## Comparison: Settler vs. Legacy Solutions

| Feature | Settler | Manual Process | Custom Scripts |
|---------|---------|----------------|----------------|
| **Setup Time** | 5 minutes | N/A | Days/weeks |
| **Accuracy** | 99%+ with ML | 85-95% | Varies |
| **Scalability** | Automatic | Doesn't scale | Requires maintenance |
| **Cost** | Usage-based | High (labor) | High (development) |
| **Maintenance** | Zero | Ongoing | Ongoing |
| **Audit Trail** | Complete | Manual logs | Custom logging |
| **Real-time** | Yes (webhooks) | No | Possible |
| **Multi-platform** | Built-in | Manual | Custom per platform |

## Prerequisites

- **Node.js** 20+ and **npm** 10+
- **PostgreSQL** 15+ (or Supabase account)
- **Redis** (or Upstash account)  
- **Docker** & **Docker Compose** (for local development)

## How to Try It

### Quick Start (Development)

```bash
# 1. Clone the repository
git clone https://github.com/settler/settler.git
cd settler

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database and API keys
# See config/env.schema.ts for all available variables

# 4. Start services (PostgreSQL, Redis)
docker-compose up -d

# 5. Run database migrations
cd packages/api
npm run migrate

# 6. Start API server (dev mode)
npm run dev
# API runs on http://localhost:3000

# 7. Verify installation
curl http://localhost:3000/health
```

### Available Scripts

**Root level:**
```bash
npm run build          # Build all packages
npm run dev            # Start all packages in dev mode
npm run test           # Run all tests
npm run lint           # Lint all packages
npm run format         # Format all files with Prettier
npm run typecheck      # Type check all packages
npm run clean          # Clean build artifacts
```

**Package-specific (from package directory):**
```bash
cd packages/api
npm run dev            # Start API server
npm run test           # Run API tests
npm run test:coverage  # Generate coverage report
npm run migrate        # Run database migrations
npm run lint:fix       # Auto-fix linting issues
```

### Using the SDK

```bash
npm install @settler/sdk
```

```typescript
import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
  baseURL: "https://api.settler.io", // or your self-hosted URL
});

// Create and run a reconciliation job
const job = await client.jobs.create({ /* ... */ });
await client.jobs.run(job.data.id);
const report = await client.reports.get(job.data.id);
```

### Using the CLI

```bash
npm install -g @settler/cli

settler jobs create \
  --name "Shopify-Stripe" \
  --source-adapter shopify \
  --target-adapter stripe \
  --source-config '{"apiKey":"..."}' \
  --target-config '{"apiKey":"..."}'
```

## Architecture Overview

Settler follows **Hexagonal Architecture** (Ports & Adapters) with **CQRS** and **Event-Driven** patterns:

- **Domain Layer** (`packages/api/src/domain/`) - Core business logic, framework-agnostic
- **Application Layer** (`packages/api/src/application/`) - Use case orchestration
- **Infrastructure Layer** (`packages/api/src/infrastructure/`) - Technical adapters (DB, Redis, security)
- **Presentation Layer** (`packages/api/src/routes/`) - HTTP adapters (Express routes)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## Monorepo Structure

This repository contains:

- **`packages/api`** - Serverless API server (Express, TypeScript)
  - `src/domain/` - Domain entities and business logic
  - `src/application/` - Application services
  - `src/infrastructure/` - Database, Redis, security implementations
  - `src/routes/` - Express route handlers
  - `src/middleware/` - Express middleware
- **`packages/sdk`** - npm installable TypeScript SDK (`@settler/sdk`)
- **`packages/cli`** - Command-line tool (`@settler/cli`)
- **`packages/web`** - Next.js web UI with playground
- **`packages/adapters`** - Platform adapters (Stripe, Shopify, QuickBooks, PayPal)
- **`config/`** - Shared configuration (env.schema.ts)
- **`scripts/`** - Utility scripts (check-env.ts)
- **`docs/`** - Documentation

## Troubleshooting

### Database Connection Issues
- **Verify connection string**: Check `DATABASE_URL` or `DB_*` environment variables
- **Check PostgreSQL is running**: `docker ps` (should show postgres container)
- **Test connection**: `psql $DATABASE_URL` or `psql -h localhost -U postgres -d settler`
- **Common issues**:
  - Wrong password: Verify `DB_PASSWORD` matches your PostgreSQL setup
  - Port conflict: Ensure port 5432 is available or change `DB_PORT`
  - Database doesn't exist: Run `createdb settler` (local) or create in Supabase dashboard

### Redis Connection Issues
- **Verify Redis URL**: Check `REDIS_URL` or `UPSTASH_REDIS_REST_URL` is set correctly
- **Test connection**: `redis-cli ping` (should return `PONG`)
- **Upstash setup**: If using Upstash, ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- **Fallback**: API will fall back to in-memory cache if Redis is unavailable (check logs)

### Migration Errors
- **Database doesn't exist**: Create database first: `createdb settler` (local) or via Supabase dashboard
- **Permission errors**: Ensure database user has CREATE privileges
- **Migration files**: Check `packages/api/src/db/migrations/` for migration files
- **Run migrations manually**: `cd packages/api && npm run migrate`
- **Reset database** (⚠️ destroys data): Drop and recreate database, then run migrations

### Type Errors
- **Clear build cache**: `npm run clean` removes all `dist/` and `.turbo/` directories
- **Reinstall dependencies**: `rm -rf node_modules && npm install`
- **Check TypeScript version**: `npx tsc --version` (should be 5.3+)
- **Type check**: `npm run typecheck` to see all type errors

### API Server Won't Start
- **Port already in use**: Change `PORT` env var or kill process using port 3000: `lsof -ti:3000 | xargs kill`
- **Missing required env vars**: Run `tsx scripts/check-env.ts production` to validate
- **Database not initialized**: Run migrations: `cd packages/api && npm run migrate`
- **Check logs**: Look for error messages in console output

### Authentication Issues
- **Invalid API key**: Ensure API key starts with `rk_` prefix
- **JWT expired**: Refresh tokens expire after 7 days, get new token via `/api/v1/auth/login`
- **CORS errors**: Check `ALLOWED_ORIGINS` env var (use `*` for development, specific URLs for production)

### Performance Issues
- **Slow queries**: Check database indexes: `\d+ table_name` in psql
- **High memory usage**: Check for memory leaks, restart server periodically
- **Redis connection pool**: Adjust `DB_POOL_MAX` if seeing connection errors

### Webhook Delivery Failures
- **Check webhook URL**: Ensure URL is publicly accessible (not localhost)
- **SSL/TLS**: Webhook URLs must use HTTPS in production
- **Retry logic**: Failed webhooks retry up to 5 times with exponential backoff
- **Check logs**: Look for webhook delivery errors in application logs

## Environment Variables

See [`.env.example`](.env.example) and [`config/env.schema.ts`](config/env.schema.ts) for complete documentation.

**Required for local development:**
- `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `REDIS_URL` or `UPSTASH_REDIS_REST_URL`
- `JWT_SECRET` (min 32 chars) - Generate with: `openssl rand -base64 32`
- `ENCRYPTION_KEY` (exactly 32 chars) - Generate with: `openssl rand -hex 16`

**Optional:**
- `SENTRY_DSN` (for error tracking)
- `LOG_LEVEL` (default: `info`)
- `OTLP_ENDPOINT` (for distributed tracing)

**Validate environment:**
```bash
tsx scripts/check-env.ts production
```

## Testing

```bash
# Unit tests
npm run test

# Integration tests
cd packages/api && npm run test

# E2E tests
npm run test:e2e

# Coverage report
cd packages/api && npm run test:coverage
```

## Documentation

- [Architecture](./ARCHITECTURE.md) - Complete architecture documentation
- [Contributing](./docs/CONTRIBUTING.md) - Contribution guidelines
- [API Documentation](./docs/api.md) - API reference
- [Adapter Guide](./docs/adapters.md) - Platform adapter documentation
- [Integration Recipes](./docs/integration-recipes.md) - Integration examples
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions
- [Migration Runbook](./packages/api/src/db/MIGRATION_RUNBOOK.md) - Database migration guide
- [Security](./SECURITY.md) - Security practices
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Deployment instructions

## Security

- **Authentication:** API keys and JWT tokens
- **Encryption:** AES-256-GCM for sensitive data
- **Rate Limiting:** Built-in per API key
- **Input Validation:** Zod schemas for all endpoints
- **Row-Level Security:** Multi-tenant data isolation
- **SSRF Protection:** Webhook URL validation

## Deployment

### Vercel (Recommended)

```bash
# Deploy API
vercel --prod packages/api

# Deploy Web UI
vercel --prod packages/web
```

### Docker

```bash
docker build -t settler-api packages/api
docker run -p 3000:3000 settler-api
```

### Serverless

The API is designed to be serverless-ready. Deploy to:
- Vercel Functions
- AWS Lambda
- Cloudflare Workers
- Google Cloud Functions

## About the Founder

**Scott Hardie** - Founder & CEO  
Email: scottrmhardie@gmail.com  
LinkedIn: [linkedin.com/in/scottrmhardie](https://linkedin.com/in/scottrmhardie)

Scott brings extensive experience in building and scaling technology companies, with deep expertise in financial technology, API development, and developer tools. His background includes leadership roles in fintech startups, where he's focused on solving complex integration challenges and building developer-first products.

---

## Support & Next Steps

### For Non-Technical Founders/Investors

**Business Value:** Settler reduces reconciliation costs by 80-90% and eliminates human error, enabling finance teams to focus on analysis instead of data entry.

**Market Opportunity:** Every business that processes payments needs reconciliation. The market is large and underserved.

**Competitive Advantage:** Simple API, fast onboarding, and composable architecture make Settler the easiest reconciliation solution to adopt.

### For Technical Leads

**Architecture:** Clean, modular codebase with clear separation of concerns. Easy to extend with custom adapters.

**Scalability:** Built for serverless, handles millions of records with automatic scaling.

**Reliability:** Event sourcing, CQRS, saga patterns for complex workflows. Built-in retries, circuit breakers, and dead letter queues.

**Getting Started:**
1. Review [API Documentation](./docs/api.md)
2. Check [Migration Runbook](./packages/api/src/db/MIGRATION_RUNBOOK.md) for database setup
3. Explore [Integration Recipes](./docs/integration-recipes.md) for examples
4. Join our [Discord](https://discord.gg/settler) for support

## React.Settler - Open Source Protocol

Settler also offers **React.Settler**, an open-source React component library for building reconciliation UIs declaratively.

### React.Settler Tiers

- 🆓 **OSS (Free)** - Core protocol, basic components, security basics, mobile & accessibility
- 💼 **Commercial ($99/month)** - Platform integrations (Shopify, Stripe, MCP), virtualization, telemetry
- 🏢 **Enterprise (Custom)** - SSO, RBAC, white-label, dedicated support

**Learn More:** [React.Settler Documentation](./packages/react-settler/README.md)

## License

### Settler API
Proprietary (Closed Source) - See [Terms of Service](./LEGAL/TERMS_OF_SERVICE.md)

### React.Settler
- **OSS Components:** MIT License (Free)
- **Commercial Features:** Commercial License (Requires Subscription) - See [Commercial License](./LEGAL/COMMERCIAL_LICENSE.md)

## Contributing

See [CONTRIBUTING.md](./docs/contributing.md) for guidelines.

---

**Made with ❤️ for developers who hate manual reconciliation.**

For questions or support:
- **Documentation:** [docs.settler.io](https://docs.settler.io)
- **Issues:** [GitHub Issues](https://github.com/settler/settler/issues)
- **Email:** support@settler.io
- **Founder:** scottrmhardie@gmail.com
