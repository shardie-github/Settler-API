/**
 * Example: Scheduled Reconciliations
 * Set up automated daily/weekly reconciliations
 */

import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function main() {
  // Daily reconciliation at 2 AM
  const dailyJob = await settler.jobs.create({
    name: "Daily Reconciliation",
    source: {
      adapter: "shopify",
      config: {
        apiKey: process.env.SHOPIFY_API_KEY!,
        shopDomain: process.env.SHOPIFY_SHOP_DOMAIN!,
      },
    },
    target: {
      adapter: "stripe",
      config: {
        apiKey: process.env.STRIPE_SECRET_KEY!,
      },
    },
    rules: {
      matching: [
        { field: "order_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
      ],
    },
    schedule: "0 2 * * *", // Cron: Daily at 2 AM
  });

  console.log("Daily job created:", dailyJob.data.id);

  // Weekly reconciliation on Monday at 9 AM
  const weeklyJob = await settler.jobs.create({
    name: "Weekly Reconciliation",
    source: {
      adapter: "stripe",
      config: {
        apiKey: process.env.STRIPE_SECRET_KEY!,
      },
    },
    target: {
      adapter: "quickbooks",
      config: {
        clientId: process.env.QB_CLIENT_ID!,
        clientSecret: process.env.QB_CLIENT_SECRET!,
        realmId: process.env.QB_REALM_ID!,
      },
    },
    rules: {
      matching: [
        { field: "transaction_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
      ],
    },
    schedule: "0 9 * * 1", // Cron: Monday at 9 AM
  });

  console.log("Weekly job created:", weeklyJob.data.id);

  // Monthly reconciliation on first day at midnight
  const monthlyJob = await settler.jobs.create({
    name: "Monthly Reconciliation",
    source: {
      adapter: "stripe",
      config: {
        apiKey: process.env.STRIPE_SECRET_KEY!,
      },
    },
    target: {
      adapter: "quickbooks",
      config: {
        clientId: process.env.QB_CLIENT_ID!,
        clientSecret: process.env.QB_CLIENT_SECRET!,
        realmId: process.env.QB_REALM_ID!,
      },
    },
    rules: {
      matching: [
        { field: "transaction_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
      ],
    },
    schedule: "0 0 1 * *", // Cron: First day of month at midnight
  });

  console.log("Monthly job created:", monthlyJob.data.id);
}

main().catch(console.error);
