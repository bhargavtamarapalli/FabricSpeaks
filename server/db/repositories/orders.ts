import { randomUUID } from "crypto";

export type OrderItem = { id: string; orderId: string; productId: string; unitPrice: number; quantity: number; size?: string | null };
export type Order = { id: string; userId: string; totalAmount: number; status: string; placedAt: Date };

export interface OrdersRepository {
  createFromCart(userId: string, items: Array<{ productId: string; unitPrice: number; quantity: number; size?: string | null }>): Promise<{ order: Order; items: OrderItem[] }>;
  listByUser(userId: string): Promise<Order[]>;
  getById(userId: string, id: string): Promise<{ order: Order; items: OrderItem[] } | undefined>;
}

export class InMemoryOrdersRepository implements OrdersRepository {
  private orders: Map<string, Order> = new Map();
  private items: Map<string, OrderItem> = new Map();

  async createFromCart(userId: string, items: Array<{ productId: string; unitPrice: number; quantity: number; size?: string | null }>): Promise<{ order: Order; items: OrderItem[] }> {
    const id = randomUUID();
    const totalAmount = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const order: Order = { id, userId, totalAmount, status: "processing", placedAt: new Date() };
    this.orders.set(id, order);
    const created: OrderItem[] = items.map(i => {
      const iid = randomUUID();
      const oi: OrderItem = { id: iid, orderId: id, productId: i.productId, unitPrice: i.unitPrice, quantity: i.quantity, size: i.size ?? null };
      this.items.set(iid, oi);
      return oi;
    });
    return { order, items: created };
  }

  async listByUser(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.userId === userId);
  }

  async getById(userId: string, id: string): Promise<{ order: Order; items: OrderItem[] } | undefined> {
    const order = this.orders.get(id);
    if (!order || order.userId !== userId) return undefined;
    const items = Array.from(this.items.values()).filter(i => i.orderId === id);
    return { order, items };
  }
}


