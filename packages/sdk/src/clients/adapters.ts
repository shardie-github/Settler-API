import { ReconcilifyClient } from "../client";
import { Adapter, ApiResponse, ListResponse } from "../types";

export class AdaptersClient {
  constructor(private readonly client: ReconcilifyClient) {}

  async list(): Promise<ListResponse<Adapter>> {
    return this.client.request<ListResponse<Adapter>>(
      "GET",
      "/api/v1/adapters"
    );
  }

  async get(id: string): Promise<ApiResponse<Adapter>> {
    return this.client.request<ApiResponse<Adapter>>(
      "GET",
      `/api/v1/adapters/${id}`
    );
  }
}
