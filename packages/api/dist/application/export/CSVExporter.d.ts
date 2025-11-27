/**
 * Generic CSV Exporter
 *
 * Exports reconciled data to generic CSV format with customizable columns
 */
export interface CSVExportOptions {
    dateRange: {
        start: Date;
        end: Date;
    };
    columns: string[];
    includeFees: boolean;
    includeUnmatched: boolean;
}
export declare class CSVExporter {
    /**
     * Export to generic CSV format
     */
    exportToCSV(tenantId: string, jobId: string, options: CSVExportOptions): Promise<string>;
    /**
     * Get column value from match object
     */
    private getColumnValue;
    /**
     * Get fee column value
     */
    private getFeeColumnValue;
    /**
     * Escape CSV value
     */
    private escapeCSV;
    /**
     * Get default columns
     */
    getDefaultColumns(): string[];
}
//# sourceMappingURL=CSVExporter.d.ts.map