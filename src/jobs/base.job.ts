import type { Queue, JobsOptions, Job } from 'bullmq';
import { QueueManager } from './queue-manager';

export abstract class BaseJob<T = unknown> {
  abstract readonly name: string;
  abstract readonly queueName: string;

  /**
   * Gets the Queue client for this job via QueueManager.
   */
  getQueue(): Queue {
    return QueueManager.getQueue(this.queueName);
  }

  /**
   * Enqueues a new job with strongly-typed data payload.
   */
  async enqueue(data: T, opts?: JobsOptions): Promise<Job<T>> {
    return this.getQueue().add(this.name, data, opts);
  }

  /**
   * The actual execution handler logic defined by concrete jobs.
   */
  abstract handle(job: Job<T>): Promise<unknown>;
}
