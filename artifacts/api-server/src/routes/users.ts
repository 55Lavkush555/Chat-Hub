import { Router, Response } from "express";
import { User, formatUser } from "../models/user.js";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /api/users?search=...
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const search = req.query["search"] as string | undefined;

  try {
    const query: Record<string, unknown> = {
      _id: { $ne: req.userId },
    };

    if (search && search.trim()) {
      query["username"] = { $regex: search.trim(), $options: "i" };
    }

    const users = await User.find(query).sort({ isOnline: -1, username: 1 });
    res.json({ users: users.map(formatUser) });
  } catch (err) {
    req.log.error({ err }, "GetUsers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/online
router.get("/online", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({
      isOnline: true,
      _id: { $ne: req.userId },
    });
    res.json({ users: users.map(formatUser) });
  } catch (err) {
    req.log.error({ err }, "GetOnlineUsers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
