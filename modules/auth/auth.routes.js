import express from "express";
import { login, register } from "./auth.controller.js";
import { asyncHandler } from "../../middlewares/async.middleware.js";

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));

export default router;
