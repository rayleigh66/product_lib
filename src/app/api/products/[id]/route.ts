import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { normalizeSku, productSchema } from "@/lib/validation";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const item = await prisma.product.findUnique({ where: { id: params.id } });
  if (!item) return apiError("NOT_FOUND", "产品不存在", "Product not found", 404);
  return apiOk(item);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth([Role.EDITOR, Role.ADMIN]);
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return apiError("INVALID_INPUT", "参数校验失败", "Validation failed", 400, parsed.error.flatten());
  const data = parsed.data;
  const skuNormalized = normalizeSku(data.sku);

  const exists = await prisma.product.findFirst({ where: { skuNormalized, id: { not: params.id } } });
  if (exists) return apiError("SKU_EXISTS", "SKU 已存在", "SKU already exists", 409);

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: {
      sku: data.sku,
      skuNormalized,
      name: data.name,
      color: data.color,
      fabric: data.fabric,
      lining: data.lining,
      releaseDate: data.release_date ? new Date(data.release_date) : null,
      stock: data.stock,
      weightKg: data.weight_kg,
      waterproof: data.waterproof,
      eco: data.eco
    }
  });

  return apiOk(updated);
}
