import request from "supertest";
import app from "../src/app";

describe("Sanity Check", () => {
  it("should return health status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
