import logger from "../config/winston.config.js";

export const gracefulShutdown = async ({ signal, prisma, redis, server }) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            logger.info("HTTP server closed");
            resolve();
          }
        });
      });
    }

    await prisma.$disconnect();
    logger.info("Prisma disconnected");

    await redis.quit();
    logger.info("Redis disconnected");

    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown", {
      message: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
};
