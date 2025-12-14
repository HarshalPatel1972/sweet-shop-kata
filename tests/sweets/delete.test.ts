import request from "supertest";
import app from "../../src/app";
import { prisma, cleanDatabase } from "../helpers/prisma";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

describe("Delete Sweet", () => {
  let adminToken: string;
  let userToken: string;
  let sweetId: number;
  const testId = Date.now(); // Unique identifier for this test suite

  beforeEach(async () => {
    await cleanDatabase();

    // Create admin user
    const hashedAdminPassword = await bcryptjs.hash("AdminPassword123!", 10);
    const admin = await prisma.user.create({
      data: {
        email: `admin-delete-${testId}@example.com`,
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
        email: `user-delete-${testId}@example.com`,
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
    const sweet = await prisma.sweet.create({
      data: {
        name: `Cake to Delete ${Date.now()}`,
        price: 10.0,
        quantity: 50,
      },
    });

    sweetId = sweet.id;
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("DELETE /api/sweets/:id deletes a sweet and returns 204", async () => {
    const res = await request(app)
      .delete(`/api/sweets/${sweetId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);

    // Verify it's deleted from database
    const deleted = await prisma.sweet.findUnique({
      where: { id: sweetId },
    });
    expect(deleted).toBeNull();
  });

  it("DELETE /api/sweets/:id returns 404 when sweet does not exist", async () => {
    const res = await request(app)
      .delete("/api/sweets/999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("DELETE /api/sweets/:id returns 403 when user is not admin", async () => {
    const res = await request(app)
      .delete(`/api/sweets/${sweetId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);

    // Verify sweet still exists
    const existing = await prisma.sweet.findUnique({
      where: { id: sweetId },
    });
    expect(existing).not.toBeNull();
  });

  it("DELETE /api/sweets/:id returns 401 when user is not authenticated", async () => {
    const res = await request(app).delete(`/api/sweets/${sweetId}`);

    expect(res.status).toBe(401);

    // Verify sweet still exists
    const existing = await prisma.sweet.findUnique({
      where: { id: sweetId },
    });
    expect(existing).not.toBeNull();
  });
});
