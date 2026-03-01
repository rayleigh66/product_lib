import { Role } from "@prisma/client";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (auth.error) return auth.error;
  const body = await req.json();
  if (!body.fileName || !body.rawCsv) return apiError("INVALID_INPUT", "缺少文件内容", "Missing file content", 400);
  const job = await prisma.importJob.create({ data: { fileName: body.fileName, rawCsv: body.rawCsv, uploadedById: auth.user!.id } });
  return apiOk(job, 201);
}
