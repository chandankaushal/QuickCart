const pool = require("../../db");
const Runware = require("../../models/runwareModel");

// Mock the database pool
jest.mock("../../db");

describe("Runware Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addTask", () => {
    it("should insert a queued task with task_id and task_type", async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await Runware.addTask("task-123", "imageInference");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
        ["task-123", "imageInference"],
      );
      expect(result.rowCount).toBe(1);
    });

    it("should propagate database errors", async () => {
      pool.query.mockRejectedValue(new Error("Database insert failed"));

      await expect(Runware.addTask("task-123", "imageInference")).rejects.toThrow(
        "Database insert failed",
      );
    });
  });

  describe("addResult", () => {
    it("should update the row matching task_id with image data", async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await Runware.addResult(
        "task-123",
        "https://img.example/abc.png",
        "img-789",
        42,
        0.0123,
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        ["task-123", "https://img.example/abc.png", "img-789", 42, 0.0123],
      );
      expect(result.rowCount).toBe(1);
    });

    it("should return rowCount 0 when no matching task exists", async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      const result = await Runware.addResult(
        "unknown-task",
        "https://img.example/abc.png",
        "img-789",
        42,
        0.0123,
      );

      expect(result.rowCount).toBe(0);
    });

    it("should propagate database errors", async () => {
      pool.query.mockRejectedValue(new Error("Database update failed"));

      await expect(
        Runware.addResult("task-123", "url", "img", 1, 0.1),
      ).rejects.toThrow("Database update failed");
    });
  });
});
