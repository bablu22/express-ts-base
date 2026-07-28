import { env } from '@config/env';
import { wrapEmailTemplate } from './email.shell';

export interface WelcomeEmailOptions {
  name: string;
}

/**
 * Builds the welcome HTML email sent after a user successfully verifies their email.
 */
export function buildWelcomeTemplate(opts: WelcomeEmailOptions): string {
  const appName = env.APP_NAME;

  const content = `
    <mj-text font-size="20px" font-weight="700" color="#111827" padding="0 0 4px">
      Welcome aboard, ${opts.name}!
    </mj-text>
    <mj-text font-size="14px" color="#6b7280" padding="0 0 28px">
      Your account is now active
    </mj-text>

    <mj-text padding="0 0 24px">
      Your email has been verified and your <strong>${appName}</strong> account is fully active.
    </mj-text>

    <mj-text padding="0">
      If you have any questions, our support team is always happy to help.
    </mj-text>
  `;

  return wrapEmailTemplate({
    title: `Welcome to ${appName}`,
    previewText: `Your ${appName} account is now verified and ready to use.`,
    content,
  });
}
