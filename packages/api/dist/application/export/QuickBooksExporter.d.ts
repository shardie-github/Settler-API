/**
 * QuickBooks Online Exporter
 *
 * Exports reconciled data to QuickBooks Online CSV format
 * as specified in the Product & Technical Specification.
 */
export interface QuickBooksExportOptions {
    dateRange: {
        start: Date;
        end: Date;
    };
    includeFees: boolean;
    includeUnmatched: boolean;
    glAccountMapping?: Record<string, string>;
}
export declare class QuickBooksExporter {
    /**
     * Export to QuickBooks CSV format
     */
    exportToCSV(tenantId: string, jobId: string, options: QuickBooksExportOptions): Promise<string>;
    /**
     * Get GL account mapping template
     */
    getGLAccountMappingTemplate(): Record<string, string>;
}
//# sourceMappingURL=QuickBooksExporter.d.ts.map