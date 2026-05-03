import mongoose, { Schema, model, models } from "mongoose";

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export type ProjectDoc = mongoose.InferSchemaType<typeof ProjectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Project = models.Project ?? model("Project", ProjectSchema);
