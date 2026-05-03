import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Task } from "@/models/Task";
import { ProjectMember } from "@/models/ProjectMember";
import { getMembership } from "@/lib/project-access";
import { jsonData, jsonError } from "@/lib/api-response";

const patchAdminSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  assignedTo: z.string().min(1).optional(),
});

const patchMemberSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

type Ctx = { params: Promise<{ id: string; taskId: string }> };

function serializeTask(doc: {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  priority: string;
  status: string;
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description ?? "",
    dueDate: doc.dueDate.toISOString(),
    priority: doc.priority,
    status: doc.status,
    assignedTo: String(doc.assignedTo),
    createdBy: String(doc.createdBy),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
  const { id: projectId, taskId } = await ctx.params;
  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(taskId)
  ) {
    return jsonError(404, "not_found", "Not found");
  }
  const membership = await getMembership(projectId, me.id);
  if (!membership) return jsonError(404, "not_found", "Project not found");
  await connectDB();
  const task = await Task.findOne({ _id: taskId, projectId }).lean();
  if (!task) return jsonError(404, "not_found", "Task not found");
  if (
    membership.role === "member" &&
    String(task.assignedTo) !== me.id
  ) {
    return jsonError(403, "forbidden", "You can only view tasks assigned to you");
  }
  return jsonData({
    task: serializeTask(task as Parameters<typeof serializeTask>[0]),
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
  const { id: projectId, taskId } = await ctx.params;
  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(taskId)
  ) {
    return jsonError(404, "not_found", "Not found");
  }
  const membership = await getMembership(projectId, me.id);
  if (!membership) return jsonError(404, "not_found", "Project not found");
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Invalid JSON body");
  }
  await connectDB();
  const task = await Task.findOne({ _id: taskId, projectId });
  if (!task) return jsonError(404, "not_found", "Task not found");

  if (membership.role === "member") {
    if (String(task.assignedTo) !== me.id) {
      return jsonError(403, "forbidden", "You can only update tasks assigned to you");
    }
    const parsed = patchMemberSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "validation_error", "Validation failed", parsed.error.flatten());
    }
    const d = parsed.data;
    if (d.title !== undefined) task.title = d.title;
    if (d.description !== undefined) task.description = d.description;
    if (d.dueDate !== undefined) task.dueDate = new Date(d.dueDate);
    if (d.priority !== undefined) task.priority = d.priority;
    if (d.status !== undefined) task.status = d.status;
    await task.save();
    return jsonData({
      task: serializeTask(task.toObject() as Parameters<typeof serializeTask>[0]),
    });
  }

  const parsed = patchAdminSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation_error", "Validation failed", parsed.error.flatten());
  }
  const data = parsed.data;
  if (data.assignedTo !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(data.assignedTo)) {
      return jsonError(400, "invalid_assignee", "Invalid assignee user id");
    }
    const assigneeMember = await ProjectMember.findOne({
      projectId,
      userId: data.assignedTo,
    }).lean();
    if (!assigneeMember) {
      return jsonError(400, "invalid_assignee", "Assignee must be a project member");
    }
    task.assignedTo = new mongoose.Types.ObjectId(data.assignedTo);
  }
  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.dueDate !== undefined) task.dueDate = new Date(data.dueDate);
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.status !== undefined) task.status = data.status;
  await task.save();
  return jsonData({
    task: serializeTask(task.toObject() as Parameters<typeof serializeTask>[0]),
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
  const { id: projectId, taskId } = await ctx.params;
  if (
    !mongoose.Types.ObjectId.isValid(projectId) ||
    !mongoose.Types.ObjectId.isValid(taskId)
  ) {
    return jsonError(404, "not_found", "Not found");
  }
  const membership = await getMembership(projectId, me.id);
  if (!membership) return jsonError(404, "not_found", "Project not found");
  if (membership.role !== "admin") {
    return jsonError(403, "forbidden", "Only admins can delete tasks");
  }
  await connectDB();
  const result = await Task.deleteOne({ _id: taskId, projectId });
  if (result.deletedCount === 0) {
    return jsonError(404, "not_found", "Task not found");
  }
  return jsonData({ ok: true });
}
