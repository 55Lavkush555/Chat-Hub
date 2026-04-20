import type { Server as SocketServer, Socket } from "socket.io";
import { User } from "../models/user.js";
import { verifyToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";

// Track online users: userId -> set of socketIds
const onlineUsers = new Map<string, Set<string>>();

function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

async function broadcastOnlineUsers(io: SocketServer) {
  io.emit("online_users", getOnlineUserIds());
}

async function setUserOnline(userId: string, online: boolean) {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline: online,
      ...(online ? {} : { lastSeen: new Date() }),
    });
  } catch (err) {
    logger.error({ err }, "Failed to update user online status");
  }
}

type AuthedSocket = Socket & { userId: string; username: string };

export function setupSocketHandlers(io: SocketServer) {
  // Authenticate every socket connection via JWT in handshake
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.["token"] as string | undefined;
    if (!token) {
      next(new Error("Authentication error: no token"));
      return;
    }

    try {
      const payload = verifyToken(token);
      (socket as AuthedSocket).userId = payload.userId;
      (socket as AuthedSocket).username = payload.username;
      next();
    } catch {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const { userId, username } = socket as AuthedSocket;

    logger.info({ userId, username, socketId: socket.id }, "Socket connected");

    // Join user's personal room so others can DM them directly
    socket.join(`user:${userId}`);

    // Track presence
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    await setUserOnline(userId, true);
    await broadcastOnlineUsers(io);

    // Client signals readiness
    socket.on("join", () => {
      logger.info({ userId }, "User joined chat");
    });

    // Typing indicators — relay to target user's room
    socket.on("typing", (data: { receiverId: string; isTyping: boolean }) => {
      io.to(`user:${data.receiverId}`).emit("typing", {
        userId,
        isTyping: data.isTyping,
      });
    });

    // Cleanup on disconnect
    socket.on("disconnect", async () => {
      logger.info({ userId, socketId: socket.id }, "Socket disconnected");

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        // Only mark offline when ALL tabs/connections are gone
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          await setUserOnline(userId, false);
          await broadcastOnlineUsers(io);
        }
      }
    });
  });
}
