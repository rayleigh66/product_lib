import { getCurrentUser } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/errors";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "请先登录", "Please login first", 401);
  return apiOk(user);
}
