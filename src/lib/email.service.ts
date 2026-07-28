import nodemailer from 'nodemailer';
import { env } from '@config/env';
import { logger } from '@lib/logger';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  static getTransporter(): nodemailer.Transporter {
    if (!EmailService.transporter) {
      EmailService.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
      });
    }
    if (!EmailService.transporter) {
      throw new Error('Transporter initialization failed');
    }
    return EmailService.transporter;
  }

  /**
   * Send a transactional email.
   *
   * @param to      Recipient address
   * @param subject Email subject
   * @param html    HTML body
   * @param text    Plain-text fallback body
   */
  static async send(opts: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const transporter = EmailService.getTransporter();

    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });
      logger.info({ to: opts.to, messageId: info.messageId }, 'Email sent');
    } catch (err) {
      logger.error({ to: opts.to, err }, 'Failed to send email');
      throw err;
    }
  }
}
