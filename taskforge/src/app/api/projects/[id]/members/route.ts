import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { User } from "@/models/User";
import { ProjectMember } from "@/models/ProjectMember";
import { getMembership } from "@/lib/project-access";
import { jsonData, jsonError } from "@/lib/api-response";

const addSchema = z.object({
  email: z.string().email(),
});

const removeSchema = z.object({
  userId: z.string().min(1),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
  const { id: projectId } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return jsonError(404, "not_found", "Project not found");
  }
  const membership = await getMembership(projectId, me.id);
  if (!membership) return jsonError(404, "not_found", "Project not found");
  if (membership.role !== "admin") {
    return jsonError(403, "forbidden", "Only admins can add members");
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Invalid JSON body");
  }
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation_error", "Validation failed", parsed.error.flatten());
  }
  const { email } = parsed.data;
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) {
    return jsonError(404, "user_not_found", "No user with that email");
  }
  const uid = String(user._id);
  const existing = await ProjectMember.findOne({
    projectId,
    userId: uid,
  }).lean();
  if (existing) {
    return jsonError(409, "already_member", "User is already a member");
  }
  await ProjectMember.create({
    projectId,
    userId: uid,
    role: "member",
  });
  return jsonData(
    {
      member: {
        userId: uid,
        name: user.name,
        email: user.email,
        role: "member" as const,
      },
    },
    201,
  );
}

export async function DELETE(req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
  const { id: projectId } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return jsonError(404, "not_found", "Project not found");
  }
  const membership = await getMembership(projectId, me.id);
  if (!membership) return jsonError(404, "not_found", "Project not found");
  if (membership.role !== "admin") {
    return jsonError(403, "forbidden", "Only admins can remove members");
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Invalid JSON body");
  }
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation_error", "Validation failed", parsed.error.flatten());
  }
  const { userId: targetUserId } = parsed.data;
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return jsonError(400, "invalid_user", "Invalid user id");
  }
  await connectDB();
  const target = await ProjectMember.findOne({
    projectId,
    userId: targetUserId,
  }).lean();
  if (!target) {
    return jsonError(404, "not_found", "Member not in project");
  }
  if (target.role === "admin") {
    const adminCount = await ProjectMember.countDocuments({
      projectId,
      role: "admin",
    });
    if (adminCount <= 1) {
      return jsonError(400, "last_admin", "Cannot remove the last admin");
    }
  }
  await ProjectMember.deleteOne({ projectId, userId: targetUserId });
  return jsonData({ ok: true });
}
