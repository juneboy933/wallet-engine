import argon2 from "argon2";
import prisma from "../../config/prisma.config.js";
import logger from "../../config/winston.config.js";
import { generateToken } from "../../utils/token.util.js";
import { AppError } from "../../utils/appError.util.js";

export const registerUser = async ({ email, password }) => {
  let hashedPassword;
  try {
    hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 5,
      parallelism: 1,
    });
  } catch (hashError) {
    logger.error("Error hashing password:", { error: hashError });
    throw new AppError("Security initialization failed.", 500);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check if the email already exists
      const existingUser = await tx.user.findUnique({ where: { email } });
      if (existingUser) throw new AppError("Email already in use.", 400);

      // Create the new user
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
        },
      });

      // Create a wallet for the new user
      const newWallet = await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
        },
      });

      return { userId: newUser.id, walletId: newWallet.id };
    });

    logger.info("User registered successfully", {
      userId: result.userId,
      walletId: result.walletId,
    });

    return {
      userId: result.userId,
      walletId: result.walletId,
    };
  } catch (error) {
    logger.error("Error registering user:", {
      email,
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Registration failed due to a system error", 500);
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    // Check if the user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) throw new AppError("Invalid email or password.", 400);

    // Verify the user password
    const isMatch = await argon2.verify(existingUser.passwordHash, password);
    if (!isMatch) throw new AppError("Invalid email or password.", 400);
    const token = generateToken(existingUser);

    logger.info("User logged in sucessfully", {
      userId: existingUser.id,
    });

    return {
      token,
      user: {
        id: existingUser.id,
        email: existingUser.email,
      },
    };
  } catch (error) {
    logger.error("Error logging in user:", {
      email,
      message: error.message,
      stack: error.stack,
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Login failed due to system error", 500);
  }
};
