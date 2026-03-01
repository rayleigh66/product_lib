import { Role } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { apiOk } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAuth([Role.ADMIN]);
  if (auth.error) return auth.error;

  const jobs = await prisma.importJob.findMany({
    include: { uploadedBy: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });
  return apiOk(jobs);
}
