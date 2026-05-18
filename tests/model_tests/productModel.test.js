const pool = require("../../db");
const Product = require("../../models/productModel");

// Mock the database pool
jest.mock("../../db");

describe("Product Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProductByUpc", () => {
    it("should return product when single UPC exists", async () => {
      const mockResponse = {
        rows: [{ upc: 123456789, qty: 10 }],
        rowCount: 1,
      };
      pool.query.mockResolvedValue(mockResponse);

      const result = await Product.getProductByUpc(123456789, "store-123");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT upc,qty"),
        [[123456789], "store-123"]
      );
      expect(result.rows[0].upc).toBe(123456789);
    });

    it("should return multiple products when array of UPCs provided", async () => {
      const mockResponse = {
        rows: [
          { upc: 123456789, qty: 10 },
          { upc: 987654321, qty: 5 },
        ],
        rowCount: 2,
      };
      pool.query.mockResolvedValue(mockResponse);

      const result = await Product.getProductByUpc(
        [123456789, 987654321],
        "store-123"
      );

      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("ANY"), [
        [123456789, 987654321],
        "store-123",
      ]);
      expect(result.rowCount).toBe(2);
    });

    it("should return empty result when UPC does not exist", async () => {
      const mockResponse = { rows: [], rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await Product.getProductByUpc(999999999, "store-123");

      expect(result.rowCount).toBe(0);
    });

    it("should throw error when database query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database connection failed"));

      await expect(
        Product.getProductByUpc(123456789, "store-123")
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("getAvailableByStoreId", () => {
    it("should return in-stock products for a store", async () => {
      const mockResponse = {
        rows: [
          { product_id: 1, upc: 123, qty: 5, price_cents: 199, name: "Milk" },
          { product_id: 2, upc: 456, qty: 2, price_cents: 299, name: "Bread" },
        ],
        rowCount: 2,
      };
      pool.query.mockResolvedValue(mockResponse);

      const result = await Product.getAvailableByStoreId(10);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringMatching(/qty > 0[\s\S]*name/),
        [10],
      );
      expect(result.rows).toHaveLength(2);
    });

    it("should return empty array when no products in stock", async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await Product.getAvailableByStoreId(10);

      expect(result.rows).toEqual([]);
    });
  });

  describe("batchUpdateProductQty", () => {
    it("should update quantity for single item", async () => {
      const mockResponse = { rowCount: 1 };
      pool.query.mockResolvedValue(mockResponse);

      const items = [{ upc: 123456789, qty: 2 }];
      const result = await Product.batchUpdateProductQty(items, "store-123");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        expect.arrayContaining([123456789, 2, [123456789], "store-123"])
      );
      expect(result.rowCount).toBe(1);
    });

    it("should update quantity for multiple items", async () => {
      const mockResponse = { rowCount: 2 };
      pool.query.mockResolvedValue(mockResponse);

      const items = [
        { upc: 123456789, qty: 2 },
        { upc: 987654321, qty: 3 },
      ];
      const result = await Product.batchUpdateProductQty(items, "store-123");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("CASE upc"),
        expect.arrayContaining([
          123456789,
          2,
          987654321,
          3,
          [123456789, 987654321],
          "store-123",
        ])
      );
      expect(result.rowCount).toBe(2);
    });

    it("should return 0 rowCount when no products updated", async () => {
      const mockResponse = { rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const items = [{ upc: 999999999, qty: 2 }];
      const result = await Product.batchUpdateProductQty(items, "store-123");

      expect(result.rowCount).toBe(0);
    });

    it("should throw error when database update fails", async () => {
      pool.query.mockRejectedValue(new Error("Database update failed"));

      const items = [{ upc: 123456789, qty: 2 }];
      await expect(
        Product.batchUpdateProductQty(items, "store-123")
      ).rejects.toThrow("Database update failed");
    });
  });
});
