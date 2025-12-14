import request from "supertest";
import app from "../../src/app";
import { prisma, cleanDatabase } from "../helpers/prisma";

describe("Create Sweet", () => {
  let adminToken: string;
  let userToken: string;
  const testId = Date.now(); // Unique identifier for this test suite

  beforeEach(async () => {
    await cleanDatabase();

    // Create admin user with unique email
    const hashedPassword = await require("bcryptjs").hash(
      "AdminPassword123!",
      10
    );
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-create-${testId}@example.com`,
        password: hashedPassword,
        role: "Admin",
      },
    });

    // Generate admin token manually
    const jwt = require("jsonwebtoken");
    adminToken = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // Create regular user
    const userPassword = await require("bcryptjs").hash(
      "UserPassword123!",
      10
    );
    const regularUser = await prisma.user.create({
      data: {
        email: `user-create-${testId}@example.com`,
        password: userPassword,
        role: "User",
      },
    });

    // Generate user token manually
    userToken = jwt.sign(
      {
        id: regularUser.id,
        email: regularUser.email,
        role: regularUser.role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("POST /api/sweets creates a new sweet with valid data and returns 201", async () => {
    const sweetData = {
      name: "Chocolate Cake",
      price: 9.99,
      quantity: 50,
      description: "Delicious chocolate cake",
    };

    const res = await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sweetData);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe(sweetData.name);
    expect(res.body.price).toBe(sweetData.price);
    expect(res.body.quantity).toBe(sweetData.quantity);
    expect(res.body.description).toBe(sweetData.description);

    // Verify it's in database
    const sweet = await prisma.sweet.findUnique({
      where: { name: sweetData.name },
    });
    expect(sweet).toBeDefined();
  });

  it("POST /api/sweets returns 400 when required fields are missing", async () => {
    const invalidData = {
      name: "Incomplete Sweet",
      // missing price
      quantity: 10,
    };

    const res = await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(invalidData);

    expect(res.status).toBe(400);
  });

  it("POST /api/sweets returns 403 when user is not admin", async () => {
    const sweetData = {
      name: "Chocolate Cake",
      price: 9.99,
      quantity: 50,
      description: "Delicious chocolate cake",
    };

    const res = await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${userToken}`)
      .send(sweetData);

    expect(res.status).toBe(403);
  });

  it("POST /api/sweets returns 409 when sweet name already exists", async () => {
    const sweetData = {
      name: "Unique Sweet",
      price: 9.99,
      quantity: 50,
    };

    // Create first sweet
    await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sweetData);

    // Try to create with same name
    const res = await request(app)
      .post("/api/sweets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sweetData);

    expect(res.status).toBe(409);
  });

  it("POST /api/sweets returns 401 when user is not authenticated", async () => {
    const sweetData = {
      name: "Chocolate Cake",
      price: 9.99,
      quantity: 50,
    };

    const res = await request(app).post("/api/sweets").send(sweetData);

    expect(res.status).toBe(401);
  });
});
