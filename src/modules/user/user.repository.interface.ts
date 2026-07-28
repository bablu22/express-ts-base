export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  isVerified?: boolean;
}

export interface UpdateUserData {
  name?: string;
  password?: string;
  isVerified?: boolean;
}

/**
 * Domain repository contract defining structural operations for the User aggregate root.
 * Decouples domain logic from database engines/ORMs.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(data: CreateUserData): Promise<UserRecord>;
  update(id: string, data: UpdateUserData): Promise<UserRecord>;
}
