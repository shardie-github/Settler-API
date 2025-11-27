/**
 * Example: SaaS Subscription Reconciliation
 * Reconcile Stripe subscriptions with QuickBooks revenue
 */

import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function main() {
  const job = await settler.jobs.create({
    name: "Monthly Subscription Reconciliation",
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
        { field: "subscription_id", type: "exact" },
        { field: "amount", type: "exact", tolerance: 0.01 },
        { field: "customer_email", type: "exact" },
      ],
    },
    schedule: "0 0 1 * *", // First day of month at midnight
  });

  console.log("Subscription reconciliation job created:", job.data.id);
}

main().catch(console.error);
