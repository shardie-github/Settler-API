/**
 * Performance Utilities
 * Provides performance monitoring and optimization helpers
 */
/**
 * Measure execution time of async function
 */
export declare function measureAsync<T>(fn: () => Promise<T>, label?: string): Promise<{
    result: T;
    duration: number;
}>;
/**
 * Measure execution time of sync function
 */
export declare function measureSync<T>(fn: () => T, label?: string): {
    result: T;
    duration: number;
};
/**
 * Batch operations for better performance
 */
export declare function batchProcess<T, R>(items: T[], batchSize: number, processor: (batch: T[]) => Promise<R[]>): Promise<R[]>;
/**
 * Debounce function calls
 */
export declare function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, delay: number): (...args: TArgs) => void;
/**
 * Throttle function calls
 */
export declare function throttle<TArgs extends unknown[]>(fn: (...args: TArgs) => void, delay: number): (...args: TArgs) => void;
/**
 * Memoize function results
 */
export declare function memoize<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => TReturn, keyGenerator?: (...args: TArgs) => string): (...args: TArgs) => TReturn;
//# sourceMappingURL=performance.d.ts.map