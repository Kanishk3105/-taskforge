import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { Project } from "@/models/Project";
import { ProjectMember } from "@/models/ProjectMember";
import { jsonData, jsonError } from "@/lib/api-response";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
});

export async function GET() {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
  await connectDB();
  const memberships = await ProjectMember.find({ userId: me.id })
    .populate("projectId")
    .lean();
  const projects = memberships
    .map((m) => {
      const p = m.projectId as unknown as {
        _id: mongoose.Types.ObjectId;
        name: string;
        description?: string;
        createdAt: Date;
      } | null;
      if (!p || !p._id) return null;
      return {
        id: String(p._id),
        name: p.name,
        description: p.description ?? "",
        role: m.role,
        createdAt: p.createdAt,
      };
    })
    .filter(Boolean);
  return jsonData({ projects });
}

export async function POST(req: Request) {
  const me = await getSessionUser();
  if (!me) return jsonError(401, "unauthorized", "Not authenticated");
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
  const { name, description } = parsed.data;
  await connectDB();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [project] = await Project.create(
      [{ name, description, createdBy: me.id }],
      { session },
    );
    await ProjectMember.create(
      [
        {
          projectId: project._id,
          userId: me.id,
          role: "admin",
        },
      ],
      { session },
    );
    await session.commitTransaction();
    return jsonData(
      {
        project: {
          id: String(project._id),
          name: project.name,
          description: project.description,
          role: "admin" as const,
        },
      },
      201,
    );
  } catch (e) {
    await session.abortTransaction();
    console.error(e);
    return jsonError(500, "server_error", "Could not create project");
  } finally {
    session.endSession();
  }
}
