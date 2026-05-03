import mongoose, { Schema, model, models } from "mongoose";

const ProjectMemberSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      required: true,
    },
  },
  { timestamps: true },
);

ProjectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
ProjectMemberSchema.index({ userId: 1 });

export type ProjectMemberDoc = mongoose.InferSchemaType<
  typeof ProjectMemberSchema
> & { _id: mongoose.Types.ObjectId };

export const ProjectMember =
  models.ProjectMember ?? model("ProjectMember", ProjectMemberSchema);
