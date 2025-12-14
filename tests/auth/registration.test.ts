import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("User Registration", () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    // Clean up users after each test
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("POST /api/auth/register returns 201 and creates a user with hashed password", async () => {
    const payload = {
      email: "alice@example.com",
      password: "SecurePassword123!",
    };

    const res = await request(app).post("/api/auth/register").send(payload);

    // Assert HTTP status
    expect(res.status).toBe(201);

    // Assert response body contains email but not password
    expect(res.body).toHaveProperty("id");
    expect(res.body.email).toBe(payload.email);
    expect(res.body).not.toHaveProperty("password");

    // Assert role defaults to "User"
    expect(res.body.role).toBe("User");

    // Assert password is hashed in database
    const dbUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    expect(dbUser).toBeDefined();
    expect(dbUser?.password).not.toBe(payload.password);
  });
});
