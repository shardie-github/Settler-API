/**
 * Example: API Key Management
 * Manage API keys programmatically
 */

import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: process.env.SETTLER_API_KEY,
});

async function main() {
  // List API keys
  const keys = await settler.apiKeys.list();
  console.log("Current API keys:", keys.data.length);

  // Create new API key
  const newKey = await settler.apiKeys.create({
    name: "Production API Key",
    scopes: ["jobs:read", "jobs:write", "reports:read"],
    rateLimit: 2000,
  });
  console.log("New key created:", newKey.data.id);
  console.log("Key (store securely):", newKey.data.key); // Only shown once!

  // Update API key
  await settler.apiKeys.update(newKey.data.id, {
    name: "Updated Production API Key",
    rateLimit: 5000,
  });
  console.log("API key updated");

  // Regenerate API key (if lost)
  const regenerated = await settler.apiKeys.regenerate(newKey.data.id);
  console.log("Key regenerated:", regenerated.data.id);
  console.log("New key (store securely):", regenerated.data.key);

  // Revoke old API key
  await settler.apiKeys.delete(keys.data[0].id);
  console.log("Old API key revoked");
}

main().catch(console.error);
