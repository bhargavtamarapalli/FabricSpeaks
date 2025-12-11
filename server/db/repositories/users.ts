import { type InsertUser, type User } from "@shared/schema";

export interface UsersRepository {
  getById(id: string): Promise<User | undefined>;
  getByUsername(username: string): Promise<User | undefined>;
  create(user: InsertUser): Promise<User>;
}

// Deprecated: Legacy in-memory implementation
// Use SupabaseUsersRepository instead
export class InMemoryUsersRepository implements UsersRepository {
  async getById(id: string): Promise<User | undefined> {
    throw new Error('InMemoryUsersRepository is deprecated. Use SupabaseUsersRepository instead.');
  }
  async getByUsername(username: string): Promise<User | undefined> {
    throw new Error('InMemoryUsersRepository is deprecated. Use SupabaseUsersRepository instead.');
  }
  async create(user: InsertUser): Promise<User> {
    throw new Error('InMemoryUsersRepository is deprecated. Use SupabaseUsersRepository instead.');
  }
}


