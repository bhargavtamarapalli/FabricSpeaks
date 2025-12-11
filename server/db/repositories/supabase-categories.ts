import { db } from "../supabase";
import { categories, type Category, type InsertCategory, insertCategorySchema } from "../../../shared/schema";
import { z } from "zod";

export interface CategoriesRepository {
  list(): Promise<Category[]>;
  create(input: Partial<InsertCategory>): Promise<Category>;
}

export class SupabaseCategoriesRepository implements CategoriesRepository {
  async list(): Promise<Category[]> {
    try {
      return await db.select().from(categories).orderBy(categories.display_order);
    } catch (err: any) {
      throw new Error('Failed to list categories: ' + (err?.message || err));
    }
  }

  async create(input: Partial<any>): Promise<Category> {
    // Input validation and whitelisting
    const safeInput = {
      name: input.name,
      slug: input.slug,
      description: input.description,
      parent_id: input.parent_id,
      display_order: input.display_order
    };
    const payload = insertCategorySchema.parse(safeInput);
    try {
      const [created] = await db.insert(categories).values(payload).returning();
      if (!created) throw new Error('Category creation failed');
      return created;
    } catch (err: any) {
      throw new Error('Failed to create category: ' + (err?.message || err));
    }
  }
}
