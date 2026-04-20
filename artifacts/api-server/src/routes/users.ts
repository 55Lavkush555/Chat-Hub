import { Router, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

function formatUser(user: {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
}) {
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl ?? undefined,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen?.toISOString() ?? undefined,
  };
}

// GET /api/users?search=...
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const search = req.query["search"] as string | undefined;

  try {
    let users;
    if (search && search.trim()) {
      users = await db
        .select()
        .from(usersTable)
        .where(
          or(
            ilike(usersTable.username, `%${search}%`),
          ),
        );
    } else {
      users = await db.select().from(usersTable);
    }

    // Exclude current user
    const filtered = users
      .filter((u) => u.id !== req.userId)
      .map(formatUser);

    // Sort online users to top
    filtered.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return a.username.localeCompare(b.username);
    });

    res.json({ users: filtered });
  } catch (err) {
    req.log.error({ err }, "GetUsers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/online
router.get("/online", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.isOnline, true));

    const formatted = users
      .filter((u) => u.id !== req.userId)
      .map(formatUser);

    res.json({ users: formatted });
  } catch (err) {
    req.log.error({ err }, "GetOnlineUsers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
