"use strict";
/**
 * Job Repository Implementation
 * PostgreSQL implementation of IJobRepository
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRepository = void 0;
const Job_1 = require("../../domain/entities/Job");
const db_1 = require("../../db");
class JobRepository {
    async findById(id) {
        const rows = await (0, db_1.query)(`SELECT * FROM jobs WHERE id = $1`, [id]);
        if (rows.length === 0) {
            return null;
        }
        return Job_1.Job.fromPersistence(this.mapRowToProps(rows[0]));
    }
    async findByUserId(userId, limit, offset) {
        const rows = await (0, db_1.query)(`SELECT * FROM jobs WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        return rows.map((row) => Job_1.Job.fromPersistence(this.mapRowToProps(row)));
    }
    async findByIdAndUserId(id, userId) {
        const rows = await (0, db_1.query)(`SELECT * FROM jobs WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (rows.length === 0) {
            return null;
        }
        return Job_1.Job.fromPersistence(this.mapRowToProps(rows[0]));
    }
    async save(job) {
        const props = job.toPersistence();
        const existing = await this.findById(props.id);
        if (existing) {
            // Update with optimistic locking
            const result = await (0, db_1.query)(`UPDATE jobs SET
          name = $1,
          source_adapter = $2,
          source_config_encrypted = $3,
          target_adapter = $4,
          target_config_encrypted = $5,
          rules = $6,
          schedule = $7,
          status = $8,
          version = $9,
          updated_at = NOW()
        WHERE id = $10 AND version = $11
        RETURNING *`, [
                props.name,
                props.sourceAdapter,
                props.sourceConfigEncrypted,
                props.targetAdapter,
                props.targetConfigEncrypted,
                JSON.stringify(props.rules),
                props.schedule,
                props.status,
                props.version,
                props.id,
                props.version - 1, // Previous version for optimistic lock
            ]);
            if (result.length === 0) {
                throw new Error('Job was modified by another operation');
            }
        }
        else {
            // Insert
            await (0, db_1.query)(`INSERT INTO jobs (
          id, user_id, name, source_adapter, source_config_encrypted,
          target_adapter, target_config_encrypted, rules, schedule,
          status, version, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`, [
                props.id,
                props.userId,
                props.name,
                props.sourceAdapter,
                props.sourceConfigEncrypted,
                props.targetAdapter,
                props.targetConfigEncrypted,
                JSON.stringify(props.rules),
                props.schedule,
                props.status,
                props.version,
            ]);
        }
        return job;
    }
    async delete(id) {
        await (0, db_1.query)(`DELETE FROM jobs WHERE id = $1`, [id]);
    }
    async countByUserId(userId) {
        const rows = await (0, db_1.query)(`SELECT COUNT(*) as count FROM jobs WHERE user_id = $1`, [userId]);
        return parseInt(rows[0].count, 10);
    }
    mapRowToProps(row) {
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            sourceAdapter: row.source_adapter,
            sourceConfigEncrypted: row.source_config_encrypted,
            targetAdapter: row.target_adapter,
            targetConfigEncrypted: row.target_config_encrypted,
            rules: row.rules,
            schedule: row.schedule,
            status: row.status,
            version: row.version,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}
exports.JobRepository = JobRepository;
//# sourceMappingURL=JobRepository.js.map