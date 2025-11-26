import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";

export class QuickBooksAdapter implements Adapter {
  name = "quickbooks";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { dateRange, config } = options;
    const clientId = config.clientId as string;
    const clientSecret = config.clientSecret as string;

    if (!clientId || !clientSecret) {
      throw new Error("QuickBooks client ID and secret are required");
    }

    // In production, use QuickBooks API SDK
    // Mock implementation
    return [
      {
        id: "transaction_123",
        amount: 99.99,
        currency: "USD",
        date: new Date(),
        metadata: { transaction_id: "transaction_123" },
        sourceId: "transaction_123",
        referenceId: "transaction_123",
      },
    ];
  }

  normalize(data: unknown): NormalizedData {
    const transaction = data as {
      Id: string;
      Amount: number;
      CurrencyRef?: { value: string };
      TxnDate: string;
      DocNumber?: string;
    };

    return {
      id: transaction.Id,
      amount: Math.abs(transaction.Amount),
      currency: transaction.CurrencyRef?.value || "USD",
      date: new Date(transaction.TxnDate),
      metadata: {
        doc_number: transaction.DocNumber,
      },
      sourceId: transaction.Id,
      referenceId: transaction.DocNumber,
    };
  }

  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];

    if (!data.id) {
      errors.push("ID is required");
    }
    if (!data.amount) {
      errors.push("Amount is required");
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
