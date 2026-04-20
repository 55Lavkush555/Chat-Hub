import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import { createMessagesRouter } from "./messages";
import type { Server as SocketServer } from "socket.io";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);

export function setupRoutes(appRouter: IRouter, io: SocketServer) {
  appRouter.use("/messages", createMessagesRouter(io));
}

export default router;
