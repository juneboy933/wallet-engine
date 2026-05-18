import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 15000, // Account for heavy Argon2 hashing overhead
    hookTimeout: 20000, // Give hooks ample time to handle network cleanups
    setupFiles: ["./tests/setup/test.setup.js"],
    fileParallelism: false,
    pool: "threads",
  },
});
