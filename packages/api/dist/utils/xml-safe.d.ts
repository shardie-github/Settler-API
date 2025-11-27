/**
 * Safely parse XML with XXE prevention
 *
 * IMPORTANT: Never enable external entities (noEnt: false)
 * This prevents XXE attacks that could read local files or perform SSRF
 */
export declare function safeParseXML(xml: string): Promise<any>;
/**
 * Validate XML before parsing to detect XXE attempts
 */
export declare function validateXMLForXXE(xml: string): {
    safe: boolean;
    reason?: string;
};
/**
 * Sanitize XML by removing dangerous patterns
 */
export declare function sanitizeXML(xml: string): string;
//# sourceMappingURL=xml-safe.d.ts.map