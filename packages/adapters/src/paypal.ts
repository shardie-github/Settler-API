import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";

export class PayPalAdapter implements Adapter {
  name = "paypal";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { dateRange, config } = options;
    const clientId = config.clientId as string;
    const clientSecret = config.clientSecret as string;

    if (!clientId || !clientSecret) {
      throw new Error("PayPal client ID and secret are required");
    }

    // In production, use PayPal SDK
    // Mock implementation
    return [
      {
        id: "payment_123",
        amount: 99.99,
        currency: "USD",
        date: new Date(),
        metadata: { payment_id: "payment_123" },
        sourceId: "payment_123",
        referenceId: "payment_123",
      },
    ];
  }

  normalize(data: unknown): NormalizedData {
    const payment = data as {
      id: string;
      amount: { total: string; currency: string };
      create_time: string;
      custom?: string;
    };

    return {
      id: payment.id,
      amount: parseFloat(payment.amount.total),
      currency: payment.amount.currency.toUpperCase(),
      date: new Date(payment.create_time),
      metadata: {
        custom: payment.custom,
      },
      sourceId: payment.id,
      referenceId: payment.custom,
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

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
