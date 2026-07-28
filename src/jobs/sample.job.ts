import type { Job } from 'bullmq';
import { BaseJob } from './base.job';
import { logger } from '@lib/logger';

export interface SampleJobPayload {
  userId: string;
  action: string;
}

/**
 * SampleJob — A starter background job showing the pattern.
 *
 * Replace or extend this with your real background jobs.
 * Enqueue with: await new SampleJob().enqueue({ userId: '...', action: '...' });
 */
export class SampleJob extends BaseJob<SampleJobPayload> {
  readonly name = 'sample-action';
  readonly queueName = 'default-queue';

  async handle(job: Job<SampleJobPayload>): Promise<void> {
    const { userId, action } = job.data;
    logger.info({ userId, action, jobId: job.id }, 'Processing sample job');

    // TODO: replace with real background work (e.g. sending email, generating report)
    await new Promise((resolve) => setTimeout(resolve, 500));

    logger.info({ jobId: job.id }, 'Sample job completed');
  }
}
