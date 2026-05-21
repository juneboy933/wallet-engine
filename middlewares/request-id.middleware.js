import { randomUUID } from "crypto";

export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers["x-request-id"]?.toString().trim();
  req.id = requestId && requestId.length > 0 ? requestId : randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};
