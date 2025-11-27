/**
 * Database Migration Runner
 *
 * Runs all database migrations in order:
 * 1. 001-initial-schema.sql - Core schema
 * 2. 002-strategic-initiatives.sql - Strategic features (graph, AI, etc.)
 * 3. 003-canonical-data-model.sql - Canonical data model
 *
 * Supports both PostgreSQL (via pg) and Supabase
 */
interface MigrationResult {
    migration: string;
    success: boolean;
    error?: string;
    statementsExecuted: number;
}
/**
 * Run all migrations in order
 */
export declare function runMigrations(): Promise<MigrationResult[]>;
export {};
//# sourceMappingURL=migrate.d.ts.map