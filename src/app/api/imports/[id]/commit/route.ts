import { Role } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/errors";
import { parseCsv, validateRows } from "@/lib/imports";
import { prisma } from "@/lib/prisma";
import { normalizeSku } from "@/lib/validation";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth([Role.ADMIN]);
  if (auth.error) return auth.error;

  const job = await prisma.importJob.findUnique({ where: { id: params.id } });
  if (!job) return apiError("NOT_FOUND", "导入任务不存在", "Import job not found", 404);
  if (job.status !== "VALIDATED") return apiError("INVALID_STATE", "必须先校验通过", "Validate first", 400);

  const rows = parseCsv(job.rawCsv);
  const { cleaned, errors } = validateRows(rows);
  if (errors.length) return apiError("VALIDATION_FAILED", "校验失败，不可提交", "Validation failed", 400, errors);

  await prisma.$transaction(cleaned.map((r) => prisma.product.create({
    data: {
      sku: r.sku,
      skuNormalized: normalizeSku(r.sku),
      name: r.name,
      color: r.color,
      fabric: r.fabric,
      lining: r.lining,
      releaseDate: r.release_date ? new Date(r.release_date) : null,
      stock: r.stock,
      weightKg: r.weight_kg,
      waterproof: r.waterproof,
      eco: r.eco
    }
  })));

  await prisma.importJob.update({ where: { id: job.id }, data: { status: "COMMITTED" } });
  return apiOk({ success: true });
}
