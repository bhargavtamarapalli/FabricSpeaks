import { type Cart, type CartItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface CartWithItems extends Cart {
  items: CartItem[];
  subtotal: number;
}

export interface CartsRepository {
  getOrCreate(userId: string): Promise<CartWithItems>;
  addItem(cartId: string, productId: string, unitPrice: number, quantity: number, size?: string): Promise<CartWithItems>;
  updateItemQuantity(cartItemId: string, quantity: number): Promise<CartWithItems>;
  removeItem(cartItemId: string): Promise<CartWithItems>;
  getByUser(userId: string): Promise<CartWithItems | undefined>;
}

export class InMemoryCartsRepository implements CartsRepository {
  private carts: Map<string, Cart> = new Map();
  private items: Map<string, CartItem> = new Map();
  private userToCartId: Map<string, string> = new Map();

  private compute(cartId: string): CartWithItems {
    const cart = this.carts.get(cartId)!;
    const items = Array.from(this.items.values()).filter(i => (i as any).cartId === cartId);
    const subtotal = items.reduce((sum, i: any) => sum + Number(i.unitPrice) * i.quantity, 0);
    return { ...(cart as any), items: items as any, subtotal } as CartWithItems;
  }

  async getOrCreate(userId: string): Promise<CartWithItems> {
    const existingId = this.userToCartId.get(userId);
    if (existingId && this.carts.has(existingId)) return this.compute(existingId);
    const id = randomUUID();
    const now = new Date();
    const cart: any = { id, userId, createdAt: now, updatedAt: now };
    this.carts.set(id, cart as Cart);
    this.userToCartId.set(userId, id);
    return this.compute(id);
  }

  async addItem(cartId: string, productId: string, unitPrice: number, quantity: number, size?: string): Promise<CartWithItems> {
    if (quantity <= 0) throw new Error("invalid-quantity");
    const id = randomUUID();
    const item: any = { id, cartId, productId, unitPrice, quantity, size: size ?? null };
    this.items.set(id, item as CartItem);
    return this.compute(cartId);
  }

  async updateItemQuantity(cartItemId: string, quantity: number): Promise<CartWithItems> {
    const item = this.items.get(cartItemId);
    if (!item) throw new Error("item-not-found");
    if (quantity <= 0) throw new Error("invalid-quantity");
    (item as any).quantity = quantity;
    this.items.set(cartItemId, item);
    return this.compute((item as any).cartId);
  }

  async removeItem(cartItemId: string): Promise<CartWithItems> {
    const item = this.items.get(cartItemId);
    if (!item) throw new Error("item-not-found");
    const cartId = (item as any).cartId as string;
    this.items.delete(cartItemId);
    return this.compute(cartId);
  }

  async getByUser(userId: string): Promise<CartWithItems | undefined> {
    const id = this.userToCartId.get(userId);
    if (!id) return undefined;
    if (!this.carts.has(id)) return undefined;
    return this.compute(id);
  }
}


