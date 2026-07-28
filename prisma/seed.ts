import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function main(): void {
  // TODO: add your seed data here
  // Example:
  // await prisma.user.upsert({
  //   where: { email: 'admin@example.com' },
  //   update: {},
  //   create: {
  //     email: 'admin@example.com',
  //     name: 'Admin',
  //   },
  // });
  console.warn('Seed function is a no-op. Add your seed data in prisma/seed.ts.');
}

main();

void prisma.$disconnect();
