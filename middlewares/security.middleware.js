import cors from "cors";
import helmet from "helmet";
import env from "../config/schema.config.js";

const corsOptions = {
  origin: env.CORS_ORIGIN ? [env.CORS_ORIGIN] : true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "X-Requested-With",
    "X-Idempotency-Key",
    "X-Request-Id",
  ],
  credentials: !!env.CORS_ORIGIN,
};

export const securityMiddleware = [helmet(), cors(corsOptions)];
