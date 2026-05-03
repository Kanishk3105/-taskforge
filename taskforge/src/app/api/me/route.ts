import { getSessionUser } from "@/lib/auth";
import { jsonData, jsonError } from "@/lib/api-response";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return jsonError(401, "unauthorized", "Not authenticated");
  }
  return jsonData({ user });
}
