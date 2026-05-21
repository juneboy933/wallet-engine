import express from "express";
import { login, register } from "./auth.controller.js";
import { asyncHandler } from "../../middlewares/async.middleware.js";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware.js";

const router = express.Router();

router.post("/register", authRateLimiter, asyncHandler(register));
router.post("/login", authRateLimiter, asyncHandler(login));

export default router;
