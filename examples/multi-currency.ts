/**
 * Example: Multi-Currency Reconciliation
 * Reconcile transactions in different currencies
 */

import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function main() {
  const job = await settler.jobs.create({
    name: "Multi-Currency Reconciliation",
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
        // FX conversion handled automatically
      ],
      // Enable FX conversion
      fxConversion: {
        enabled: true,
        baseCurrency: "USD",
      },
    },
  });

  console.log("Multi-currency job created:", job.data.id);
  console.log("FX conversion enabled with base currency: USD");
}

main().catch(console.error);
