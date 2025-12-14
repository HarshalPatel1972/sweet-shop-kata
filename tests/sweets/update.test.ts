import request from "supertest";
import app from "../../src/app";
import { prisma, cleanDatabase } from "../helpers/prisma";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

describe("Update Sweet", () => {
  let adminToken: string;
  let userToken: string;
  let sweetId: number;
  let originalSweetName: string;
  const testId = Date.now(); // Unique identifier for this test suite

  beforeEach(async () => {
    await cleanDatabase();

    // Create admin user
    const hashedAdminPassword = await bcryptjs.hash("AdminPassword123!", 10);
    const admin = await prisma.user.create({
      data: {
        email: `admin-update-${testId}@example.com`,
        password: hashedAdminPassword,
        role: "Admin",
      },
    });

    adminToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // Create regular user
    const hashedUserPassword = await bcryptjs.hash("UserPassword123!", 10);
    const user = await prisma.user.create({
      data: {
        email: `user-update-${testId}@example.com`,
        password: hashedUserPassword,
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

    // Create a sweet
    const sweetName = `Original Cake ${Date.now()}`;
    const sweet = await prisma.sweet.create({
      data: {
        name: sweetName,
        price: 10.0,
        quantity: 50,
        description: "Original description",
      },
    });

    sweetId = sweet.id;
    originalSweetName = sweetName;
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("PUT /api/sweets/:id updates a sweet and returns 200", async () => {
    const updateData = {
      name: "Updated Cake",
      price: 12.99,
    };

    const res = await request(app)
      .put(`/api/sweets/${sweetId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(sweetId);
    expect(res.body.name).toBe("Updated Cake");
    expect(res.body.price).toBe(12.99);
    expect(res.body.quantity).toBe(50); // Should remain unchanged

    // Verify in database
    const updatedSweet = await prisma.sweet.findUnique({
      where: { id: sweetId },
    });
    expect(updatedSweet?.name).toBe("Updated Cake");
  });

  it("PUT /api/sweets/:id returns 404 when sweet does not exist", async () => {
    const updateData = {
      price: 15.0,
    };

    const res = await request(app)
      .put("/api/sweets/999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("PUT /api/sweets/:id returns 403 when user is not admin", async () => {
    const updateData = {
      price: 15.0,
    };

    const res = await request(app)
      .put(`/api/sweets/${sweetId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send(updateData);

    expect(res.status).toBe(403);
  });

  it("PUT /api/sweets/:id returns 400 when no fields provided for update", async () => {
    const res = await request(app)
      .put(`/api/sweets/${sweetId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("PUT /api/sweets/:id returns 401 when user is not authenticated", async () => {
    const updateData = {
      price: 15.0,
    };

    const res = await request(app)
      .put(`/api/sweets/${sweetId}`)
      .send(updateData);

    expect(res.status).toBe(401);
  });

  it("PUT /api/sweets/:id returns 409 when updating name to existing sweet name", async () => {
    // Create another sweet
    const timestamp = Date.now();
    await prisma.sweet.create({
      data: {
        name: `Another Cake ${timestamp}`,
        price: 8.0,
        quantity: 30,
      },
    });

    const updateData = {
      name: `Another Cake ${timestamp}`, // Try to use existing name
    };

    const res = await request(app)
      .put(`/api/sweets/${sweetId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");
  });

  it("PUT /api/sweets/:id can update only description (optional field)", async () => {
    const updateData = {
      description: "New description",
    };

    const res = await request(app)
      .put(`/api/sweets/${sweetId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("New description");
    expect(res.body.name).toBe(originalSweetName); // Should remain unchanged
  });
});
