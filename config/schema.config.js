import z from "zod";
import dotenv from "dotenv";

dotenv.config();

export const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    REDIS_URL: z.string().url(),
    DATABASE_URL: z.string().url(),
    TEST_DATABASE_URL: z.string().url().optional(),
    TEST_REDIS_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]),
    JWT_SECRET: z
      .string()
      .min(32, { message: "JWT_SECRET must be at least 32 characters long" }),
    CORS_ORIGIN: z.string().url().optional(),
    LOG_LEVEL: z
      .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
      .default("info"),
    TRUST_PROXY: z
      .union([z.literal("true"), z.literal("false")])
      .default("false"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "test" && !env.TEST_DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["TEST_DATABASE_URL"],
        message: "TEST_DATABASE_URL is required when NODE_ENV is test",
      });
    }
  });

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  throw new Error(
    `Missing or invalid environment variables: ${JSON.stringify(
      _env.error.format(),
    )}`,
  );
}

const env = {
  ..._env.data,
  TRUST_PROXY: _env.data.TRUST_PROXY === "true",
};

if (env.NODE_ENV === "test") {
  process.env.DATABASE_URL = env.TEST_DATABASE_URL;
  process.env.REDIS_URL = env.TEST_REDIS_URL || "redis://localhost:6379";
}

export default env;
