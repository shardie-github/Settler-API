/**
 * Adapter Connection Tester
 * E1: Test adapter connections before creating jobs
 */
export interface ConnectionTestResult {
    success: boolean;
    error?: string;
    latency?: number;
    adapter?: string;
}
/**
 * Test adapter connection
 */
export declare function testAdapterConnection(adapter: string, config: Record<string, unknown>): Promise<ConnectionTestResult>;
//# sourceMappingURL=adapter-connection-tester.d.ts.map