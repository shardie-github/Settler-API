/**
 * Retry Logic with Exponential Backoff
 * Implements retry logic with jitter for external API calls
 */
export interface RetryOptions {
    retries?: number;
    minTimeout?: number;
    maxTimeout?: number;
    factor?: number;
    onFailedAttempt?: (error: Error) => void;
}
/**
 * Retry a function with exponential backoff
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Add jitter to delay to prevent thundering herd
 */
export declare function addJitter(delay: number, jitterPercent?: number): number;
//# sourceMappingURL=retry.d.ts.map