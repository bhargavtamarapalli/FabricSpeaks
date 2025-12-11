import type { Request, Response } from "express";
import { SupabaseUsersRepository } from "./db/repositories/supabase-users";
import { SupabaseAddressRepository } from "./db/repositories/supabase-addresses";
import { requireAuth } from "./middleware/auth";
import { db } from "./db/supabase";

const usersRepo = new SupabaseUsersRepository(db);
const addressesRepo = new SupabaseAddressRepository();

export const requireAuthMw = requireAuth;

export async function getMeHandler(req: Request, res: Response) {
  const profile = (req as any).user as any;
  if (!profile) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  // allow optional phone stored ad-hoc for MVP (not persisted)
  return res.status(200).json({ id: profile.id, username: profile.username, phone: (profile as any).phone || null });
}

export async function updateMeHandler(req: Request, res: Response) {
  const profile = (req as any).user as any;
  if (!profile) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  // MVP: only allow phone update stored in memory (not persisted)
  (profile as any).phone = req.body?.phone || (profile as any).phone || null;
  return res.status(200).json({ id: profile.id, username: profile.username, phone: (profile as any).phone || null });
}

export async function listAddressesHandler(req: Request, res: Response) {
  const profile = (req as any).user as any;
  const userId = profile?.user_id as string;
  if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  const list = await addressesRepo.listByUser(userId);
  return res.status(200).json(list);
}

export async function createAddressHandler(req: Request, res: Response) {
  const profile = (req as any).user as any;
  const userId = profile?.user_id as string;
  if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  try {
    const created = await addressesRepo.create({ ...req.body, user_id: userId });
    return res.status(201).json(created);
  } catch {
    return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Invalid address" });
  }
}

export async function updateAddressHandler(req: Request, res: Response) {
  const profile = (req as any).user as any;
  const userId = profile?.user_id as string;
  if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  const id = req.params.id;
  try {
    const updated = await addressesRepo.update(userId, id, req.body || {});
    return res.status(200).json(updated);
  } catch (e: any) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Address not found" });
  }
}

export async function deleteAddressHandler(req: Request, res: Response) {
  const profile = (req as any).user as any;
  const userId = profile?.user_id as string;
  if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  const id = req.params.id;
  try {
    await addressesRepo.delete(userId, id);
    return res.status(204).send();
  } catch (e: any) {
    return res.status(404).json({ code: "NOT_FOUND", message: "Address not found" });
  }
}


