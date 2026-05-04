import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware.js";
import { UserModel } from "../models/User.js";

export const userRouter = Router();

userRouter.get("/by-email", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email() });
    const { email } = schema.parse(req.query);
    const normalizedEmail = email.trim().toLowerCase();
    const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await UserModel.findOne({
      email: { $regex: `^${escaped}$`, $options: "i" }
    }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid query payload" });
    }
    return next(error);
  }
});
