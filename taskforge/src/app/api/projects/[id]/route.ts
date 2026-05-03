import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Project } from "@/models/Project";
import { ProjectMember } from "@/models/ProjectMember";
import { getMembership } from "@/lib/project-access";
import { jsonData, jsonError } from "@/lib/api-response";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError(404, "not_found", "Project not found");
  }
  const membership = await getMembership(id, me.id);
  if (!membership) return jsonError(404, "not_found", "Project not found");
  await connectDB();
  const project = await Project.findById(id).lean();
  if (!project) return jsonError(404, "not_found", "Project not found");
  const members = await ProjectMember.find({ projectId: id })
    .populate("userId", "name email")
    .lean();
  return jsonData({
    project: {
      id: String(project._id),
      name: project.name,
      description: project.description ?? "",
      createdBy: String(project.createdBy),
      createdAt: project.createdAt,
      role: membership.role,
      members: members.map((m) => {
        const u = m.userId as unknown as {
          _id: mongoose.Types.ObjectId;
          name: string;
          email: string;
        };
        return {
          userId: String(u._id),
          name: u.name,
          email: u.email,
          role: m.role,
        };
      }),
    },
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError(404, "not_found", "Project not found");
  }
  const membership = await getMembership(id, me.id);
  if (!membership) return jsonError(404, "not_found", "Project not found");
  if (membership.role !== "admin") {
    return jsonError(403, "forbidden", "Only admins can update the project");
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Invalid JSON body");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation_error", "Validation failed", parsed.error.flatten());
  }
  await connectDB();
  const project = await Project.findByIdAndUpdate(
    id,
    { $set: parsed.data },
    { new: true },
  ).lean();
  if (!project) return jsonError(404, "not_found", "Project not found");
  return jsonData({
    project: {
      id: String(project._id),
      name: project.name,
      description: project.description ?? "",
    },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError(404, "not_found", "Project not found");
  }
  const membership = await getMembership(id, me.id);
  if (!membership) return jsonError(404, "not_found", "Project not found");
  if (membership.role !== "admin") {
    return jsonError(403, "forbidden", "Only admins can delete the project");
  }
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await ProjectMember.deleteMany({ projectId: id }).session(session);
    const { Task } = await import("@/models/Task");
    await Task.deleteMany({ projectId: id }).session(session);
    await Project.deleteOne({ _id: id }).session(session);
    await session.commitTransaction();
    return jsonData({ ok: true });
  } catch (e) {
    await session.abortTransaction();
    console.error(e);
    return jsonError(500, "server_error", "Could not delete project");
  } finally {
    session.endSession();
  }
}
