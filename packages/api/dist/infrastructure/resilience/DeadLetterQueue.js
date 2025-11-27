"use strict";
/**
 * Dead Letter Queue
 * Handles irrecoverable jobs and events
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadLetterQueue = void 0;
const db_1 = require("../../db");
class DeadLetterQueue {
    db;
    constructor(db = db_1.pool) {
        this.db = db;
    }
    /**
     * Add an entry to the dead letter queue
     */
    async addEntry(entry) {
        const id = crypto.randomUUID();
        const query = `
      INSERT INTO dead_letter_queue (
        id,
        saga_id,
        event_id,
        error_type,
        error_message,
        error_stack,
        payload,
        retry_count,
        max_retries,
        tenant_id,
        correlation_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    `;
        await this.db.query(query, [
            id,
            entry.saga_id || null,
            entry.event_id || null,
            entry.error_type,
            entry.error_message,
            entry.error_stack || null,
            JSON.stringify(entry.payload),
            entry.retry_count,
            entry.max_retries,
            entry.tenant_id,
            entry.correlation_id || null,
        ]);
        return id;
    }
    /**
     * Get unresolved entries
     */
    async getUnresolvedEntries(limit = 100) {
        const query = `
      SELECT 
        id,
        saga_id,
        event_id,
        error_type,
        error_message,
        error_stack,
        payload,
        retry_count,
        max_retries,
        tenant_id,
        correlation_id,
        created_at,
        resolved_at,
        resolution_notes
      FROM dead_letter_queue
      WHERE resolved_at IS NULL
      ORDER BY created_at ASC
      LIMIT $1
    `;
        const result = await this.db.query(query, [limit]);
        return result.rows.map((row) => ({
            id: row.id,
            saga_id: row.saga_id,
            event_id: row.event_id,
            error_type: row.error_type,
            error_message: row.error_message,
            error_stack: row.error_stack,
            payload: JSON.parse(row.payload),
            retry_count: row.retry_count,
            max_retries: row.max_retries,
            tenant_id: row.tenant_id,
            correlation_id: row.correlation_id,
            created_at: new Date(row.created_at),
            resolved_at: row.resolved_at ? new Date(row.resolved_at) : undefined,
            resolution_notes: row.resolution_notes,
        }));
    }
    /**
     * Resolve an entry
     */
    async resolveEntry(id, resolutionNotes) {
        const query = `
      UPDATE dead_letter_queue
      SET 
        resolved_at = NOW(),
        resolution_notes = $1
      WHERE id = $2
    `;
        await this.db.query(query, [resolutionNotes || null, id]);
    }
    /**
     * Get entries by tenant
     */
    async getEntriesByTenant(tenantId, limit = 100) {
        const query = `
      SELECT 
        id,
        saga_id,
        event_id,
        error_type,
        error_message,
        error_stack,
        payload,
        retry_count,
        max_retries,
        tenant_id,
        correlation_id,
        created_at,
        resolved_at,
        resolution_notes
      FROM dead_letter_queue
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
        const result = await this.db.query(query, [tenantId, limit]);
        return result.rows.map((row) => ({
            id: row.id,
            saga_id: row.saga_id,
            event_id: row.event_id,
            error_type: row.error_type,
            error_message: row.error_message,
            error_stack: row.error_stack,
            payload: JSON.parse(row.payload),
            retry_count: row.retry_count,
            max_retries: row.max_retries,
            tenant_id: row.tenant_id,
            correlation_id: row.correlation_id,
            created_at: new Date(row.created_at),
            resolved_at: row.resolved_at ? new Date(row.resolved_at) : undefined,
            resolution_notes: row.resolution_notes,
        }));
    }
}
exports.DeadLetterQueue = DeadLetterQueue;
//# sourceMappingURL=DeadLetterQueue.js.map