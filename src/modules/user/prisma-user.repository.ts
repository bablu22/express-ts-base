import type { PrismaClient } from '@prisma/client';
import type {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserRecord,
} from './user.repository.interface';

/**
 * Concrete implementation of IUserRepository using Prisma ORM.
 * Encapsulates all persistence operations for the User entity.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: CreateUserData): Promise<UserRecord> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        isVerified: data.isVerified ?? false,
      },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
