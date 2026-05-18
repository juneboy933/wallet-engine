import { Redis } from "ioredis";
import env from "./schema.config.js";
import logger from "./winston.config.js";

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,

  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
});

redis.on("connect", () => {
  logger.info("Connected to Redis");
});

redis.on("error", (err) => {
  logger.error("Redis connection error:", {
    message: err.message,
    stack: err.stack,
  });
});

export default redis;
