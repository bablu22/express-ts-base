import mjml2html from 'mjml';
import { env } from '@config/env';

export interface BaseEmailOptions {
  title: string;
  previewText: string;
  content: string;
}

/**
 * Constructs an MJML email document and compiles it to responsive HTML.
 * Uses MJML semantic tags for bulletproof rendering across mobile & legacy desktop email clients.
 */
export function wrapEmailTemplate(opts: BaseEmailOptions): string {
  const appName = env.APP_NAME;
  const year = new Date().getFullYear();

  const mjmlTemplate = `<mjml>
  <mj-head>
    <mj-title>${opts.title}</mj-title>
    <mj-preview>${opts.previewText}</mj-preview>
    <mj-attributes>
      <mj-all font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" color="#374151" />
      <mj-text font-size="15px" line-height="1.6" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f6f9">
    <!-- Header -->
    <mj-section background-color="#4f46e5" padding="28px 40px" border-radius="8px 8px 0 0">
      <mj-column>
        <mj-text align="center" color="#ffffff" font-size="22px" font-weight="700" letter-spacing="-0.3px" padding="0">
          ${appName}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Body Container Slot -->
    <mj-section background-color="#ffffff" padding="40px" border-radius="0 0 8px 8px">
      <mj-column>
        ${opts.content}
      </mj-column>
    </mj-section>

    <!-- Footer -->
    <mj-section padding="24px 40px">
      <mj-column>
        <mj-text align="center" color="#9ca3af" font-size="13px" line-height="1.5" padding="0">
          &copy; ${year} ${appName}. All rights reserved.
        </mj-text>
        <mj-text align="center" color="#9ca3af" font-size="12px" padding="6px 0 0">
          This is an automated message — please do not reply.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

  const parseResult = mjml2html(mjmlTemplate, {
    validationLevel: 'soft',
  });

  const result = parseResult as unknown as {
    html: string;
    errors: Array<{ formattedMessage: string }>;
  };

  if (result.errors && result.errors.length > 0) {
    const errorMsgs = result.errors.map((e) => e.formattedMessage).join(', ');
    console.warn(`[MJML] Template compilation warnings/errors: ${errorMsgs}`);
  }

  return result.html;
}
