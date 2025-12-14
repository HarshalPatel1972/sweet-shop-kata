import request from "supertest";
import app from "../../src/app";
import { prisma, cleanDatabase } from "../helpers/prisma";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

describe("GET /api/sweets/search - Search and Filter", () => {
  let userToken: string;
  const testId = Date.now();

  beforeEach(async () => {
    await cleanDatabase();

    // Create a regular user
    const hashedPassword = await bcryptjs.hash("UserPassword123!", 10);
    const user = await prisma.user.create({
      data: {
        email: `user-search-${testId}@example.com`,
        password: hashedPassword,
        role: "User",
      },
    });

    userToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // Create test sweets with various prices and quantities
    await prisma.sweet.createMany({
      data: [
        {
          name: `Chocolate Cake ${testId}`,
          price: 15.99,
          quantity: 50,
          description: "Rich chocolate cake",
        },
        {
          name: `Vanilla Cake ${testId}`,
          price: 12.99,
          quantity: 30,
          description: "Classic vanilla cake",
        },
        {
          name: `Strawberry Mousse ${testId}`,
          price: 8.99,
          quantity: 10,
          description: "Fresh strawberry mousse",
        },
        {
          name: `Lemon Tart ${testId}`,
          price: 9.99,
          quantity: 5,
          description: "Tangy lemon tart",
        },
        {
          name: `Chocolate Chip Cookie ${testId}`,
          price: 5.99,
          quantity: 100,
          description: "Delicious chocolate chips",
        },
      ],
    });
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("should search sweets by name (partial match)", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ name: "Chocolate" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.some((s: any) => s.name.includes("Chocolate Cake"))).toBe(
      true
    );
    expect(res.body.some((s: any) => s.name.includes("Chocolate Chip"))).toBe(
      true
    );
  });

  it("should return empty array when name does not match any sweet", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ name: "NonexistentSweet" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("should filter sweets by price range (min and max)", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ minPrice: 5, maxPrice: 10.5 });

    expect(res.status).toBe(200);
    expect(res.body.every((s: any) => s.price >= 5 && s.price <= 10.5)).toBe(
      true
    );
  });

  it("should filter sweets by minimum price only", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ minPrice: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((s: any) => s.price >= 10)).toBe(true);
  });

  it("should filter sweets by maximum price only", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ maxPrice: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body.every((s: any) => s.price <= 10)).toBe(true);
  });

  it("should filter sweets by quantity range (min and max)", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ minQty: 10, maxQty: 50 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(
      res.body.every((s: any) => s.quantity >= 10 && s.quantity <= 50)
    ).toBe(true);
  });

  it("should filter sweets by minimum quantity only", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ minQty: 30 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3); // 50, 30, 100
    expect(res.body.every((s: any) => s.quantity >= 30)).toBe(true);
  });

  it("should combine multiple filters (name + price + quantity)", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({
        name: "Cake",
        minPrice: 10,
        maxPrice: 20,
        minQty: 20,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(
      res.body.every(
        (s: any) =>
          s.name.includes("Cake") &&
          s.price >= 10 &&
          s.price <= 20 &&
          s.quantity >= 20
      )
    ).toBe(true);
  });

  it("should return 401 if user is not authenticated", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .query({ name: "Chocolate" });

    expect(res.status).toBe(401);
  });

  it("should return 400 if price filters are invalid (non-numeric)", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ minPrice: "invalid" });

    expect(res.status).toBe(400);
  });

  it("should return 400 if quantity filters are invalid (non-numeric)", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ minQty: "abc" });

    expect(res.status).toBe(400);
  });

  it("should return all sweets when no filters are provided", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  it("should perform case-insensitive name search", async () => {
    const res = await request(app)
      .get("/api/sweets/search")
      .set("Authorization", `Bearer ${userToken}`)
      .query({ name: "CHOCOLATE" }); // uppercase

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(
      res.body.some((s: any) => s.name.toLowerCase().includes("chocolate"))
    ).toBe(true);
  });
});
