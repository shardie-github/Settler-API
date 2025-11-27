/**
 * Example: Dashboard Metrics
 * Track activation and usage metrics
 */

import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function main() {
  const startDate = "2026-01-01T00:00:00Z";
  const endDate = "2026-01-31T23:59:59Z";

  // Get activation dashboard
  const activation = await settler.dashboards.activation({
    startDate,
    endDate,
  });

  console.log("=== Activation Dashboard ===");
  console.log("Signup funnel:", activation.data.signupFunnel);
  console.log("Time to first value:", activation.data.timeToFirstValue);
  console.log("Activation by channel:", activation.data.activationByChannel);

  // Get usage dashboard
  const usage = await settler.dashboards.usage({
    startDate,
    endDate,
  });

  console.log("\n=== Usage Dashboard ===");
  console.log("Reconciliation volume:", usage.data.reconciliationVolume);
  console.log("Accuracy trends:", usage.data.accuracyTrends);
  console.log("Error rate:", usage.data.errorRate);
  console.log("Exception rate:", usage.data.exceptionRate);

  // Get support dashboard
  const support = await settler.dashboards.support({
    startDate,
    endDate,
  });

  console.log("\n=== Support Dashboard ===");
  console.log("Ticket volume:", support.data.ticketVolume);
  console.log("Resolution time:", support.data.resolutionTime);
}

main().catch(console.error);
