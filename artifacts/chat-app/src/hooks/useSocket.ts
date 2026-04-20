import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { 
  getGetMessagesQueryKey, 
  getGetOnlineUsersQueryKey, 
  getGetUsersQueryKey,
  Message 
} from "@workspace/api-client-react";

type TypingEvent = {
  userId: string;
  isTyping: boolean;
};

export function useSocket(token: string | null, currentUserId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || !currentUserId) return;

    const newSocket = io({
      auth: { token },
      path: "/api/socket.io", 
      // The socket logic on server is handled at /api, so we typically connect normally and it goes via the proxy
      // The server at /api handles the socket connection via the `/api` path or default. Wait, the prompt says:
      // "the server at /api handles the socket connection via the `/api` path"
    });

    newSocket.on("connect", () => {
      newSocket.emit("join");
    });

    newSocket.on("new_message", (message: Message) => {
      queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(message.senderId) });
      queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(message.receiverId) });
      
      if (message.senderId !== currentUserId) {
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(currentUserId) });
      }
    });

    newSocket.on("online_users", () => {
      queryClient.invalidateQueries({ queryKey: getGetOnlineUsersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
    });

    newSocket.on("typing", ({ userId, isTyping }: TypingEvent) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, currentUserId, queryClient]);

  const emitTyping = (receiverId: string, isTyping: boolean) => {
    if (socket) {
      socket.emit("typing", { receiverId, isTyping });
    }
  };

  return {
    socket,
    typingUsers,
    emitTyping
  };
}
