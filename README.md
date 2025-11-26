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

## How to Try It

### Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/settler/settler.git
cd settler

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API keys

# Start database (requires PostgreSQL)
docker-compose up -d

# Run migrations
npm run migrate

# Start API server
npm run dev

# API runs on http://localhost:3000
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

## Monorepo Structure

This repository contains:

- **`packages/api`** - Serverless API server (Express, TypeScript)
- **`packages/sdk`** - npm installable TypeScript SDK (`@settler/sdk`)
- **`packages/cli`** - Command-line tool (`@settler/cli`)
- **`packages/web`** - Next.js web UI with playground
- **`packages/adapters`** - Platform adapters (Stripe, Shopify, QuickBooks, PayPal)

## Documentation

- [API Documentation](./docs/api.md)
- [Adapter Guide](./docs/adapters.md)
- [Integration Recipes](./docs/integration-recipes.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Migration Runbook](./packages/api/src/db/MIGRATION_RUNBOOK.md)

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

## License

MIT

## Contributing

See [CONTRIBUTING.md](./docs/contributing.md) for guidelines.

---

**Made with ❤️ for developers who hate manual reconciliation.**

For questions or support:
- **Documentation:** [docs.settler.io](https://docs.settler.io)
- **Issues:** [GitHub Issues](https://github.com/settler/settler/issues)
- **Email:** support@settler.io
