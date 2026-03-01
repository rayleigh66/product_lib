import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/errors";
import { setAuthCookie, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body;
  if (!email || !password) return apiError("INVALID_INPUT", "邮箱和密码必填", "Email and password are required", 400);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return apiError("LOGIN_FAILED", "账号或密码错误", "Invalid credentials", 401);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return apiError("LOGIN_FAILED", "账号或密码错误", "Invalid credentials", 401);
  const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
  setAuthCookie(signToken(payload));
  return apiOk(payload);
}
