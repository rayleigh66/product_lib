import { z } from "zod";

export const normalizeSku = (sku: string) => sku.replace(/\s+/g, "").toLowerCase();

export const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  fabric: z.string().min(1),
  lining: z.string().min(1),
  release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  stock: z.number().int().min(0).default(0),
  weight_kg: z.number(),
  waterproof: z.boolean().default(false),
  eco: z.boolean().default(false)
});
