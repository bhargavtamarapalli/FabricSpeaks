import { Request, Response } from "express";
import { db } from "./db/supabase";
import { suppliers } from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export async function listSuppliersHandler(req: Request, res: Response) {
  try {
    const allSuppliers = await db
      .select()
      .from(suppliers)
      .orderBy(desc(suppliers.created_at));
    
    return res.json(allSuppliers);
  } catch (error) {
    console.error("Error listing suppliers:", error);
    return res.status(500).json({ error: "Failed to list suppliers" });
  }
}

export async function createSupplierHandler(req: Request, res: Response) {
  try {
    const data = req.body;
    
    const [supplier] = await db
      .insert(suppliers)
      .values(data)
      .returning();
      
    return res.status(201).json(supplier);
  } catch (error) {
    console.error("Error creating supplier:", error);
    return res.status(500).json({ error: "Failed to create supplier" });
  }
}
