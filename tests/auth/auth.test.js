import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("POST /api/v1/auth/register", () => {
  const url = "/api/v1/auth/register";

  it("Should register a user", async () => {
    const response = await request(app).post(url).send({
      email: "test@axon.com",
      password: "password123",
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("userId");
    expect(response.body.data).toHaveProperty("walletId");
  });

  it("Should reject duplicate email", async () => {
    await request(app).post(url).send({
      email: "test1@axon.com",
      password: "password123",
    });

    const response = await request(app).post(url).send({
      email: "test1@axon.com",
      password: "password123",
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Email already in use");
  });

  it("Should reject invalid email", async () => {
    const response = await request(app).post(url).send({
      email: "wrongemail@axon",
      password: "password123",
    });
    expect(response.statusCode).toBe(400);
    // expect(response.body.error).toBeDefined();
  });

  it("Should reject short password", async () => {
    const response = await request(app).post(url).send({
      email: "test2@axon.com",
      password: "123",
    });

    expect(response.statusCode).toBe(400);
    // expect(response.body.error).toBeDefined();
  });
});

describe("POST /api/v1/auth/login", () => {
  it("Should login an existing user", async () => {
    await request(app).post("/api/v1/auth/register").send({
      email: "user1@axon.com",
      password: "password123",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "user1@axon.com",
      password: "password123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("token");
  });

  it("Should reject invalid credentials", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "wrongemail@axon.com",
      password: "wrongpassword",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid email or password");
  });
});
