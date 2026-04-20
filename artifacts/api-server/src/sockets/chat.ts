import type { Server as SocketServer, Socket } from "socket.io";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";

// Track online users: userId -> socketId set
const onlineUsers = new Map<string, Set<string>>();

function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

async function broadcastOnlineUsers(io: SocketServer) {
  const ids = getOnlineUserIds();
  io.emit("online_users", ids);
}

async function setUserOnline(userId: string, online: boolean) {
  try {
    await db
      .update(usersTable)
      .set({
        isOnline: online,
        lastSeen: online ? undefined : new Date(),
      })
      .where(eq(usersTable.id, userId));
  } catch (err) {
    logger.error({ err }, "Failed to update user online status");
  }
}

export function setupSocketHandlers(io: SocketServer) {
  // Authenticate socket connections using JWT
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.["token"] as string | undefined;
    if (!token) {
      next(new Error("Authentication error: no token"));
      return;
    }

    try {
      const payload = verifyToken(token);
      (socket as Socket & { userId: string; username: string }).userId =
        payload.userId;
      (socket as Socket & { userId: string; username: string }).username =
        payload.username;
      next();
    } catch {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const userId = (socket as Socket & { userId: string }).userId;
    const username = (socket as Socket & { username: string }).username;

    logger.info({ userId, username, socketId: socket.id }, "Socket connected");

    // Join user's personal room for direct messages
    socket.join(`user:${userId}`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);
    await setUserOnline(userId, true);
    await broadcastOnlineUsers(io);

    // Handle join event (client signals they are ready)
    socket.on("join", () => {
      logger.info({ userId }, "User joined chat");
    });

    // Handle typing indicator
    socket.on(
      "typing",
      (data: { receiverId: string; isTyping: boolean }) => {
        io.to(`user:${data.receiverId}`).emit("typing", {
          userId,
          isTyping: data.isTyping,
        });
      },
    );

    // Handle disconnect
    socket.on("disconnect", async () => {
      logger.info({ userId, socketId: socket.id }, "Socket disconnected");

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          await setUserOnline(userId, false);
          await broadcastOnlineUsers(io);
        }
      }
    });
  });
}
