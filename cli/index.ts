#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  p.intro(chalk.bgMagenta.white.bold(' Create Express TS Base '));

  const project = await p.group(
    {
      projectName: () =>
        p.text({
          message: 'What is your project name?',
          placeholder: 'express-ts-base-app',
          defaultValue: 'express-ts-base-app',
          validate(val?: string) {
            const value = val ?? '';
            if (value.length === 0) {
              return 'Project name is required';
            }
            if (!/^[a-z0-9-_]+$/i.test(value)) {
              return 'Project name can only contain letters, numbers, hyphens and underscores';
            }
            return undefined;
          },
        }),
      packageManager: () =>
        p.select({
          message: 'Select package manager:',
          options: [
            { value: 'pnpm', label: 'pnpm', hint: 'recommended' },
            { value: 'npm', label: 'npm' },
            { value: 'yarn', label: 'yarn' },
          ],
          initialValue: 'pnpm',
        }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    },
  );

  const targetDir = path.resolve(process.cwd(), project.projectName);
  const templateDir = path.resolve(__dirname, '../template');

  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      const overwrite = await p.confirm({
        message: `Target directory "${project.projectName}" is not empty. Overwrite?`,
        initialValue: false,
      });

      if (p.isCancel(overwrite) || !overwrite) {
        p.cancel('Operation cancelled.');
        process.exit(0);
      }
    }
  }

  const s = p.spinner();
  s.start(`Scaffolding project into ${chalk.cyan(project.projectName)}...`);

  fs.mkdirSync(targetDir, { recursive: true });

  if (fs.existsSync(templateDir)) {
    fs.cpSync(templateDir, targetDir, { recursive: true });
  }

  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const rawContent = fs.readFileSync(pkgPath, 'utf-8');
    const pkgContent = JSON.parse(rawContent) as Record<string, unknown>;
    pkgContent['name'] = project.projectName;

    if (project.packageManager !== 'pnpm') {
      delete pkgContent['packageManager'];
      delete pkgContent['pnpm'];
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkgContent, null, 2));
  }

  s.stop(`Project scaffolded successfully in ${chalk.cyan(project.projectName)}!`);

  const pm = project.packageManager;
  const runCmd = pm === 'npm' ? 'npm run' : pm;

  p.note(
    `cd ${project.projectName}
${pm} install
cp .env.example .env
${runCmd} docker:up
${runCmd} prisma:migrate
${runCmd} dev`,
    'Next steps:',
  );

  const openInVSCode = await p.confirm({
    message: 'Do you want to open the project in VS Code?',
    initialValue: true,
  });

  if (p.isCancel(openInVSCode)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  if (openInVSCode) {
    const { exec } = await import('child_process');
    exec(`code ${targetDir}`, (error) => {
      if (error) {
        console.error(`Error opening VS Code: ${error.message}`);
      }
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
