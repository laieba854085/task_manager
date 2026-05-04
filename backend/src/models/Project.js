import { Schema, Types, model } from "mongoose";

const memberSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["ADMIN", "MEMBER"], default: "MEMBER" }
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    members: { type: [memberSchema], default: [] }
  },
  { timestamps: true }
);

export const ProjectModel = model("Project", projectSchema);

