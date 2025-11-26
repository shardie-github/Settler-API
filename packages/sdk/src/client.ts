import { JobsClient } from "./clients/jobs";
import { ReportsClient } from "./clients/reports";
import { WebhooksClient } from "./clients/webhooks";
import { AdaptersClient } from "./clients/adapters";

export interface ReconcilifyConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export class ReconcilifyClient {
  public readonly jobs: JobsClient;
  public readonly reports: ReportsClient;
  public readonly webhooks: WebhooksClient;
  public readonly adapters: AdaptersClient;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: ReconcilifyConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.reconcilify.io";
    this.timeout = config.timeout || 30000;

    // Initialize clients
    this.jobs = new JobsClient(this);
    this.reports = new ReportsClient(this);
    this.webhooks = new WebhooksClient(this);
    this.adapters = new AdaptersClient(this);
  }

  async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
      ...(options.body && { body: JSON.stringify(options.body) }),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: "Unknown Error",
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Request failed");
    }
  }
}
