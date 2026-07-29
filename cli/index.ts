#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import * as p from '@clack/prompts';
import chalk from 'chalk';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    let destName = entry.name;
    if (destName === '_gitignore') {
      destName = '.gitignore';
    }
    const destPath = path.join(dest, destName);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main(): Promise<void> {
  process.stdout.write('\n');
  p.intro(chalk.bgCyan.black.bold(' 🚀 create-express-ts-base '));

  const project = await p.group(
    {
      projectName: () =>
        p.text({
          message: 'What is your project name?',
          placeholder: 'my-express-app',
          defaultValue: 'my-express-app',
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
      initGit: () =>
        p.confirm({
          message: 'Initialize a new Git repository?',
          initialValue: true,
        }),
      installDeps: () =>
        p.confirm({
          message: 'Install dependencies automatically?',
          initialValue: false,
        }),
      openVSCode: () =>
        p.confirm({
          message: 'Open project in VS Code?',
          initialValue: false,
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
        message: `Target directory "${chalk.cyan(project.projectName)}" is not empty. Overwrite existing files?`,
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

  copyDirRecursive(templateDir, targetDir);

  // Update generated package.json
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

  // Create .env from .env.example
  const envExamplePath = path.join(targetDir, '.env.example');
  const envPath = path.join(targetDir, '.env');
  if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
    fs.copyFileSync(envExamplePath, envPath);
  }

  s.stop(`Project scaffolded successfully in ${chalk.cyan(project.projectName)}!`);

  // Initialize Git if requested
  if (project.initGit) {
    const gitSpinner = p.spinner();
    gitSpinner.start('Initializing Git repository...');
    try {
      await execAsync('git init', { cwd: targetDir });
      gitSpinner.stop('Git repository initialized.');
    } catch {
      gitSpinner.stop('Failed to initialize Git repository.');
    }
  }

  // Install dependencies if requested
  if (project.installDeps) {
    const installSpinner = p.spinner();
    installSpinner.start(
      `Installing dependencies using ${chalk.cyan(project.packageManager)}...`,
    );
    try {
      await execAsync(`${project.packageManager} install`, { cwd: targetDir });
      installSpinner.stop('Dependencies installed successfully.');
    } catch (err: unknown) {
      installSpinner.stop(`Failed to install dependencies: ${(err as Error).message}`);
    }
  }

  const pm = project.packageManager;
  const runCmd = pm === 'npm' ? 'npm run' : pm;

  const nextSteps = [
    `cd ${project.projectName}`,
    project.installDeps ? null : `${pm} install`,
    `${runCmd} docker:up`,
    `${runCmd} prisma:migrate`,
    `${runCmd} dev`,
  ]
    .filter(Boolean)
    .join('\n');

  p.note(nextSteps, 'Next steps to start developing:');

  p.outro(chalk.green.bold('✨ All done! Happy coding!'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
