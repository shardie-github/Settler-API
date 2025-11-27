/**
 * SSRF Protection
 * Prevents Server-Side Request Forgery attacks
 */
/**
 * Check if hostname is an internal IP
 */
export declare function isInternalIP(hostname: string): boolean;
/**
 * Validate URL is safe for external requests
 */
export declare function validateExternalUrl(url: string): Promise<boolean>;
/**
 * Check if URL is allowed (whitelist approach)
 */
export declare function isAllowedUrl(url: string, allowedDomains?: string[]): boolean;
//# sourceMappingURL=SSRFProtection.d.ts.map