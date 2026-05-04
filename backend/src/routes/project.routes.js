import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware.js";
import { ProjectModel } from "../models/Project.js";
import { TaskModel } from "../models/Task.js";
import { UserModel } from "../models/User.js";

export const projectRouter = Router();

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER")
});

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getProjectById(projectId) {
  if (!isValidObjectId(projectId)) {
    return null;
  }
  return ProjectModel.findById(projectId);
}

function getMemberRecord(project, userId) {
  return (
    project.members.find((member) => {
      const memberId =
        typeof member.userId === "string"
          ? member.userId
          : member.userId?._id
            ? member.userId._id.toString()
            : member.userId?.toString();
      return memberId === userId;
    }) || null
  );
}

projectRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const projects = await ProjectModel.find({
      "members.userId": new mongoose.Types.ObjectId(req.user.id)
    }).lean();
    const projectIds = projects.map((project) => project._id);
    const now = new Date();
    const stats = await TaskModel.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $group: {
          _id: "$projectId",
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [{ $ne: ["$status", "DONE"] }, { $lt: ["$dueDate", now] }]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    const statsMap = new Map(stats.map((item) => [item._id.toString(), item]));
    const projectsWithStatus = projects.map((project) => {
      const row = statsMap.get(project._id.toString()) || {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0
      };
      let status = "NOT_STARTED";
      if (row.totalTasks > 0 && row.completedTasks === row.totalTasks) {
        status = "COMPLETED";
      } else if (row.overdueTasks > 0) {
        status = "AT_RISK";
      } else if (row.totalTasks > 0) {
        status = "ON_TRACK";
      }

      return {
        ...project,
        taskStats: {
          total: row.totalTasks,
          completed: row.completedTasks,
          overdue: row.overdueTasks
        },
        projectStatus: status
      };
    });

    return res.json({ projects: projectsWithStatus });
  } catch (error) {
    return next(error);
  }
});

projectRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = createProjectSchema.parse(req.body);

    const project = await ProjectModel.create({
      name: data.name,
      description: data.description ?? "",
      members: [{ userId: req.user.id, role: "ADMIN" }]
    });

    return res.status(201).json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid project payload", errors: error.flatten() });
    }
    return next(error);
  }
});

projectRouter.get("/:projectId", requireAuth, async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    await project.populate("members.userId", "name email role");

    const member = getMemberRecord(project, req.user.id);
    if (!member) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    return res.json({ project });
  } catch (error) {
    return next(error);
  }
});

projectRouter.post("/:projectId/members", requireAuth, async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const currentMember = getMemberRecord(project, req.user.id);
    if (!currentMember || currentMember.role !== "ADMIN") {
      return res.status(403).json({ message: "Only project admins can add members" });
    }

    const data = addMemberSchema.parse(req.body);
    if (!isValidObjectId(data.userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const targetUser = await UserModel.findById(data.userId).lean();
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const exists = getMemberRecord(project, data.userId);
    if (exists) {
      return res.status(409).json({ message: "User already in project" });
    }

    project.members.push({ userId: data.userId, role: data.role });
    await project.save();
    return res.status(201).json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid member payload", errors: error.flatten() });
    }
    return next(error);
  }
});
