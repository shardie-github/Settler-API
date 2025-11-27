export declare function verifyWebhookSignature(adapter: string, payload: string | Buffer, signature: string): Promise<boolean>;
export declare function generateWebhookSignature(payload: string | Buffer, secret: string, algorithm?: string): string;
//# sourceMappingURL=webhook-signature.d.ts.map