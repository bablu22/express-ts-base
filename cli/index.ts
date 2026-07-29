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

  const rawName = project.projectName;
  const cleanName =
    rawName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/^_+|_+$/g, '') || 'app';

  // 1. Update generated package.json
  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const rawContent = fs.readFileSync(pkgPath, 'utf-8');
    const pkgContent = JSON.parse(rawContent) as Record<string, unknown>;
    pkgContent['name'] = rawName;
    pkgContent['description'] =
      `Backend API server for ${rawName}, scaffolded with create-express-ts-base.`;

    if (project.packageManager !== 'pnpm') {
      delete pkgContent['packageManager'];
      delete pkgContent['pnpm'];
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkgContent, null, 2));
  }

  // 2. Customize .env.example with user's project & database names
  const envExamplePath = path.join(targetDir, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    let envContent = fs.readFileSync(envExamplePath, 'utf-8');
    envContent = envContent
      .replace(/APP_NAME=.*/g, `APP_NAME=${rawName}`)
      .replace(/POSTGRES_USER=.*/g, `POSTGRES_USER=${cleanName}`)
      .replace(/POSTGRES_DB=.*/g, `POSTGRES_DB=${cleanName}_db`)
      .replace(/SMTP_FROM=.*/g, `SMTP_FROM="${rawName} <noreply@${rawName}.com>"`);
    fs.writeFileSync(envExamplePath, envContent, 'utf-8');
  }

  // 3. Create .env from customized .env.example
  const envPath = path.join(targetDir, '.env');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
  }

  // 4. Customize docker-compose.yml containers, networks, and volume names
  const dockerComposePath = path.join(targetDir, 'docker-compose.yml');
  if (fs.existsSync(dockerComposePath)) {
    let dockerContent = fs.readFileSync(dockerComposePath, 'utf-8');
    dockerContent = dockerContent
      .replace(/container_name: app_postgres/g, `container_name: ${cleanName}_postgres`)
      .replace(/container_name: app_redis/g, `container_name: ${cleanName}_redis`)
      .replace(
        /POSTGRES_USER:\s*\${POSTGRES_USER:-myapp}/g,
        `POSTGRES_USER: \${POSTGRES_USER:-${cleanName}}`,
      )
      .replace(
        /POSTGRES_DB:\s*\${POSTGRES_DB:-myapp_db}/g,
        `POSTGRES_DB: \${POSTGRES_DB:-${cleanName}_db}`,
      )
      .replace(
        /pg_isready -U \${POSTGRES_USER:-myapp} -d \${POSTGRES_DB:-myapp_db}/g,
        `pg_isready -U \${POSTGRES_USER:-${cleanName}} -d \${POSTGRES_DB:-${cleanName}_db}`,
      )
      .replace(/postgres_data/g, `${cleanName}_postgres_data`)
      .replace(/redis_data/g, `${cleanName}_redis_data`)
      .replace(/app_network/g, `${cleanName}_network`);
    fs.writeFileSync(dockerComposePath, dockerContent, 'utf-8');
  }

  // 5. Customize project README.md header
  const readmePath = path.join(targetDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    let readmeContent = fs.readFileSync(readmePath, 'utf-8');
    readmeContent = readmeContent.replace(
      /# create-express-ts-base 🚀/g,
      `# ${rawName} 🚀`,
    );
    fs.writeFileSync(readmePath, readmeContent, 'utf-8');
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
