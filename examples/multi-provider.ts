/**
 * Example: Multi-Payment Provider Reconciliation
 * Reconcile payments from Stripe, PayPal, and Square
 */

import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function main() {
  // Create multiple jobs for each provider
  const stripeJob = await settler.jobs.create({
    name: "Stripe Reconciliation",
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
  });

  const paypalJob = await settler.jobs.create({
    name: "PayPal Reconciliation",
    source: {
      adapter: "paypal",
      config: {
        clientId: process.env.PAYPAL_CLIENT_ID!,
        clientSecret: process.env.PAYPAL_SECRET!,
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
  });

  const squareJob = await settler.jobs.create({
    name: "Square Reconciliation",
    source: {
      adapter: "square",
      config: {
        accessToken: process.env.SQUARE_ACCESS_TOKEN!,
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
  });

  console.log("Jobs created:");
  console.log("  Stripe:", stripeJob.data.id);
  console.log("  PayPal:", paypalJob.data.id);
  console.log("  Square:", squareJob.data.id);

  // Run all reconciliations
  const executions = await Promise.all([
    settler.jobs.run(stripeJob.data.id),
    settler.jobs.run(paypalJob.data.id),
    settler.jobs.run(squareJob.data.id),
  ]);

  console.log("All reconciliations started");
}

main().catch(console.error);
