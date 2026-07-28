import { wrapEmailTemplate } from './email.shell';

export interface VerifyEmailOptions {
  name: string;
  verificationUrl: string;
  expiresInHours?: number;
}

/**
 * Builds the verification email HTML using MJML components.
 */
export function buildVerifyEmailTemplate(opts: VerifyEmailOptions): string {
  const expiresInHours = opts.expiresInHours ?? 24;

  const content = `
    <mj-text font-size="20px" font-weight="700" color="#111827" padding="0 0 4px">
      Verify your email address
    </mj-text>
    <mj-text font-size="14px" color="#6b7280" padding="0 0 28px">
      One quick step to activate your account
    </mj-text>

    <mj-text padding="0 0 8px">
      Hi <strong>${opts.name}</strong>,
    </mj-text>
    <mj-text padding="0 0 28px">
      Thank you for registering. Click the button below to verify your email address and activate your account.
    </mj-text>

    <!-- Semantic MJML Button -->
    <mj-button background-color="#4f46e5" color="#ffffff" font-size="15px" font-weight="600" border-radius="6px" href="${opts.verificationUrl}" padding="0 0 32px" inner-padding="14px 36px">
      Verify Email Address
    </mj-button>

    <!-- Fallback link -->
    <mj-text font-size="13px" color="#6b7280" padding="0 0 8px">
      If the button does not work, copy and paste this link into your browser:
    </mj-text>
    <mj-text font-size="13px" padding="0 0 28px">
      <a href="${opts.verificationUrl}" style="color: #4f46e5; text-decoration: underline;">${opts.verificationUrl}</a>
    </mj-text>

    <mj-divider border-color="#e5e7eb" border-width="1px" padding="0 0 20px" />

    <mj-text font-size="13px" color="#9ca3af" padding="0">
      This link expires in <strong>${expiresInHours} hours</strong>. If you did not create an account, you can safely ignore this email.
    </mj-text>
  `;

  return wrapEmailTemplate({
    title: 'Verify your email address',
    previewText: 'Please verify your email address to activate your account.',
    content,
  });
}
