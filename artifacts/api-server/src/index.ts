import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app.js";
import router, { setupRoutes } from "./routes/index.js";
import { setupSocketHandlers } from "./sockets/chat.js";
import { connectMongo } from "./lib/mongo.js";
import { logger } from "./lib/logger.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  // Connect to MongoDB before accepting requests
  await connectMongo();

  const httpServer = createServer(app);

  const io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  setupRoutes(router, io);
  setupSocketHandlers(io);

  httpServer.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
