import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 });

export type UserDoc = mongoose.InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = models.User ?? model("User", UserSchema);
