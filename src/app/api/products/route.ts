import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { normalizeSku, productSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const params = req.nextUrl.searchParams;
  const search = params.get("search")?.trim() ?? "";
  const waterproof = params.get("waterproof");
  const eco = params.get("eco");
  const stockState = params.get("stockState");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const page = Number(params.get("page") || 1);
  const pageSize = Number(params.get("pageSize") || 10);

  const where: any = {};
  if (search) {
    where.OR = ["sku", "color", "fabric", "lining"].map((f) => ({ [f]: { contains: search, mode: "insensitive" } }));
  }
  if (waterproof !== null) where.waterproof = waterproof === "true";
  if (eco !== null) where.eco = eco === "true";
  if (stockState === "in") where.stock = { gt: 0 };
  if (stockState === "out") where.stock = { lte: 0 };
  if (startDate || endDate) {
    where.releaseDate = {};
    if (startDate) where.releaseDate.gte = new Date(startDate);
    if (endDate) where.releaseDate.lte = new Date(endDate);
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" } }),
    prisma.product.count({ where })
  ]);

  return apiOk({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth([Role.EDITOR, Role.ADMIN]);
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", "参数校验失败", "Validation failed", 400, parsed.error.flatten());
  }
  const data = parsed.data;
  const skuNormalized = normalizeSku(data.sku);

  const exists = await prisma.product.findUnique({ where: { skuNormalized } });
  if (exists) return apiError("SKU_EXISTS", "SKU 已存在", "SKU already exists", 409);

  const created = await prisma.product.create({
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

  return apiOk(created, 201);
}
