/**
 * Job Service
 * Application service for reconciliation job operations
 */

import { Job } from '../../domain/entities/Job';
import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { CreateJobCommand, CreateJobCommandResult } from '../commands/CreateJobCommand';
import { GetJobQuery, GetJobQueryResult } from '../queries/GetJobQuery';
import { ListJobsQuery, ListJobsQueryResult } from '../queries/ListJobsQuery';
import { encrypt } from '../../infrastructure/security/encryption';
import { JobCreatedEvent, JobUpdatedEvent } from '../../domain/events/DomainEvent';
import { IEventBus } from '../../infrastructure/events/IEventBus';

export class JobService {
  constructor(
    private jobRepository: IJobRepository,
    private eventBus: IEventBus
  ) {}

  async createJob(command: CreateJobCommand): Promise<CreateJobCommandResult> {
    // Encrypt adapter configurations
    const sourceConfigEncrypted = await encrypt(JSON.stringify(command.sourceConfig));
    const targetConfigEncrypted = await encrypt(JSON.stringify(command.targetConfig));

    // Create job entity
    const job = Job.create({
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
    await this.eventBus.publish(
      new JobCreatedEvent(savedJob.id, savedJob.userId, savedJob.name)
    );

    return {
      jobId: savedJob.id,
      name: savedJob.name,
      status: savedJob.status,
    };
  }

  async getJob(query: GetJobQuery): Promise<GetJobQueryResult> {
    const job = await this.jobRepository.findByIdAndUserId(
      query.jobId,
      query.userId
    );

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

  async listJobs(query: ListJobsQuery): Promise<ListJobsQueryResult> {
    const jobs = await this.jobRepository.findByUserId(
      query.userId,
      query.limit,
      query.offset
    );

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

  async updateJob(
    jobId: string,
    userId: string,
    updates: Partial<{
      name: string;
      rules: Job['rules'];
      schedule: string;
      sourceConfig: Record<string, unknown>;
      targetConfig: Record<string, unknown>;
    }>
  ): Promise<Job> {
    const job = await this.jobRepository.findByIdAndUserId(jobId, userId);
    if (!job) {
      throw new Error('Job not found');
    }

    const changes: Record<string, unknown> = {};

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
        ? await encrypt(JSON.stringify(updates.sourceConfig))
        : job.sourceConfigEncrypted;
      const targetConfigEncrypted = updates.targetConfig
        ? await encrypt(JSON.stringify(updates.targetConfig))
        : job.targetConfigEncrypted;

      job.updateConfigs(sourceConfigEncrypted, targetConfigEncrypted);
      changes.configs = 'updated';
    }

    const savedJob = await this.jobRepository.save(job);

    // Emit domain event
    await this.eventBus.publish(
      new JobUpdatedEvent(savedJob.id, savedJob.userId, changes)
    );

    return savedJob;
  }

  async deleteJob(jobId: string, userId: string): Promise<void> {
    const job = await this.jobRepository.findByIdAndUserId(jobId, userId);
    if (!job) {
      throw new Error('Job not found');
    }

    await this.jobRepository.delete(jobId);
  }
}
