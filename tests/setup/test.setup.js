import { afterAll, beforeEach } from "vitest";
import prisma from "../../config/prisma.config.js";
import redis from "../../config/redis.config.js";

beforeEach(async () => {
  // Clear PostgreSQL data in a strict relationship-safe order
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  // Flush Redis to prevent dirty state idempotency keys leaking across tests
  try {
    await redis.flushdb();
  } catch (err) {
    // Catch silently if redis connection hasn't finished establishing yet
  }
});

afterAll(async () => {
  // Disconnect engines safely
  await prisma.$disconnect();

  // end(false) forcefully closes the connection instead of waiting for idling commands
  await redis.disconnect();
});
