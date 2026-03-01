import { clearAuthCookie } from "@/lib/auth";
import { apiOk } from "@/lib/errors";

export async function POST() {
  clearAuthCookie();
  return apiOk({ success: true });
}
