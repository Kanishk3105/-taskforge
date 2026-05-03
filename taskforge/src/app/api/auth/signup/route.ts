import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  authCookie,
  hashPassword,
  signToken,
} from "@/lib/auth";
import { jsonData, jsonError } from "@/lib/api-response";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Invalid JSON body");
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation_error", "Validation failed", parsed.error.flatten());
  }
  const { name, email, password } = parsed.data;
  try {
    await connectDB();
    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken({ sub: String(user._id), email: user.email });
    const res = jsonData({
      user: { id: String(user._id), name: user.name, email: user.email },
    });
    res.cookies.set(authCookie.name, token, authCookie.options);
    return res;
  } catch (e: unknown) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code: number }).code === 11000
    ) {
      return jsonError(409, "duplicate_email", "Email is already registered");
    }
    console.error(e);
    return jsonError(500, "server_error", "Could not create account");
  }
}
