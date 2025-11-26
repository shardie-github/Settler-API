import { test, expect } from "@playwright/test";

test.describe("Reconcilify API", () => {
  test("health check endpoint", async ({ request }) => {
    const response = await request.get("http://localhost:3000/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("create reconciliation job", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/v1/jobs", {
      headers: {
        "X-API-Key": "rk_test_key",
        "Content-Type": "application/json",
      },
      data: {
        name: "Test Job",
        source: {
          adapter: "shopify",
          config: {},
        },
        target: {
          adapter: "stripe",
          config: {},
        },
        rules: {
          matching: [
            { field: "order_id", type: "exact" },
            { field: "amount", type: "exact", tolerance: 0.01 },
          ],
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data).toHaveProperty("id");
    expect(body.data.name).toBe("Test Job");
  });
});
