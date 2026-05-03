import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  authCookie,
  comparePassword,
  signToken,
} from "@/lib/auth";
import { jsonData, jsonError } from "@/lib/api-response";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  const { email, password } = parsed.data;
  await connectDB();
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return jsonError(401, "invalid_credentials", "Invalid email or password");
  }
  const token = signToken({ sub: String(user._id), email: user.email });
  const res = jsonData({
    user: { id: String(user._id), name: user.name, email: user.email },
  });
  res.cookies.set(authCookie.name, token, authCookie.options);
  return res;
}
