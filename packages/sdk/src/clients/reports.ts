import { ReconcilifyClient } from "../client";
import { ReconciliationReport, ApiResponse, ListResponse } from "../types";

export interface GetReportOptions {
  startDate?: string;
  endDate?: string;
  format?: "json" | "csv";
}

export class ReportsClient {
  constructor(private readonly client: ReconcilifyClient) {}

  async get(jobId: string, options: GetReportOptions = {}): Promise<ApiResponse<ReconciliationReport>> {
    const query: Record<string, string> = {};
    if (options.startDate) query.startDate = options.startDate;
    if (options.endDate) query.endDate = options.endDate;
    if (options.format) query.format = options.format;

    return this.client.request<ApiResponse<ReconciliationReport>>(
      "GET",
      `/api/v1/reports/${jobId}`,
      { query }
    );
  }

  async list(): Promise<ListResponse<Omit<ReconciliationReport, "matches" | "unmatched" | "errors">>> {
    return this.client.request<ListResponse<Omit<ReconciliationReport, "matches" | "unmatched" | "errors">>>(
      "GET",
      "/api/v1/reports"
    );
  }
}
