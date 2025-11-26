import { ReconcilifyClient } from "../client";
import { Webhook, CreateWebhookRequest, ApiResponse, ListResponse } from "../types";

export class WebhooksClient {
  constructor(private readonly client: ReconcilifyClient) {}

  async create(request: CreateWebhookRequest): Promise<ApiResponse<Webhook>> {
    return this.client.request<ApiResponse<Webhook>>(
      "POST",
      "/api/v1/webhooks",
      { body: request }
    );
  }

  async list(): Promise<ListResponse<Webhook>> {
    return this.client.request<ListResponse<Webhook>>(
      "GET",
      "/api/v1/webhooks"
    );
  }

  async delete(id: string): Promise<void> {
    await this.client.request<void>(
      "DELETE",
      `/api/v1/webhooks/${id}`
    );
  }
}
