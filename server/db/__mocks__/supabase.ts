import { vi } from 'vitest';

export const db = {
  query: {
    profiles: {
      findFirst: vi.fn(),
    },
    loginAttempts: {
      findMany: vi.fn().mockResolvedValue([]),
    }
  },
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn()
    }))
  })),
  delete: vi.fn(() => ({
    where: vi.fn()
  }))
};

export const supabase = {
  auth: {
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    },
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
  }
};

export const validateToken = vi.fn();
export const getUserRole = vi.fn();
export const isAdmin = vi.fn();
