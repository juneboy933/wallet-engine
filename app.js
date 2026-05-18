import express from "express";
import { requestLogger } from "./middlewares/request-logger.middleware.js";
import prisma from "./config/prisma.config.js";
import redis from "./config/redis.config.js";
import logger from "./config/winston.config.js";
import { notFoundMiddleware } from "./middlewares/notfound.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import tranferRoutes from "./modules/transfer/transfer.routes.js";

const app = express();

// Body parser middleware
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));

// Request logging middleware
app.use(requestLogger);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/wallet", walletRoutes);
app.use("/api/v1/transfer", tranferRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  let dbStatus = "DOWN";
  let redisStatus = "DOWN";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "UP";

    await redis.ping();
    redisStatus = "UP";

    const status =
      dbStatus === "UP" && redisStatus === "UP" ? "HEALTHY" : "UNHEALTHY";

    return res.status(200).json({
      status,
      database: dbStatus,
      redis: redisStatus,
      uptime: process.uptime(),
    });
  } catch (error) {
    logger.error("Error occurred while checking health", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      status: "UNHEALTHY",
    });
  }
});

// 404 handler
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

export default app;
