import { eq } from "drizzle-orm";
import { profiles, type InsertProfile, type Profile } from "../../../shared/schema";

export interface UsersRepository {
  getById(id: string): Promise<Profile | undefined>;
  getByUsername(username: string): Promise<Profile | undefined>;
  create(profile: Omit<InsertProfile, "created_at" | "updated_at">): Promise<Profile>;
  updateProfile(id: string, data: Partial<Omit<InsertProfile, "id" | "created_at" | "updated_at">>): Promise<Profile>;
  getRole(id: string): Promise<string>;
}

export class SupabaseUsersRepository implements UsersRepository {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async getById(id: string): Promise<Profile | undefined> {
    try {
      const result = await this.db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
      return result[0];
    } catch (err) {
      throw new Error('Failed to fetch user by id');
    }
  }

  async getByUsername(username: string): Promise<Profile | undefined> {
    try {
      const result = await this.db.select().from(profiles).where(eq(profiles.username, username)).limit(1);
      return result[0];
    } catch (err) {
      console.error('Failed to fetch user by username:', err);
      throw new Error('Failed to fetch user by username');
    }
  }

  async create(profile: Omit<InsertProfile, "created_at" | "updated_at">): Promise<Profile> {
    // Basic validation
    if (!profile.username || typeof profile.username !== 'string' || profile.username.length < 3) {
      throw new Error('Invalid username');
    }
    try {
      const result = await this.db.insert(profiles).values(profile).returning();
      return result[0];
    } catch (err) {
      throw new Error('Failed to create user profile');
    }
  }

  async updateProfile(id: string, data: Partial<Omit<InsertProfile, "id" | "created_at" | "updated_at">>): Promise<Profile> {
    // Only allow certain fields to be updated
    const allowed: Partial<InsertProfile> = {};
    if (data.username && typeof data.username === 'string' && data.username.length >= 3) allowed.username = data.username;
    if (data.role) allowed.role = data.role;
    // Add more allowed fields as needed
    const result = await this.db.update(profiles)
      .set({ ...allowed, updated_at: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    if (!result[0]) throw new Error("Profile not found");
    return result[0];
  }

  async getRole(id: string): Promise<string> {
    try {
      const profile = await this.getById(id);
      return profile?.role || 'user';
    } catch (err) {
      return 'user';
    }
  }
}
