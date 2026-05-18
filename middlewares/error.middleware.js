import env from "../config/schema.config.js";
import logger from "../config/winston.config.js";

export const errorMiddleware = (err, req, res, next) => {
  logger.error("Unhandled Application Error", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  return res.status(err.statusCode || 500).json({
    success: false,
    message:
      env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
  });
};
