export declare function sanitizeHtml(str: string): string;
/**
 * Recursively sanitize report data to prevent XSS attacks
 *
 * @param data - Data to sanitize (string, array, object, or primitive)
 * @returns Sanitized data with HTML entities escaped
 */
export declare function sanitizeReportData(data: unknown): unknown;
//# sourceMappingURL=xss-sanitize.d.ts.map