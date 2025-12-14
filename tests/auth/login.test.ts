import request from "supertest";
import app from "../../src/app";
import { prisma, cleanDatabase } from "../helpers/prisma";
import bcrypt from "bcryptjs";

describe("User Login", () => {
  const testId = Date.now(); // Unique identifier for this test suite

  beforeEach(async () => {
    // Clean database before each test
    await cleanDatabase();

    // Create a test user for login tests
    const hashedPassword = await bcrypt.hash("TestPassword123!", 10);
    await prisma.user.create({
      data: {
        email: `test-login-${testId}@example.com`,
        password: hashedPassword,
        role: "User",
      },
    });
  });

  afterEach(async () => {
    // Clean up users after each test
    await cleanDatabase();
  });

  afterAll(async () => {
    // Keep connection open for other tests
  });

  it("POST /api/auth/login returns 200 with JWT token for valid credentials", async () => {
    const payload = {
      email: `test-login-${testId}@example.com`,
      password: "TestPassword123!",
    };

    const res = await request(app).post("/api/auth/login").send(payload);

    // Assert HTTP status
    expect(res.status).toBe(200);

    // Assert response contains user data
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe(payload.email);
    expect(res.body.role).toBe("User");

    // Assert JWT token is present
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(0);

    // Assert password is NOT in response
    expect(res.body).not.toHaveProperty("password");
  });

  it("POST /api/auth/login returns 401 for incorrect password", async () => {
    const payload = {
      email: `test-login-${testId}@example.com`,
      password: "WrongPassword123!",
    };

    const res = await request(app).post("/api/auth/login").send(payload);

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty("token");
  });

  it("POST /api/auth/login returns 401 for non-existent user", async () => {
    const payload = {
      email: "nonexistent@example.com",
      password: "TestPassword123!",
    };

    const res = await request(app).post("/api/auth/login").send(payload);

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty("token");
  });

  it("POST /api/auth/login returns 400 for missing email or password", async () => {
    const payloadNoEmail = {
      password: "TestPassword123!",
    };

    const res = await request(app).post("/api/auth/login").send(payloadNoEmail);

    expect(res.status).toBe(400);
    expect(res.body).not.toHaveProperty("token");
  });
});
