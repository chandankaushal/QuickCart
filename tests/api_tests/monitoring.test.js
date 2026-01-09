const request = require("supertest");
const express = require("express");
const monitoringRoutes = require("../../routes/monitoringRoutes");

const app = express();
app.use("/monitoring", monitoringRoutes);
// Error handler for ExpressError and other errors
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
    message: err.message || "Internal Server Error",
    code: err.code || "INTERNAL_ERROR",
  });
});

describe("GET /monitoring/db", () => {
  it("should return a success status and a timestamp message", async () => {
    const res = await request(app).get("/monitoring/db").expect(200);
    expect(res.body.status).toBe("success");
    expect(typeof res.body.message).toBe("string");
  });
  it("should return an error if DB connection has issues", async () => {
    jest.resetModules();
    jest.mock("../../db", () => ({
      connect: jest.fn().mockImplementation(() => {
        throw new Error("Mock DB error");
      }),
      query: jest.fn(),
    }));

    const express = require("express");
    const monitoringRoutes = require("../../routes/monitoringRoutes");
    const app = express();
    app.use("/monitoring", monitoringRoutes);
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        error: err.message || "Internal Server Error",
        message: err.message || "Internal Server Error",
        code: err.code || "INTERNAL_ERROR",
      });
    });

    const res = await request(app).get("/monitoring/db").expect(500);
    expect(res.body).toHaveProperty(
      "error",
      "There was an issue connecting to DB"
    );
    expect(res.body.message).toEqual("There was an issue connecting to DB");
  });
});
