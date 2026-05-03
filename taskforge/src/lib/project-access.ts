import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ProjectMember } from "@/models/ProjectMember";

export type ProjectRole = "admin" | "member";

export async function getMembership(
  projectId: string,
  userId: string,
): Promise<{ role: ProjectRole } | null> {
  if (!mongoose.Types.ObjectId.isValid(projectId)) return null;
  await connectDB();
  const row = await ProjectMember.findOne({
    projectId,
    userId,
  }).lean();
  if (!row) return null;
  return { role: row.role as ProjectRole };
}

export async function requireMembership(
  projectId: string,
  userId: string,
): Promise<{ role: ProjectRole } | null> {
  return getMembership(projectId, userId);
}
