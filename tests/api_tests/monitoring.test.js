jest.mock("../../db", () => ({
  connect: jest.fn().mockResolvedValue(),
  query: jest
    .fn()
    .mockResolvedValue({ rows: [{ now: "2026-01-10T00:00:00Z" }] }),
}));

const request = require("supertest");
const express = require("express");
const monitoringRoutes = require("../../routes/monitoringRoutes");
const db = require("../../db");

const app = express();
app.use("/monitoring", monitoringRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
    message: err.message || "Internal Server Error",
    code: err.code || "INTERNAL_ERROR",
  });
});

describe("GET /monitoring/db", () => {
  it("should return a success status and a timestamp message", async () => {
    db.connect.mockResolvedValue();
    db.query.mockResolvedValue({ rows: [{ now: "2026-01-10T00:00:00Z" }] });

    const res = await request(app).get("/monitoring/db").expect(200);
    expect(res.body.status).toBe("success");
    expect(typeof res.body.message).toBe("string");
  });

  it("should return an error if DB connection has issues", async () => {
    db.connect.mockImplementation(() => {
      throw new Error("Mock DB error");
    });

    const res = await request(app).get("/monitoring/db").expect(500);
    expect(res.body).toHaveProperty(
      "error",
      "There was an issue connecting to DB"
    );
    expect(res.body.message).toEqual("There was an issue connecting to DB");
  });
});
