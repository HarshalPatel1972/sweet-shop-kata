import request from "supertest";
import app from "../../src/app";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

describe("Protected Routes & Auth Middleware", () => {
  describe("Auth Middleware", () => {
    it("GET /api/sweets returns 401 without authentication", async () => {
      const res = await request(app).get("/api/sweets");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("GET /api/sweets returns 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/sweets")
        .set("Authorization", "Bearer invalid_token");

      expect(res.status).toBe(401);
    });

    it("GET /api/sweets returns 401 with missing Bearer prefix", async () => {
      const token = jwt.sign(
        { id: 1, email: "test@example.com", role: "User" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .get("/api/sweets")
        .set("Authorization", token); // Missing "Bearer " prefix

      expect(res.status).toBe(401);
    });

    it("GET /api/sweets succeeds with valid JWT token", async () => {
      const token = jwt.sign(
        { id: 1, email: "test@example.com", role: "User" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .get("/api/sweets")
        .set("Authorization", `Bearer ${token}`);

      // Will return 404 for now (endpoint doesn't exist)
      // But should NOT return 401 (auth passed)
      expect(res.status).not.toBe(401);
    });
  });

  describe("Admin Middleware", () => {
    it("DELETE /api/sweets/:id returns 403 for non-admin user", async () => {
      const token = jwt.sign(
        { id: 1, email: "test@example.com", role: "User" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .delete("/api/sweets/1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
    });

    it("DELETE /api/sweets/:id succeeds for admin user", async () => {
      const token = jwt.sign(
        { id: 1, email: "admin@example.com", role: "Admin" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const res = await request(app)
        .delete("/api/sweets/1")
        .set("Authorization", `Bearer ${token}`);

      // Will return 404 for now (endpoint/sweet doesn't exist)
      // But should NOT return 403 (permission granted)
      expect(res.status).not.toBe(403);
    });
  });
});
