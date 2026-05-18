import app from "./app.js";
import prisma from "./config/prisma.config.js";
import redis from "./config/redis.config.js";
import env from "./config/schema.config.js";
import logger from "./config/winston.config.js";
import { gracefulShutdown } from "./utils/gracefulshutdown.util.js";

const PORT = env.PORT;
const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info("Connected to PostgreSQL");

    // Connect to redis
    await redis.ping();
    logger.info("Connected to Redis");

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Wallet Engine is running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGINT", () =>
      gracefulShutdown({ signal: "SIGINT", prisma, redis, server }),
    );
    process.on("SIGTERM", () =>
      gracefulShutdown({ signal: "SIGTERM", prisma, redis, server }),
    );
  } catch (error) {
    logger.error("Application startup failed", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
