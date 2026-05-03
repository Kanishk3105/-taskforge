import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Task } from "@/models/Task";
import { ProjectMember } from "@/models/ProjectMember";
import { getMembership } from "@/lib/project-access";
import { jsonData, jsonError } from "@/lib/api-response";

const createSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional().default(""),
  dueDate: z.coerce.date(),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  status: z.enum(["todo", "in_progress", "done"]).optional().default("todo"),
  assignedTo: z.string().min(1),
});

type Ctx = { params: Promise<{ id: string }> };

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
  const { id: projectId } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return jsonError(404, "not_found", "Project not found");
  }
  const membership = await getMembership(projectId, me.id);
  if (!membership) return jsonError(404, "not_found", "Project not found");
  await connectDB();
  const filter: Record<string, unknown> = { projectId };
  if (membership.role === "member") {
    filter.assignedTo = me.id;
  }
  const tasks = await Task.find(filter).sort({ updatedAt: -1 }).lean();
  return jsonData({
    tasks: tasks.map((t) => serializeTask(t as Parameters<typeof serializeTask>[0])),
  });
}

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
    return jsonError(403, "forbidden", "Only admins can create tasks");
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Invalid JSON body");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation_error", "Validation failed", parsed.error.flatten());
  }
  const { title, description, dueDate, priority, status, assignedTo } = parsed.data;
  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    return jsonError(400, "invalid_assignee", "Invalid assignee user id");
  }
  await connectDB();
  const assigneeMember = await ProjectMember.findOne({
    projectId,
    userId: assignedTo,
  }).lean();
  if (!assigneeMember) {
    return jsonError(400, "invalid_assignee", "Assignee must be a project member");
  }
  const task = await Task.create({
    projectId,
    title,
    description,
    dueDate,
    priority,
    status,
    assignedTo,
    createdBy: me.id,
  });
  const doc = task.toObject();
  return jsonData({ task: serializeTask(doc as Parameters<typeof serializeTask>[0]) }, 201);
}
