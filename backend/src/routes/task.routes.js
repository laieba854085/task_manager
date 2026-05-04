import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware.js";
import { ProjectModel } from "../models/Project.js";
import { TaskModel } from "../models/Task.js";
import { UserModel } from "../models/User.js";

export const taskRouter = Router();

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  projectId: z.string().min(1),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"])
});

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getProject(projectId) {
  if (!isValidObjectId(projectId)) {
    return null;
  }
  return ProjectModel.findById(projectId);
}

function getMemberRecord(project, userId) {
  return project.members.find((member) => member.userId.toString() === userId) || null;
}

taskRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    const requestedProjectId = req.query.projectId;

    if (requestedProjectId) {
      if (!isValidObjectId(requestedProjectId)) {
        return res.status(400).json({ message: "Invalid projectId" });
      }
      const project = await getProject(requestedProjectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const member = getMemberRecord(project, req.user.id);
      if (!member) {
        return res.status(403).json({ message: "Not a member of this project" });
      }
      filter.projectId = requestedProjectId;
    } else {
      const projects = await ProjectModel.find({
        "members.userId": new mongoose.Types.ObjectId(req.user.id)
      })
        .select("_id")
        .lean();
      filter.projectId = { $in: projects.map((project) => project._id) };
    }

    const tasks = await TaskModel.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ tasks });
  } catch (error) {
    return next(error);
  }
});

taskRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);
    if (!isValidObjectId(data.projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const project = await getProject(data.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const currentMember = getMemberRecord(project, req.user.id);
    if (!currentMember || currentMember.role !== "ADMIN") {
      return res.status(403).json({ message: "Only project admins can create tasks" });
    }

    if (data.assigneeId) {
      if (!isValidObjectId(data.assigneeId)) {
        return res.status(400).json({ message: "Invalid assigneeId" });
      }
      const assigneeExists = getMemberRecord(project, data.assigneeId);
      if (!assigneeExists) {
        return res.status(400).json({ message: "Assignee must be a project member" });
      }
      const user = await UserModel.findById(data.assigneeId).lean();
      if (!user) {
        return res.status(404).json({ message: "Assignee user not found" });
      }
    }

    const task = await TaskModel.create({
      title: data.title,
      description: data.description ?? "",
      projectId: data.projectId,
      assigneeId: data.assigneeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      createdById: req.user.id
    });

    return res.status(201).json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid task payload", errors: error.flatten() });
    }
    return next(error);
  }
});

taskRouter.patch("/:taskId/status", requireAuth, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.taskId)) {
      return res.status(400).json({ message: "Invalid taskId" });
    }

    const data = updateStatusSchema.parse(req.body);
    const task = await TaskModel.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await getProject(task.projectId.toString());
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const member = getMemberRecord(project, req.user.id);
    if (!member) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const isProjectAdmin = member.role === "ADMIN";
    const isAssignee = task.assigneeId && task.assigneeId.toString() === req.user.id;
    if (!isProjectAdmin && !isAssignee) {
      return res.status(403).json({ message: "Only assignee or project admin can update status" });
    }

    task.status = data.status;
    await task.save();
    return res.json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid status payload", errors: error.flatten() });
    }
    return next(error);
  }
});

taskRouter.patch("/:taskId/assign", requireAuth, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.taskId)) {
      return res.status(400).json({ message: "Invalid taskId" });
    }

    const schema = z.object({ assigneeId: z.string().min(1) });
    const data = schema.parse(req.body);
    if (!isValidObjectId(data.assigneeId)) {
      return res.status(400).json({ message: "Invalid assigneeId" });
    }

    const task = await TaskModel.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await getProject(task.projectId.toString());
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const member = getMemberRecord(project, req.user.id);
    if (!member || member.role !== "ADMIN") {
      return res.status(403).json({ message: "Only project admin can assign tasks" });
    }

    const targetMember = getMemberRecord(project, data.assigneeId);
    if (!targetMember) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }

    const user = await UserModel.findById(data.assigneeId).lean();
    if (!user) {
      return res.status(404).json({ message: "Assignee user not found" });
    }

    task.assigneeId = data.assigneeId;
    await task.save();
    return res.json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid assign payload", errors: error.flatten() });
    }
    return next(error);
  }
});
