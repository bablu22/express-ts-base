import { Queue, type JobsOptions, type Job } from 'bullmq';
import { RedisClient } from '@lib/redis';

export abstract class BaseJob<T = unknown> {
  abstract readonly name: string;
  abstract readonly queueName: string;
  private queue: Queue | null = null;

  /**
   * Gets or instantiates the Queue client for this job.
   */
  getQueue(): Queue {
    if (!this.queue) {
      this.queue = new Queue(this.queueName, {
        connection: RedisClient.createQueueConnection(),
      });
    }
    return this.queue;
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
