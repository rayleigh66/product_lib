import { Role } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth([Role.ADMIN]);
  if (auth.error) return auth.error;

  const job = await prisma.importJob.findUnique({ where: { id: params.id } });
  if (!job) return apiError("NOT_FOUND", "导入任务不存在", "Import job not found", 404);
  if (!job.failureReportCsv) return apiError("NO_FAILURE_REPORT", "没有失败报告", "No failure report", 404);

  return new Response(job.failureReportCsv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=import-${job.id}-failures.csv` } });
}
