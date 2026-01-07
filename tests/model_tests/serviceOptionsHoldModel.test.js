const pool = require("../../db");
const ServiceOptionHold = require("../../models/serviceOptionsHoldModel");

// Mock the database pool
jest.mock("../db");

describe("ServiceOptionHold Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("holdById", () => {
    it("should return hold record by id", async () => {
      const mockHold = {
        service_option_hold_id: "hold-1",
        service_option_id: "option-1",
        user_id: "user-123",
        is_option_taken: false,
      };
      pool.query.mockResolvedValue({ rows: [mockHold] });

      const result = await ServiceOptionHold.holdById("hold-1");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * from"),
        ["hold-1"]
      );
      expect(result).toEqual(mockHold);
    });

    it("should return undefined when hold not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await ServiceOptionHold.holdById("hold-999");

      expect(result).toBeUndefined();
    });

    it("should throw error when database query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database connection failed"));

      await expect(ServiceOptionHold.holdById("hold-1")).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("updateServiceOptionHold", () => {
    it("should update hold status to taken", async () => {
      const mockResponse = { rowCount: 1 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await ServiceOptionHold.updateServiceOptionHold("hold-1");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        [true, "hold-1", false]
      );
      expect(result.rowCount).toBe(1);
    });

    it("should return 0 rowCount when hold not found", async () => {
      const mockResponse = { rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await ServiceOptionHold.updateServiceOptionHold(
        "hold-999"
      );

      expect(result.rowCount).toBe(0);
    });

    it("should return 0 rowCount when already taken", async () => {
      const mockResponse = { rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await ServiceOptionHold.updateServiceOptionHold("hold-1");

      expect(result.rowCount).toBe(0);
    });

    it("should throw error when database update fails", async () => {
      pool.query.mockRejectedValue(new Error("Database update failed"));

      await expect(
        ServiceOptionHold.updateServiceOptionHold("hold-1")
      ).rejects.toThrow("Database update failed");
    });
  });
});
