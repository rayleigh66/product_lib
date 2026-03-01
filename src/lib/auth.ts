import { Role, User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { apiError } from "./errors";
import { prisma } from "./prisma";

const TOKEN_NAME = "pl_token";

export type AuthPayload = Pick<User, "id" | "email" | "name" | "role">;

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "8h" });
}

export async function getCurrentUser(): Promise<AuthPayload | null> {
  const token = cookies().get(TOKEN_NAME)?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  cookies().set(TOKEN_NAME, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
}

export function clearAuthCookie() {
  cookies().set(TOKEN_NAME, "", { expires: new Date(0), path: "/" });
}

export async function requireAuth(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) return { error: apiError("UNAUTHORIZED", "请先登录", "Please login first", 401) };
  if (roles && !roles.includes(user.role)) {
    return { error: apiError("FORBIDDEN", "无权限", "Forbidden", 403) };
  }
  return { user };
}
