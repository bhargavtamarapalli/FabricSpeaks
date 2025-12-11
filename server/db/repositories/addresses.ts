import { randomUUID } from "crypto";

export type Address = {
  id: string;
  userId: string;
  label?: string;
  name?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  phone?: string;
};

export interface AddressesRepository {
  list(userId: string): Promise<Address[]>;
  create(userId: string, input: Omit<Address, "id" | "userId">): Promise<Address>;
  update(userId: string, id: string, input: Partial<Omit<Address, "id" | "userId">>): Promise<Address>;
  remove(userId: string, id: string): Promise<void>;
}

export class InMemoryAddressesRepository implements AddressesRepository {
  private addresses: Map<string, Address> = new Map();

  async list(userId: string): Promise<Address[]> {
    return Array.from(this.addresses.values()).filter(a => a.userId === userId);
  }

  async create(userId: string, input: Omit<Address, "id" | "userId">): Promise<Address> {
    if (!input.line1 || !input.city || !input.postalCode || !input.country) throw new Error("invalid");
    const addr: Address = { id: randomUUID(), userId, ...input };
    this.addresses.set(addr.id, addr);
    return addr;
  }

  async update(userId: string, id: string, input: Partial<Omit<Address, "id" | "userId">>): Promise<Address> {
    const existing = this.addresses.get(id);
    if (!existing || existing.userId !== userId) throw new Error("not-found");
    const updated = { ...existing, ...input } as Address;
    this.addresses.set(id, updated);
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = this.addresses.get(id);
    if (!existing || existing.userId !== userId) throw new Error("not-found");
    this.addresses.delete(id);
  }
}


