import request from "supertest";
import app from "../../src/app";
import { prisma, cleanDatabase } from "../helpers/prisma";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

describe("List Sweets", () => {
  let userToken: string;
  let userId: number;
  const testId = Date.now(); // Unique identifier for this test suite

  beforeEach(async () => {
    await cleanDatabase();

    // Create a regular user
    const hashedPassword = await bcryptjs.hash("UserPassword123!", 10);
    const user = await prisma.user.create({
      data: {
        email: `user-list-${testId}@example.com`,
        password: hashedPassword,
        role: "User",
      },
    });

    userId = user.id;
    userToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("GET /api/sweets returns 200 with empty array when no sweets exist", async () => {
    const res = await request(app)
      .get("/api/sweets")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([]);
  });

  it("GET /api/sweets returns 200 with array of sweets when sweets exist", async () => {
    // Create test sweets with unique names
    const timestamp = Date.now();
    await prisma.sweet.createMany({
      data: [
        {
          name: `Chocolate Cake ${timestamp}`,
          price: 9.99,
          quantity: 50,
          description: "Delicious chocolate cake",
        },
        {
          name: `Vanilla Cake ${timestamp}`,
          price: 8.99,
          quantity: 30,
          description: "Classic vanilla cake",
        },
      ],
    });

    const res = await request(app)
      .get("/api/sweets")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].name).toBe(`Chocolate Cake ${timestamp}`);
    expect(res.body[1].name).toBe(`Vanilla Cake ${timestamp}`);
  });

  it("GET /api/sweets returns 401 when user is not authenticated", async () => {
    const res = await request(app).get("/api/sweets");

    expect(res.status).toBe(401);
  });

  it("GET /api/sweets returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/sweets")
      .set("Authorization", "Bearer invalid_token");

    expect(res.status).toBe(401);
  });

  it("GET /api/sweets/:id returns 200 with sweet details when sweet exists", async () => {
    const timestamp = Date.now();
    const sweet = await prisma.sweet.create({
      data: {
        name: `Strawberry Cake ${timestamp}`,
        price: 10.99,
        quantity: 20,
        description: "Fresh strawberry cake",
      },
    });

    const res = await request(app)
      .get(`/api/sweets/${sweet.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(sweet.id);
    expect(res.body.name).toBe(`Strawberry Cake ${timestamp}`);
    expect(res.body.price).toBe(10.99);
    expect(res.body.quantity).toBe(20);
  });

  it("GET /api/sweets/:id returns 404 when sweet does not exist", async () => {
    const res = await request(app)
      .get("/api/sweets/999")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /api/sweets/:id returns 401 when user is not authenticated", async () => {
    const res = await request(app).get("/api/sweets/1");

    expect(res.status).toBe(401);
  });
});
