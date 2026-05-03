import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const COOKIE_NAME = "taskforge_session";

export type JwtPayload = {
  sub: string;
  email: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(COOKIE_NAME)?.value ?? null;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    await connectDB();
    const user = await User.findById(payload.sub).lean();
    if (!user) return null;
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
    };
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) return null;
  return user;
}

export const authCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  },
};
