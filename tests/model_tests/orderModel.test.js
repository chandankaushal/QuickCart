const pool = require("../../db");
const Order = require("../../models/orderModel");

// Mock the database pool
jest.mock("../../db");

describe("Order Model", () => {
  jest.mock("../../db");
  jest.clearAllMocks();
});

describe("create", () => {
  it("should insert a new pickup order", async () => {
    const mockResponse = { rowCount: 1 };
    pool.query.mockResolvedValue(mockResponse);

    const result = await Order.create(
      "order-123",
      "pickup",
      "store-456",
      "hold-789",
      "user-001",
    );

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO"),
      ["order-123", "pickup", "hold-789", "user-001", "store-456"],
    );
    expect(result.rowCount).toBe(1);
  });

  it("should handle order creation with null client", async () => {
    const mockResponse = { rowCount: 1 };
    pool.query.mockResolvedValue(mockResponse);

    const result = await Order.create(
      "order-123",
      "store-456",
      "hold-789",
      "user-001",
      null,
    );

    expect(pool.query).toHaveBeenCalled();
    expect(result.rowCount).toBe(1);
  });

  it("should throw error when database insert fails", async () => {
    pool.query.mockRejectedValue(new Error("Database insert failed"));

    await expect(
      Order.create("order-123", "store-456", "hold-789", "user-001"),
    ).rejects.toThrow("Database insert failed");
  });

  it("should throw error on duplicate order id", async () => {
    pool.query.mockRejectedValue(new Error("duplicate key value"));

    await expect(
      Order.create("order-123", "store-456", "hold-789", "user-001"),
    ).rejects.toThrow("duplicate key value");
  });
});
