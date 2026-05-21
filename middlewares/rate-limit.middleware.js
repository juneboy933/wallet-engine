import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Try again later.",
  },
});

import env from "../config/schema.config.js";

const authLimit = env.NODE_ENV === "test" ? 1000 : 30;
const moneyLimit = env.NODE_ENV === "test" ? 1000 : 20;

export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: authLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again in 60 seconds.",
  },
});

export const moneyRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: moneyLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many money movement requests. Try again in 60 seconds.",
  },
});
