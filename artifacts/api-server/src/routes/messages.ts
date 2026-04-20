import { Router, Response } from "express";
import { db, messagesTable, usersTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { SendMessageBody } from "@workspace/api-zod";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import type { Server as SocketServer } from "socket.io";

const router = Router();

export function createMessagesRouter(io: SocketServer) {
  // GET /api/messages/:userId
  router.get("/:userId", requireAuth, async (req: AuthRequest, res: Response) => {
    const otherId = req.params["userId"];
    const myId = req.userId!;

    try {
      const messages = await db
        .select({
          id: messagesTable.id,
          senderId: messagesTable.senderId,
          receiverId: messagesTable.receiverId,
          content: messagesTable.content,
          createdAt: messagesTable.createdAt,
          senderUsername: usersTable.username,
        })
        .from(messagesTable)
        .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
        .where(
          or(
            and(
              eq(messagesTable.senderId, myId),
              eq(messagesTable.receiverId, otherId),
            ),
            and(
              eq(messagesTable.senderId, otherId),
              eq(messagesTable.receiverId, myId),
            ),
          ),
        )
        .orderBy(messagesTable.createdAt);

      res.json({
        messages: messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          senderUsername: m.senderUsername ?? undefined,
        })),
      });
    } catch (err) {
      req.log.error({ err }, "GetMessages error");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/messages
  router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
    const parsed = SendMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { receiverId, content } = parsed.data;
    const senderId = req.userId!;

    try {
      const [message] = await db
        .insert(messagesTable)
        .values({ senderId, receiverId, content })
        .returning();

      const [sender] = await db
        .select({ username: usersTable.username })
        .from(usersTable)
        .where(eq(usersTable.id, senderId))
        .limit(1);

      const formatted = {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        senderUsername: sender?.username,
      };

      // Emit to receiver's socket room
      io.to(`user:${receiverId}`).emit("new_message", formatted);
      io.to(`user:${senderId}`).emit("new_message", formatted);

      res.status(201).json(formatted);
    } catch (err) {
      req.log.error({ err }, "SendMessage error");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

export default router;
