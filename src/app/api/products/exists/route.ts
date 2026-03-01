import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { normalizeSku } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth([Role.EDITOR, Role.ADMIN]);
  if (auth.error) return auth.error;

  const sku = req.nextUrl.searchParams.get("sku") || "";
  if (!sku.trim()) return apiError("INVALID_INPUT", "sku 必填", "sku is required", 400);
  const excludeId = req.nextUrl.searchParams.get("excludeId");
  const existing = await prisma.product.findFirst({ where: { skuNormalized: normalizeSku(sku), ...(excludeId ? { id: { not: excludeId } } : {}) } });
  return apiOk({ exists: !!existing });
}
