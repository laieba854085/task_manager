import { Schema, Types, model } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["TODO", "IN_PROGRESS", "DONE"], default: "TODO" },
    dueDate: { type: Date },
    projectId: { type: Types.ObjectId, ref: "Project", required: true },
    assigneeId: { type: Types.ObjectId, ref: "User" },
    createdById: { type: Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const TaskModel = model("Task", taskSchema);

