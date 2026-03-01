import { Role } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/errors";
import { validateRows, parseCsv, toFailureCsv } from "@/lib/imports";
import { prisma } from "@/lib/prisma";
import { normalizeSku } from "@/lib/validation";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth([Role.ADMIN]);
  if (auth.error) return auth.error;

  const job = await prisma.importJob.findUnique({ where: { id: params.id } });
  if (!job) return apiError("NOT_FOUND", "导入任务不存在", "Import job not found", 404);

  const rows = parseCsv(job.rawCsv);
  const { cleaned, errors } = validateRows(rows);
  const normalized = cleaned.map((x) => normalizeSku(x.sku));
  const existing = await prisma.product.findMany({ where: { skuNormalized: { in: normalized } }, select: { skuNormalized: true } });
  for (const e of existing) errors.push(`sku already exists: ${e.skuNormalized}`);

  const updated = await prisma.importJob.update({
    where: { id: job.id },
    data: {
      totalRows: rows.length,
      validRows: errors.length ? 0 : rows.length,
      invalidRows: errors.length,
      status: errors.length ? "FAILED" : "VALIDATED",
      failureReportCsv: errors.length ? toFailureCsv(errors) : null
    }
  });

  return apiOk({ id: updated.id, status: updated.status, totalRows: updated.totalRows, validRows: updated.validRows, invalidRows: updated.invalidRows, errors });
}
