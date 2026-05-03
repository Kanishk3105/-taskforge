import { authCookie } from "@/lib/auth";
import { jsonData } from "@/lib/api-response";

export async function POST() {
  const res = jsonData({ ok: true });
  res.cookies.set(authCookie.name, "", { ...authCookie.options, maxAge: 0 });
  return res;
}
