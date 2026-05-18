import { PrismaClient } from "@prisma/client";
import env from "./schema.config.js";
import logger from "./winston.config.js";

const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

process.on("unhandledRejection", async (reason) => {
  logger.error("Unhandled Rejection at", { reason });
  await prisma.$disconnect();
  process.exit(1);
});

process.on("uncaughtException", async (err) => {
  logger.error("Uncaught Exception:", {
    message: err.message,
    stack: err.stack,
  });
  await prisma.$disconnect();
  process.exit(1);
});

export default prisma;
