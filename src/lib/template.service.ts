import path from 'path';
import ejs from 'ejs';
import { env } from '@config/env';

export interface RenderEmailOptions {
  templateName: string;
  data: Record<string, unknown>;
  title: string;
  previewText: string;
}

/**
 * Renders an EJS template wrapped in the base layout.
 * Works seamlessly in development (src/views/emails) and production (dist/views/emails).
 */
export async function renderEmailTemplate(opts: RenderEmailOptions): Promise<string> {
  const viewsDir = path.resolve(__dirname, '../../views/emails');
  const templatePath = path.join(viewsDir, `${opts.templateName}.ejs`);
  const layoutPath = path.join(viewsDir, 'layout.ejs');

  const appName = env.APP_NAME;
  const year = new Date().getFullYear();

  const bodyHtml = await ejs.renderFile(templatePath, {
    ...opts.data,
    appName,
    year,
  });

  return ejs.renderFile(layoutPath, {
    title: opts.title,
    previewText: opts.previewText,
    appName,
    year,
    body: bodyHtml,
  });
}
