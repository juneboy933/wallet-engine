import express from "express";
import { transfer } from "./transfer.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { idempotencyMiddleware } from "../../middlewares/idempotencyKey.middleware.js";
import { asyncHandler } from "../../middlewares/async.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, idempotencyMiddleware, asyncHandler(transfer));

export default router;
