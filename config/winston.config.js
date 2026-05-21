import winston from "winston";
import env from "./schema.config.js";

const transports = [
  new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  new winston.transports.File({ filename: "logs/combined.log" }),
];

if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: "wallet-engine" },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports,
});

export default logger;
