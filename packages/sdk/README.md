# @reconcilify/sdk

TypeScript SDK for the Reconcilify API.

## Installation

```bash
npm install @reconcilify/sdk
```

## Usage

```typescript
import Reconcilify from "@reconcilify/sdk";

const client = new Reconcilify({
  apiKey: "rk_your_api_key_here",
  baseUrl: "https://api.reconcilify.io", // Optional, defaults to production
});

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
    conflictResolution: "last-wins",
  },
});

// Get reconciliation report
const report = await client.reports.get(job.data.id, {
  startDate: "2026-01-01",
  endDate: "2026-01-31",
});

console.log(report.data.summary);
// {
//   matched: 145,
//   unmatched: 3,
//   errors: 1,
//   accuracy: 98.7,
//   totalTransactions: 149
// }
```

## API Reference

See [docs.reconcilify.io](https://docs.reconcilify.io) for complete API documentation.
