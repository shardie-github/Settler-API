"use strict";
/**
 * Job Service
 * Application service for reconciliation job operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const Job_1 = require("../../domain/entities/Job");
const encryption_1 = require("../../infrastructure/security/encryption");
const DomainEvent_1 = require("../../domain/events/DomainEvent");
class JobService {
    jobRepository;
    eventBus;
    constructor(jobRepository, eventBus) {
        this.jobRepository = jobRepository;
        this.eventBus = eventBus;
    }
    async createJob(command) {
        // Encrypt adapter configurations
        const sourceConfigEncrypted = await (0, encryption_1.encrypt)(JSON.stringify(command.sourceConfig));
        const targetConfigEncrypted = await (0, encryption_1.encrypt)(JSON.stringify(command.targetConfig));
        // Create job entity
        const job = Job_1.Job.create({
            userId: command.userId,
            name: command.name,
            sourceAdapter: command.sourceAdapter,
            sourceConfigEncrypted,
            targetAdapter: command.targetAdapter,
            targetConfigEncrypted,
            rules: command.rules,
            schedule: command.schedule,
        });
        // Save job
        const savedJob = await this.jobRepository.save(job);
        // Emit domain event
        await this.eventBus.publish(new DomainEvent_1.JobCreatedEvent(savedJob.id, savedJob.userId, savedJob.name));
        return {
            jobId: savedJob.id,
            name: savedJob.name,
            status: savedJob.status,
        };
    }
    async getJob(query) {
        const job = await this.jobRepository.findByIdAndUserId(query.jobId, query.userId);
        if (!job) {
            throw new Error('Job not found');
        }
        return {
            id: job.id,
            userId: job.userId,
            name: job.name,
            sourceAdapter: job.sourceAdapter,
            targetAdapter: job.targetAdapter,
            rules: job.rules,
            schedule: job.schedule,
            status: job.status,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
        };
    }
    async listJobs(query) {
        const jobs = await this.jobRepository.findByUserId(query.userId, query.limit, query.offset);
        const total = await this.jobRepository.countByUserId(query.userId);
        return {
            jobs: jobs.map((job) => ({
                id: job.id,
                name: job.name,
                sourceAdapter: job.sourceAdapter,
                targetAdapter: job.targetAdapter,
                status: job.status,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
            })),
            total,
            limit: query.limit,
            offset: query.offset,
        };
    }
    async updateJob(jobId, userId, updates) {
        const job = await this.jobRepository.findByIdAndUserId(jobId, userId);
        if (!job) {
            throw new Error('Job not found');
        }
        const changes = {};
        if (updates.name) {
            // In a real implementation, we'd have an updateName method
            changes.name = updates.name;
        }
        if (updates.rules) {
            job.updateRules(updates.rules);
            changes.rules = updates.rules;
        }
        if (updates.schedule !== undefined) {
            job.updateSchedule(updates.schedule);
            changes.schedule = updates.schedule;
        }
        if (updates.sourceConfig || updates.targetConfig) {
            const sourceConfigEncrypted = updates.sourceConfig
                ? await (0, encryption_1.encrypt)(JSON.stringify(updates.sourceConfig))
                : job.sourceConfigEncrypted;
            const targetConfigEncrypted = updates.targetConfig
                ? await (0, encryption_1.encrypt)(JSON.stringify(updates.targetConfig))
                : job.targetConfigEncrypted;
            job.updateConfigs(sourceConfigEncrypted, targetConfigEncrypted);
            changes.configs = 'updated';
        }
        const savedJob = await this.jobRepository.save(job);
        // Emit domain event
        await this.eventBus.publish(new DomainEvent_1.JobUpdatedEvent(savedJob.id, savedJob.userId, changes));
        return savedJob;
    }
    async deleteJob(jobId, userId) {
        const job = await this.jobRepository.findByIdAndUserId(jobId, userId);
        if (!job) {
            throw new Error('Job not found');
        }
        await this.jobRepository.delete(jobId);
    }
}
exports.JobService = JobService;
//# sourceMappingURL=JobService.js.map