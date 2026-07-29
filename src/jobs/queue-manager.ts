import { Worker, type Job } from 'bullmq';
import { RedisClient } from '@lib/redis';
import { logger } from '@lib/logger';
import type { BaseJob } from './base.job';
import { QueueFactory } from './queue-factory';
import { SampleJob } from './sample.job';
import { emailJob } from './email.job';

/**
 * QueueManager — registers jobs, manages BullMQ Queue clients, and boots workers on startup.
 *
 * To add a new job:
 *   1. Create a class in src/jobs/ extending BaseJob<YourPayload>
 *   2. Export a singleton from that file
 *   3. Import and register it below with QueueManager.register()
 */
export class QueueManager {
  private static readonly jobs = new Map<string, BaseJob>();
  private static readonly workers: Worker[] = [];

  static register(job: BaseJob): void {
    QueueManager.jobs.set(`${job.queueName}:${job.name}`, job);
    logger.info(
      { queue: job.queueName, jobName: job.name },
      'QueueManager: registered job',
    );
  }

  static start(): void {
    // Register your jobs here
    QueueManager.register(new SampleJob());
    QueueManager.register(emailJob);

    // Group jobs by queue name, then spin up one Worker per queue
    const queues = new Map<string, Array<BaseJob>>();
    for (const job of QueueManager.jobs.values()) {
      const list = queues.get(job.queueName) ?? [];
      list.push(job);
      queues.set(job.queueName, list);
    }

    for (const [queueName] of queues.entries()) {
      const worker = new Worker(
        queueName,
        async (job: Job) => {
          const key = `${queueName}:${job.name}`;
          const handler = QueueManager.jobs.get(key);
          if (!handler) {
            throw new Error(`No job handler registered for ${key}`);
          }
          return handler.handle(job);
        },
        {
          connection: RedisClient.createQueueConnection(),
          concurrency: 5,
        },
      );

      worker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, err, queue: queueName }, 'Job failed');
      });

      worker.on('completed', (job) => {
        logger.debug({ jobId: job.id, queue: queueName }, 'Job completed');
      });

      QueueManager.workers.push(worker);
      logger.info({ queueName }, 'QueueManager: worker started');
    }
  }

  static async shutdown(): Promise<void> {
    logger.info('QueueManager: shutting down workers and queues...');

    await Promise.all(QueueManager.workers.map((w) => w.close()));
    QueueManager.workers.length = 0;

    await QueueFactory.closeAll();
    QueueManager.jobs.clear();

    logger.info('QueueManager: shutdown complete');
  }
}
