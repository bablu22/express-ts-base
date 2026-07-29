import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { env } from '@config/env';

export interface RenderEmailOptions {
  templateName: string;
  data: Record<string, unknown>;
  title: string;
  previewText: string;
}

function getViewsDir(): string {
  const relPath = path.resolve(__dirname, '../views/emails');
  if (fs.existsSync(relPath)) {
    return relPath;
  }
  const srcPath = path.resolve(process.cwd(), 'src/views/emails');
  if (fs.existsSync(srcPath)) {
    return srcPath;
  }
  const distPath = path.resolve(process.cwd(), 'dist/views/emails');
  if (fs.existsSync(distPath)) {
    return distPath;
  }
  return relPath;
}

/**
 * Renders an EJS email template wrapped in the base layout.
 * Pure classic server approach using EJS template engine.
 */
export async function renderEmailTemplate(opts: RenderEmailOptions): Promise<string> {
  const viewsDir = getViewsDir();
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
