/**
 * Job Repository Interface
 * Defines the contract for job data persistence
 */

import { Job } from '../entities/Job';

export interface IJobRepository {
  findById(id: string): Promise<Job | null>;
  findByUserId(userId: string, limit: number, offset: number): Promise<Job[]>;
  save(job: Job): Promise<Job>;
  delete(id: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
  findByIdAndUserId(id: string, userId: string): Promise<Job | null>;
}
