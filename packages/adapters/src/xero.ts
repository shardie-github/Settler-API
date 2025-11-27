/**
 * Xero Adapter
 * E6: Xero integration for accounting reconciliation
 */

import { BaseAdapter, CanonicalTransaction } from "./base";

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  accessToken?: string;
  refreshToken?: string;
}

export class XeroAdapter extends BaseAdapter {
  private config: XeroConfig;
  private baseUrl = "https://api.xero.com/api.xro/2.0";

  constructor(config: XeroConfig) {
    super();
    this.config = config;
  }

  async fetchTransactions(dateRange?: { start: Date; end: Date }): Promise<CanonicalTransaction[]> {
    // Get access token (refresh if needed)
    const accessToken = await this.getAccessToken();

    // Fetch transactions from Xero
    const startDate = dateRange?.start.toISOString().split('T')[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = dateRange?.end.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

    const response = await fetch(
      `${this.baseUrl}/BankTransactions?where=Date>=DateTime(${startDate})&where=Date<=DateTime(${endDate})`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Xero-tenant-id": this.config.tenantId,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Xero API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const transactions = data.BankTransactions || [];

    return transactions.map((tx: unknown) => this.normalize(tx));
  }

  normalize(transaction: unknown): CanonicalTransaction {
    const tx = transaction as {
      BankTransactionID: string;
      Date: string;
      Total: number;
      CurrencyCode: string;
      Contact?: { Name: string };
      LineItems?: Array<{ Description: string; LineAmount: number }>;
    };

    return {
      id: tx.BankTransactionID,
      amount: Math.abs(tx.Total),
      currency: tx.CurrencyCode,
      date: new Date(tx.Date),
      description: tx.LineItems?.[0]?.Description || "Xero Transaction",
      metadata: {
        contact: tx.Contact?.Name,
        lineItems: tx.LineItems,
      },
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.config.accessToken) {
      // TODO: Verify token is still valid, refresh if needed
      return this.config.accessToken;
    }

    // OAuth flow to get access token
    // This should be handled by the user during initial setup
    throw new Error("Xero access token required. Please complete OAuth flow.");
  }

  async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
    if (!this.config.refreshToken) {
      throw new Error("Refresh token required");
    }

    const response = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh Xero token: ${response.status}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  async syncTransaction(transaction: CanonicalTransaction): Promise<void> {
    const accessToken = await this.getAccessToken();

    // Create bank transaction in Xero
    const xeroTransaction = {
      Type: transaction.amount > 0 ? "RECEIVE" : "SPEND",
      Contact: {
        Name: transaction.metadata?.contact || "Settler",
      },
      Date: transaction.date.toISOString().split('T')[0],
      LineItems: [
        {
          Description: transaction.description,
          LineAmount: transaction.amount,
          AccountCode: "200", // Default account code
        },
      ],
    };

    const response = await fetch(`${this.baseUrl}/BankTransactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Xero-tenant-id": this.config.tenantId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(xeroTransaction),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync transaction to Xero: ${response.status}`);
    }
  }
}
