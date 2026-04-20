import mongoose from "mongoose";
import { logger } from "./logger.js";

const MONGO_URI = process.env["MONGO_URI"];

if (!MONGO_URI) {
  throw new Error("MONGO_URI environment variable is required but was not set.");
}

export async function connectMongo(): Promise<void> {
  await mongoose.connect(MONGO_URI!, {
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info("MongoDB connected");
}

export default mongoose;
