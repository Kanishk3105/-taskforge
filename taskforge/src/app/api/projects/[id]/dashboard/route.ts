import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Task } from "@/models/Task";
import { getMembership } from "@/lib/project-access";
import { jsonData, jsonError } from "@/lib/api-response";

type Ctx = { params: Promise<{ id: string }> };

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
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

  const pid = new mongoose.Types.ObjectId(projectId);
  const userOid = new mongoose.Types.ObjectId(me.id);
  const today = startOfTodayUtc();

  const baseMatch: Record<string, unknown> = { projectId: pid };
  if (membership.role === "member") {
    baseMatch.assignedTo = userOid;
  }

  const [facet] = await Task.aggregate<{
    total: { count: number }[];
    byStatus: { _id: string; count: number }[];
    byAssignee: {
      userId: string;
      name: string;
      email: string;
      count: number;
    }[];
    overdue: {
      id: string;
      title: string;
      dueDate: Date;
      status: string;
      priority: string;
      assigneeName: string;
    }[];
  }>([
    { $match: baseMatch },
    {
      $facet: {
        total: [{ $count: "count" }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        byAssignee: [
          { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $project: {
              _id: 0,
              userId: { $toString: "$_id" },
              name: "$user.name",
              email: "$user.email",
              count: 1,
            },
          },
        ],
        overdue: [
          {
            $match: {
              status: { $ne: "done" },
              dueDate: { $lt: today },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "assignedTo",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $project: {
              _id: 0,
              id: { $toString: "$_id" },
              title: 1,
              dueDate: 1,
              status: 1,
              priority: 1,
              assigneeName: "$user.name",
            },
          },
          { $sort: { dueDate: 1 } },
          { $limit: 50 },
        ],
      },
    },
  ]);

  const totalTasks = facet?.total?.[0]?.count ?? 0;
  const tasksByStatus = Object.fromEntries(
    (facet?.byStatus ?? []).map((s) => [s._id, s.count]),
  ) as Record<string, number>;

  return jsonData({
    scope: membership.role === "admin" ? "project" : "assigned",
    totalTasks,
    tasksByStatus: {
      todo: tasksByStatus.todo ?? 0,
      in_progress: tasksByStatus.in_progress ?? 0,
      done: tasksByStatus.done ?? 0,
    },
    tasksPerUser: facet?.byAssignee ?? [],
    overdueTasks: (facet?.overdue ?? []).map((o) => ({
      ...o,
      dueDate: o.dueDate.toISOString(),
    })),
  });
}
