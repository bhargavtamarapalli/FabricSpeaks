import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { db } from "../db/supabase";
import { eq } from "drizzle-orm";
import { profiles } from "../../shared/schema";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log('[MIDDLEWARE] requireAuth called for:', req.method, req.path);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[MIDDLEWARE] No auth header or invalid format');
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  console.log('[MIDDLEWARE] Token extracted, length:', token.length);

  try {
    console.log('[MIDDLEWARE] Calling supabase.auth.getUser()...');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('[MIDDLEWARE] getUser failed:', error?.message || 'No user');
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }
    
    console.log('[MIDDLEWARE] User from Supabase:', user.id, user.email);

    // Get profile data
    console.log('[MIDDLEWARE] Querying database for profile...');
    const profile = await db.select().from(profiles).where(eq(profiles.user_id, user.id)).limit(1);
    
    if (profile.length === 0) {
      console.log('[MIDDLEWARE] Profile not found in database for user:', user.id);
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    console.log(`[MIDDLEWARE] Auth successful at ${new Date().toISOString()}`);
    console.log(`[MIDDLEWARE] User: ${profile[0].username} (${profile[0].role})`);
    (req as any).user = profile[0];
    (req as any).supabaseUser = user;
    next();
  } catch (error) {
    console.error("[MIDDLEWARE] Auth middleware error:", error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next();
    }
    
    const profile = await db.select().from(profiles).where(eq(profiles.user_id, user.id)).limit(1);
    
    if (profile.length > 0) {
      console.log(`[MIDDLEWARE:Optional] Resolved User: ${profile[0].username}`);
      (req as any).user = profile[0];
      (req as any).supabaseUser = user;
    } else {
      console.log('[MIDDLEWARE:Optional] Token valid but no profile found');
    }
    next();
  } catch (error) {
    console.error("[MIDDLEWARE] Optional auth error:", error);
    next();
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[ADMIN_AUTH] No auth header or invalid format');
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log('[ADMIN_AUTH] Supabase auth failed:', error?.message);
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    // Get profile data
    const profile = await db.select().from(profiles).where(eq(profiles.user_id, user.id)).limit(1);
    
    if (profile.length === 0) {
      console.log('[ADMIN_AUTH] No profile found for user:', user.id);
      return res.status(403).json({ code: "FORBIDDEN", message: "Admin access required" });
    }

    console.log('[ADMIN_AUTH] User role:', profile[0].role, 'User ID:', user.id);

    if (profile[0].role !== 'admin') {
      console.log('[ADMIN_AUTH] Access denied. Role is:', profile[0].role);
      return res.status(403).json({ code: "FORBIDDEN", message: "Admin access required" });
    }

    (req as any).user = profile[0];
    (req as any).supabaseUser = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
  }
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    // Get profile data
    const profile = await db.select().from(profiles).where(eq(profiles.user_id, user.id)).limit(1);
    if (profile.length === 0 || profile[0].role !== 'user') {
      return res.status(403).json({ code: "FORBIDDEN", message: "User access required" });
    }

    (req as any).user = profile[0];
    (req as any).supabaseUser = user;
    next();
  } catch (error) {
    console.error("User middleware error:", error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
  }
}
