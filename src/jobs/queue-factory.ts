import { Queue } from 'bullmq';
import { RedisClient } from '@lib/redis';

export class QueueFactory {
  private static readonly queues = new Map<string, Queue>();

  static getQueue(queueName: string): Queue {
    let queue = QueueFactory.queues.get(queueName);
    if (!queue) {
      queue = new Queue(queueName, {
        connection: RedisClient.createQueueConnection(),
      });
      QueueFactory.queues.set(queueName, queue);
    }
    return queue;
  }

  static async closeAll(): Promise<void> {
    await Promise.all(Array.from(QueueFactory.queues.values()).map((q) => q.close()));
    QueueFactory.queues.clear();
  }
}
