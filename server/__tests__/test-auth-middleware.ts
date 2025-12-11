/**
 * Test-safe auth middleware that uses test data instead of calling Supabase
 */
import type { Request, Response, NextFunction } from "express";

export async function requireAuthTest(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  // Mock: extract user ID and role from token (format: "ROLE-token-USER_ID")
  // Examples: "admin-token-admin-user-123" or "user-token-user-user-456"
  const match = token.match(/^(admin|user)-token-(.+)$/);
  if (!match) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const role = match[1]; // 'admin' or 'user'
  const userId = match[2]; // full user ID (e.g., "admin-user-123")

  // Mock user profile
  (req as any).user = {
    user_id: userId,
    username: `${role}_test`,
    role: role === 'admin' ? 'admin' : 'user'
  };

  next();
}

export async function requireAdminTest(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  // Mock: extract user ID and role from token
  const match = token.match(/^(admin|user)-token-(.+)$/);
  if (!match) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const role = match[1];
  const userId = match[2];

  if (role !== 'admin') {
    return res.status(403).json({ code: "FORBIDDEN", message: "Admin access required" });
  }

  // Mock admin profile
  (req as any).user = {
    user_id: userId,
    username: 'admin_test',
    role: 'admin'
  };

  next();
}

export async function requireUserTest(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  // Mock: extract user ID from token
  const match = token.match(/^(admin|user)-token-(.+)$/);
  if (!match) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const role = match[1];
  const userId = match[2];

  // Mock user profile
  (req as any).user = {
    user_id: userId,
    username: `${role}_test`,
    role: role === 'admin' ? 'admin' : 'user'
  };

  next();
}
