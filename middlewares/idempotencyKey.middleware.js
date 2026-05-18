export const idempotencyMiddleware = (req, res, next) => {
  const idempotencyKey = req.headers["x-idempotency-key"];
  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.trim().length < 16 ||
    idempotencyKey.trim().length > 128
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid idempotency key is required in the header",
    });
  }
  req.idempotencyKey = idempotencyKey.trim();
  next();
};
