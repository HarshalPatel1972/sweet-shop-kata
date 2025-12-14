import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("User Login", () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany({});
    
    // Create a test user for login tests
    const hashedPassword = await bcrypt.hash("TestPassword123!", 10);
    await prisma.user.create({
      data: {
        email: "test@example.com",
        password: hashedPassword,
        role: "User",
      },
    });
  });

  afterEach(async () => {
    // Clean up users after each test
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("POST /api/auth/login returns 200 with JWT token for valid credentials", async () => {
    const payload = {
      email: "test@example.com",
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
      email: "test@example.com",
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
