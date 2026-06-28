// Isolate the route/controller; the service layer is covered by its own tests.
jest.mock("../../service/runwareService", () => ({
  handleRunwareWebhook: jest.fn().mockResolvedValue(undefined),
}));

const request = require("supertest");
const express = require("express");
const runwareRoutes = require("../../routes/runwareRoutes");
const { handleRunwareWebhook } = require("../../service/runwareService");

const WEBHOOK_KEY = "test-secret";

function buildApp() {
  const app = express();
  app.use(express.json());
  // Stub the per-request logger normally attached by pino middleware
  app.use((req, res, next) => {
    req.log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    next();
  });
  app.use("/runware", runwareRoutes);
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      status: "error",
      message: err.message || "Internal Server Error",
      code: err.code || "INTERNAL_ERROR",
    });
  });
  return app;
}

describe("POST /runware/webhook", () => {
  let app;
  const originalKey = process.env.RUNWARE_WEBHOOK_API_KEY;

  beforeAll(() => {
    process.env.RUNWARE_WEBHOOK_API_KEY = WEBHOOK_KEY;
    app = buildApp();
  });

  afterAll(() => {
    process.env.RUNWARE_WEBHOOK_API_KEY = originalKey;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject requests with a missing apiKey", async () => {
    const res = await request(app)
      .post("/runware/webhook")
      .send({ data: [] })
      .expect(401);

    expect(res.body.code).toBe("Unauthorized");
    expect(handleRunwareWebhook).not.toHaveBeenCalled();
  });

  it("should reject requests with a wrong apiKey", async () => {
    const res = await request(app)
      .post("/runware/webhook?apiKey=wrong")
      .send({ data: [] })
      .expect(401);

    expect(res.body.code).toBe("Unauthorized");
    expect(handleRunwareWebhook).not.toHaveBeenCalled();
  });

  it("should ack with 200 and process the payload when apiKey matches", async () => {
    const payload = { data: [{ taskUUID: "task-1" }] };

    const res = await request(app)
      .post(`/runware/webhook?apiKey=${WEBHOOK_KEY}`)
      .send(payload)
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(handleRunwareWebhook).toHaveBeenCalledWith(
      payload,
      expect.any(Object),
    );
  });
});
