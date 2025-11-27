/**
 * Token Bucket Rate Limiting
 * Adaptive token bucket implementation for tenant rate limiting
 */
export interface TokenBucketConfig {
    capacity: number;
    refillRate: number;
    adaptive?: boolean;
}
export declare class TokenBucket {
    private redis;
    constructor();
    /**
     * Try to consume tokens from bucket
     * Returns { allowed: boolean, remaining: number, resetAt: Date }
     */
    consume(key: string, tokens: number, config: TokenBucketConfig): Promise<{
        allowed: boolean;
        remaining: number;
        resetAt: Date;
    }>;
    /**
     * Get current bucket state without consuming
     */
    peek(key: string, config: TokenBucketConfig): Promise<{
        tokens: number;
        resetAt: Date;
    }>;
    /**
     * Reset bucket for a key
     */
    reset(key: string): Promise<void>;
    /**
     * Adaptive rate limiting: adjust rate based on tenant behavior
     */
    adjustRate(key: string, currentConfig: TokenBucketConfig, successRate: number): Promise<TokenBucketConfig>;
    /**
     * Close Redis connection
     */
    close(): Promise<void>;
}
export declare const tokenBucket: TokenBucket;
//# sourceMappingURL=TokenBucket.d.ts.map