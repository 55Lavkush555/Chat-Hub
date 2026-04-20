import { Router, Response } from "express";
import mongoose from "mongoose";
import { Message, formatMessage } from "../models/message.js";
import { User } from "../models/user.js";
import { SendMessageBody } from "@workspace/api-zod";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import type { Server as SocketServer } from "socket.io";

const router = Router();

export function createMessagesRouter(io: SocketServer) {
  // GET /api/messages/:userId — fetch conversation history
  router.get("/:userId", requireAuth, async (req: AuthRequest, res: Response) => {
    const otherId = req.params["userId"];
    const myId = req.userId!;

    try {
      const myOid = new mongoose.Types.ObjectId(myId);
      const otherOid = new mongoose.Types.ObjectId(otherId);

      const messages = await Message.find({
        $or: [
          { senderId: myOid, receiverId: otherOid },
          { senderId: otherOid, receiverId: myOid },
        ],
      }).sort({ createdAt: 1 });

      // Fetch usernames for all senders in one query
      const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))];
      const senders = await User.find({ _id: { $in: senderIds } }).select("username");
      const usernameMap = new Map(senders.map((u) => [u._id.toString(), u.username]));

      res.json({
        messages: messages.map((m) =>
          formatMessage(m, usernameMap.get(m.senderId.toString())),
        ),
      });
    } catch (err) {
      req.log.error({ err }, "GetMessages error");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/messages — send a new message
  router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
    const parsed = SendMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { receiverId, content } = parsed.data;
    const senderId = req.userId!;

    try {
      const message = await Message.create({
        senderId: new mongoose.Types.ObjectId(senderId),
        receiverId: new mongoose.Types.ObjectId(receiverId),
        content,
      });

      const sender = await User.findById(senderId).select("username");
      const formatted = formatMessage(message, sender?.username);

      // Emit to both sender and receiver rooms for instant delivery
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
