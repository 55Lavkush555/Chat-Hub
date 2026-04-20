import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app";
import router, { setupRoutes } from "./routes";
import { setupSocketHandlers } from "./sockets/chat";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Create HTTP server from Express app
const httpServer = createServer(app);

// Attach Socket.IO to the HTTP server
const io = new SocketServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/api/socket.io",
});

// Wire up message routes that need the Socket.IO instance
setupRoutes(router, io);

// Set up Socket.IO event handlers
setupSocketHandlers(io);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
