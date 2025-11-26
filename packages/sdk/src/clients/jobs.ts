import { ReconcilifyClient } from "../client";
import {
  ReconciliationJob,
  CreateJobRequest,
  ApiResponse,
  ListResponse,
} from "../types";

export class JobsClient {
  constructor(private readonly client: ReconcilifyClient) {}

  async create(request: CreateJobRequest): Promise<ApiResponse<ReconciliationJob>> {
    return this.client.request<ApiResponse<ReconciliationJob>>(
      "POST",
      "/api/v1/jobs",
      { body: request }
    );
  }

  async list(): Promise<ListResponse<ReconciliationJob>> {
    return this.client.request<ListResponse<ReconciliationJob>>(
      "GET",
      "/api/v1/jobs"
    );
  }

  async get(id: string): Promise<ApiResponse<ReconciliationJob>> {
    return this.client.request<ApiResponse<ReconciliationJob>>(
      "GET",
      `/api/v1/jobs/${id}`
    );
  }

  async run(id: string): Promise<ApiResponse<{ id: string; jobId: string; status: string; startedAt: string }>> {
    return this.client.request<ApiResponse<{ id: string; jobId: string; status: string; startedAt: string }>>(
      "POST",
      `/api/v1/jobs/${id}/run`
    );
  }

  async delete(id: string): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/api/v1/jobs/${id}`
    );
  }
}
