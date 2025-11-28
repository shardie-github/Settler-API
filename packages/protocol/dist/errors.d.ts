/**
 * Error Types
 * Standardized error handling for reconciliation workflows
 */
/**
 * Base Reconciliation Error
 */
export declare class ReconciliationError extends Error {
    code: string;
    statusCode?: number | undefined;
    details?: Record<string, unknown> | undefined;
    timestamp: string;
    constructor(message: string, code: string, statusCode?: number, details?: Record<string, unknown>);
}
/**
 * Validation Error
 */
export declare class ValidationError extends ReconciliationError {
    field?: string | undefined;
    value?: unknown;
    constructor(message: string, field?: string, value?: unknown, details?: Record<string, unknown>);
}
/**
 * Security Error
 */
export declare class SecurityError extends ReconciliationError {
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Compilation Error
 */
export declare class CompilationError extends ReconciliationError {
    component?: string | undefined;
    line?: number | undefined;
    column?: number | undefined;
    constructor(message: string, component?: string, line?: number, column?: number, details?: Record<string, unknown>);
}
/**
 * Configuration Error
 */
export declare class ConfigurationError extends ReconciliationError {
    configPath?: string | undefined;
    constructor(message: string, configPath?: string, details?: Record<string, unknown>);
}
//# sourceMappingURL=errors.d.ts.map