/**
 * Job Repository Implementation
 * PostgreSQL implementation of IJobRepository
 */
import { Job } from '../../domain/entities/Job';
import { IJobRepository } from '../../domain/repositories/IJobRepository';
export declare class JobRepository implements IJobRepository {
    findById(id: string): Promise<Job | null>;
    findByUserId(userId: string, limit: number, offset: number): Promise<Job[]>;
    findByIdAndUserId(id: string, userId: string): Promise<Job | null>;
    save(job: Job): Promise<Job>;
    delete(id: string): Promise<void>;
    countByUserId(userId: string): Promise<number>;
    private mapRowToProps;
}
//# sourceMappingURL=JobRepository.d.ts.map