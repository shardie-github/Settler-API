import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";

export class ShopifyAdapter implements Adapter {
  name = "shopify";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { dateRange, config } = options;
    const apiKey = config.apiKey as string;
    const shopDomain = config.shopDomain as string;

    if (!apiKey || !shopDomain) {
      throw new Error("Shopify API key and shop domain are required");
    }

    // In production, use Shopify Admin API
    // const client = new Shopify.Clients.Rest(shopDomain, apiKey);
    // const orders = await client.get({ path: "orders", query: { created_at_min: dateRange.start.toISOString() } });

    // Mock implementation
    return [
      {
        id: "order_123456",
        amount: 99.99,
        currency: "USD",
        date: new Date(),
        metadata: { order_id: "order_123456", customer_email: "customer@example.com" },
        sourceId: "order_123456",
        referenceId: "order_123456",
      },
    ];
  }

  normalize(data: unknown): NormalizedData {
    // In production, normalize Shopify order object
    const order = data as {
      id: string;
      total_price: string;
      currency: string;
      created_at: string;
      name?: string;
      email?: string;
    };

    return {
      id: order.id.toString(),
      amount: parseFloat(order.total_price),
      currency: order.currency.toUpperCase(),
      date: new Date(order.created_at),
      metadata: {
        order_name: order.name,
        customer_email: order.email,
      },
      sourceId: order.id.toString(),
      referenceId: order.name,
    };
  }

  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];

    if (!data.id) {
      errors.push("ID is required");
    }
    if (data.amount <= 0) {
      errors.push("Amount must be greater than 0");
    }
    if (!data.currency) {
      errors.push("Currency is required");
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
