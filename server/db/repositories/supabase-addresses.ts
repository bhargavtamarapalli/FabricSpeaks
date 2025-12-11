import { db } from "../supabase";
import { addresses, insertAddressSchema } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";
import type { InsertAddress, Address } from "../../../shared/schema";

export class SupabaseAddressRepository {
  async create(addressData: InsertAddress): Promise<Address> {
    const [address] = await db
      .insert(addresses)
      .values(addressData)
      .returning();
    return address;
  }

  async getById(userId: string, addressId: string): Promise<Address | null> {
    const [address] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.user_id, userId), eq(addresses.id, addressId)));
    return address || null;
  }

  async listByUser(userId: string, type?: "billing" | "shipping"): Promise<Address[]> {
    const query = db.select().from(addresses).where(eq(addresses.user_id, userId));
    if (type) {
      query.where(eq(addresses.type, type));
    }
    return await query;
  }

  async update(userId: string, addressId: string, updates: Partial<InsertAddress>): Promise<Address | null> {
    const [address] = await db
      .update(addresses)
      .set({ ...updates, updated_at: new Date() })
      .where(and(eq(addresses.user_id, userId), eq(addresses.id, addressId)))
      .returning();
    return address || null;
  }

  async delete(userId: string, addressId: string): Promise<boolean> {
    const result = await db
      .delete(addresses)
      .where(and(eq(addresses.user_id, userId), eq(addresses.id, addressId)));
    return result.rowCount > 0;
  }

  async setDefault(userId: string, addressId: string): Promise<boolean> {
    // First, unset all default flags for this user
    await db
      .update(addresses)
      .set({ is_default: false })
      .where(eq(addresses.user_id, userId));

    // Then set the specified address as default
    const result = await db
      .update(addresses)
      .set({ is_default: true, updated_at: new Date() })
      .where(and(eq(addresses.user_id, userId), eq(addresses.id, addressId)))
      .returning();

    return result.length > 0;
  }

  async getDefault(userId: string, type?: "billing" | "shipping"): Promise<Address | null> {
    const query = db
      .select()
      .from(addresses)
      .where(and(eq(addresses.user_id, userId), eq(addresses.is_default, true)));

    if (type) {
      query.where(eq(addresses.type, type));
    }

    const [address] = await query.limit(1);
    return address || null;
  }
}
