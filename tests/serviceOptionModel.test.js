const pool = require("../db");
const ServiceOptions = require("../models/serviceOptionModel");

// Mock the database pool
jest.mock("../db");

describe("ServiceOptions Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getServiceOptions", () => {
    it("should return available service options for a store", async () => {
      const mockResponse = {
        rows: [
          { service_option_id: "1", store_id: "store-123", available: true },
          { service_option_id: "2", store_id: "store-123", available: true },
        ],
        rowCount: 2,
      };
      pool.query.mockResolvedValue(mockResponse);

      const result = await ServiceOptions.getServiceOptions("store-123");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE store_id = $1 AND available=$2"),
        ["store-123", true]
      );
      expect(result.rowCount).toBe(2);
    });

    it("should return empty result when no service options available", async () => {
      const mockResponse = { rows: [], rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await ServiceOptions.getServiceOptions("store-123");

      expect(result.rowCount).toBe(0);
    });

    it("should throw error when database query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database connection failed"));

      await expect(
        ServiceOptions.getServiceOptions("store-123")
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("serviceOptionAvailableById", () => {
    it("should return availability status for service option", async () => {
      pool.query.mockResolvedValue({ rows: [{ available: true }] });

      const result = await ServiceOptions.serviceOptionAvailableById(
        "option-1"
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT available"),
        ["option-1"]
      );
      expect(result[0].available).toBe(true);
    });

    it("should return false availability when option is taken", async () => {
      pool.query.mockResolvedValue({ rows: [{ available: false }] });

      const result = await ServiceOptions.serviceOptionAvailableById(
        "option-1"
      );

      expect(result[0].available).toBe(false);
    });

    it("should return empty array when service option not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await ServiceOptions.serviceOptionAvailableById(
        "option-999"
      );

      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database connection failed"));

      await expect(
        ServiceOptions.serviceOptionAvailableById("option-1")
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("reserveServiceOption", () => {
    it("should update service option and create hold record", async () => {
      const mockHoldResponse = {
        rows: [
          {
            service_option_hold_id: "hold-1",
            service_option_id: "option-1",
            user_id: "user-123",
          },
        ],
        rowCount: 1,
      };
      pool.query
        .mockResolvedValueOnce({ rowCount: 1 }) // First call: UPDATE
        .mockResolvedValueOnce(mockHoldResponse); // Second call: INSERT

      const result = await ServiceOptions.reserveServiceOption(
        "option-1",
        "user-123"
      );

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("UPDATE"),
        [false, "option-1"]
      );
      expect(pool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("INSERT INTO"),
        ["option-1", "user-123"]
      );
      expect(result.rows[0].service_option_id).toBe("option-1");
    });

    it("should throw error when update fails", async () => {
      pool.query.mockRejectedValue(new Error("Database update failed"));

      await expect(
        ServiceOptions.reserveServiceOption("option-1", "user-123")
      ).rejects.toThrow("Database update failed");
    });

    it("should throw error on duplicate hold", async () => {
      pool.query
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockRejectedValueOnce(new Error("duplicate key value"));

      await expect(
        ServiceOptions.reserveServiceOption("option-1", "user-123")
      ).rejects.toThrow("duplicate key value");
    });
  });
});
