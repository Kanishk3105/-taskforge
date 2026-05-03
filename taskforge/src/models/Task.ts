import mongoose, { Schema, model, models } from "mongoose";

const TaskSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dueDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

TaskSchema.index({ projectId: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ dueDate: 1 });

export type TaskDoc = mongoose.InferSchemaType<typeof TaskSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Task = models.Task ?? model("Task", TaskSchema);
