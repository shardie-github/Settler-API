/**
 * Redis Configuration (Upstash)
 */
export declare const redisConfig: {
    upstash: {
        url: string | undefined;
        token: string | undefined;
    };
    fallback: {
        host: string;
        port: number;
        password: string | undefined;
        db: number;
    };
    cache: {
        defaultTTL: number;
        reconciliationTTL: number;
    };
};
//# sourceMappingURL=redis.d.ts.map