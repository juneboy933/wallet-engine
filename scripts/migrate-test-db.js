import { spawnSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.TEST_DATABASE_URL) {
  console.error("TEST_DATABASE_URL is required to run tests.");
  process.exit(1);
}

const prismaBin = path.join(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma",
);
const command = process.platform === "win32" ? "cmd.exe" : prismaBin;
const args =
  process.platform === "win32"
    ? ["/c", prismaBin, "migrate", "deploy"]
    : ["migrate", "deploy"];

const result = spawnSync(command, args, {
  env: {
    ...process.env,
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    NODE_ENV: "test",
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(`Failed to run Prisma migrations: ${result.error.message}`);
}

process.exit(result.status ?? 1);
