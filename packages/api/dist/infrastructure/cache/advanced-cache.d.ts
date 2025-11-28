/**
 * Advanced Caching Strategies
 * Implements tag-based invalidation, cache warming, and coherency checks
 */
export interface CacheTag {
    tag: string;
    keys: string[];
}
/**
 * Set cache value with tags for invalidation
 *
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds
 * @param tags - Tags for invalidation
 */
export declare function setWithTags<T>(key: string, value: T, ttlSeconds: number, tags?: string[]): Promise<void>;
/**
 * Invalidate all keys with a specific tag
 *
 * @param tag - Tag to invalidate
 */
export declare function invalidateByTag(tag: string): Promise<number>;
/**
 * Invalidate multiple tags at once
 *
 * @param tags - Tags to invalidate
 */
export declare function invalidateByTags(tags: string[]): Promise<number>;
/**
 * Warm cache with frequently accessed data
 *
 * @param warmupFn - Function that returns key-value pairs to cache
 * @param ttlSeconds - Time to live for warmed entries
 */
export declare function warmCache(warmupFn: () => Promise<Array<{
    key: string;
    value: unknown;
    tags?: string[];
}>>, ttlSeconds?: number): Promise<void>;
/**
 * Check cache coherency (verify cached data is still valid)
 *
 * @param key - Cache key to check
 * @param validator - Function that validates cached value
 * @returns True if cache is coherent, false if invalid
 */
export declare function checkCoherency<T>(key: string, validator: (value: T) => Promise<boolean>): Promise<boolean>;
/**
 * Get cache statistics
 */
export declare function getCacheStats(): {
    tagCount: number;
    tags: string[];
    totalKeys: number;
};
/**
 * Clear all cache and tags
 */
export declare function clearAllCache(): Promise<void>;
//# sourceMappingURL=advanced-cache.d.ts.map