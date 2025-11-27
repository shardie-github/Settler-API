/**
 * Observability Dashboard Configuration
 * Grafana dashboard configurations and Prometheus alerting rules
 */
/**
 * Prometheus Alerting Rules
 * These rules should be configured in Prometheus
 */
export declare const prometheusAlerts: {
    highErrorRate: {
        alert: string;
        expr: string;
        for: string;
        labels: {
            severity: string;
        };
        annotations: {
            summary: string;
            description: string;
        };
    };
    highLatency: {
        alert: string;
        expr: string;
        for: string;
        labels: {
            severity: string;
        };
        annotations: {
            summary: string;
            description: string;
        };
    };
    lowCacheHitRate: {
        alert: string;
        expr: string;
        for: string;
        labels: {
            severity: string;
        };
        annotations: {
            summary: string;
            description: string;
        };
    };
    databaseConnectionPoolExhausted: {
        alert: string;
        expr: string;
        for: string;
        labels: {
            severity: string;
        };
        annotations: {
            summary: string;
            description: string;
        };
    };
    reconciliationFailureRate: {
        alert: string;
        expr: string;
        for: string;
        labels: {
            severity: string;
        };
        annotations: {
            summary: string;
            description: string;
        };
    };
};
/**
 * Grafana Dashboard Variables
 */
export declare const grafanaVariables: {
    environment: {
        name: string;
        type: string;
        query: string;
        current: {
            value: string;
        };
    };
    jobId: {
        name: string;
        type: string;
        query: string;
        current: {
            value: string;
        };
    };
};
/**
 * Key Metrics to Monitor
 */
export declare const keyMetrics: {
    api: string[];
    reconciliation: string[];
    cache: string[];
    database: string[];
    redis: string[];
};
//# sourceMappingURL=dashboards.d.ts.map