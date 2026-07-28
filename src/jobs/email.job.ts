import type { Job } from 'bullmq';
import { EmailService } from '@lib/email.service';
import { renderEmailTemplate } from '@lib/template.service';
import { logger } from '@lib/logger';
import { BaseJob } from './base.job';

export interface EmailJobPayload {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, unknown>;
  title: string;
  previewText: string;
}

/**
 * EmailJob — processes outbound transactional emails via BullMQ with EJS templates.
 */
export class EmailJob extends BaseJob<EmailJobPayload> {
  readonly name = 'send-email';
  readonly queueName = 'email-queue';

  async handle(job: Job<EmailJobPayload>): Promise<void> {
    const { to, subject, templateName, templateData, title, previewText } = job.data;
    logger.info(
      { to, subject, templateName, jobId: job.id },
      'EmailJob: rendering & sending email',
    );

    const html = await renderEmailTemplate({
      templateName,
      data: templateData,
      title,
      previewText,
    });

    await EmailService.send({
      to,
      subject,
      html,
    });

    logger.info({ to, jobId: job.id }, 'EmailJob: sent successfully');
  }
}

export const emailJob = new EmailJob();
