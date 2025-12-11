import { type InsertProduct, type Product } from "@shared/schema";
import { randomUUID } from "crypto";

export interface ListProductsParams {
  limit?: number;
  offset?: number;
  categoryId?: string;
  isActive?: boolean;
}

export interface ProductsRepository {
  create(product: InsertProduct): Promise<Product>;
  getById(id: string): Promise<Product | undefined>;
  getBySlug(slug: string): Promise<Product | undefined>;
  list(params?: ListProductsParams): Promise<{ items: Product[]; total: number }>;
}

export class InMemoryProductsRepository implements ProductsRepository {
  private products: Map<string, Product> = new Map();

  async create(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const now = new Date();
    const created: any = {
      id,
      slug: product.slug,
      brand: product.brand,
      name: product.name,
      price: product.price,
      description: product.description ?? null,
      images: product.images ?? null,
      size: product.size ?? null,
      category_id: product.category_id ?? null,
      status: product.status ?? "active",
      created_at: now,
      updated_at: now,
    };
    this.products.set(id, created as Product);
    return created as Product;
  }

  async getById(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getBySlug(slug: string): Promise<Product | undefined> {
    for (const p of Array.from(this.products.values())) {
      if ((p as any).slug === slug) return p;
    }
    return undefined;
  }

  async list(params: ListProductsParams = {}): Promise<{ items: Product[]; total: number }> {
    const { limit = 20, offset = 0, categoryId, isActive = true } = params;
    let arr = Array.from(this.products.values());
    if (typeof isActive === "boolean") arr = arr.filter((p: any) => p.status === "active");
    if (categoryId) arr = arr.filter((p: any) => p.category_id === categoryId);
    const total = arr.length;
    const items = arr.slice(offset, offset + limit);
    return { items, total };
  }
}


