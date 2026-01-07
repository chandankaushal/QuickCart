const {
  checkProductStock,
  updateQtyinDb,
} = require("../../service/productService");
const Product = require("../../models/productModel");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

jest.mock("../models/productModel");

describe("Product Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkProductStock", () => {
    it("should return no problems when all items are in stock", async () => {
      const items = [
        { upc: 123, qty: 2 },
        { upc: 456, qty: 1 },
      ];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [
          { upc: 123, qty: 10 },
          { upc: 456, qty: 5 },
        ],
      });

      const result = await checkProductStock(items, store_id, mockLogger);

      expect(result.problems).toBe(false);
      expect(result.data).toEqual([
        { upc: 123, status: "ok", available: 10, requested: 2 },
        { upc: 456, status: "ok", available: 5, requested: 1 },
      ]);
      expect(Product.getProductByUpc).toHaveBeenCalledWith(
        [123, 456],
        store_id
      );
    });

    it("should throw error when no items are found in database", async () => {
      const items = [{ upc: 123, qty: 2 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({ rows: [] });

      await expect(
        checkProductStock(items, store_id, mockLogger)
      ).rejects.toThrow("None of the items you requested are available");

      expect(Product.getProductByUpc).toHaveBeenCalledWith([123], store_id);
    });

    it("should return problems when item is not found in database", async () => {
      const items = [
        { upc: 123, qty: 2 },
        { upc: 456, qty: 1 },
      ];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [{ upc: 123, qty: 10 }], // 456 not found
      });

      const result = await checkProductStock(items, store_id, mockLogger);

      expect(result.problems).toBe(true);
      expect(result.data).toEqual([{ upc: 456, status: "item_not_found" }]);
    });

    it("should return problems when insufficient stock", async () => {
      const items = [{ upc: 123, qty: 10 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [{ upc: 123, qty: 5 }], // only 5 available, 10 requested
      });

      const result = await checkProductStock(items, store_id, mockLogger);

      expect(result.problems).toBe(true);
      expect(result.data).toEqual([
        { upc: 123, status: "insufficient_stock", available: 5, requested: 10 },
      ]);
    });

    it("should return multiple problems for mixed issues", async () => {
      const items = [
        { upc: 111, qty: 2 }, // will be ok
        { upc: 222, qty: 10 }, // insufficient stock
        { upc: 333, qty: 1 }, // not found
      ];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [
          { upc: 111, qty: 5 },
          { upc: 222, qty: 3 },
        ],
      });

      const result = await checkProductStock(items, store_id, mockLogger);

      expect(result.problems).toBe(true);
      expect(result.data).toEqual([
        { upc: 222, status: "insufficient_stock", available: 3, requested: 10 },
        { upc: 333, status: "item_not_found" },
      ]);
    });

    it("should handle single item request successfully", async () => {
      const items = [{ upc: 123, qty: 1 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [{ upc: 123, qty: 100 }],
      });

      const result = await checkProductStock(items, store_id, mockLogger);

      expect(result.problems).toBe(false);
      expect(result.data.length).toBe(1);
      expect(result.data[0].status).toBe("ok");
    });

    it("should handle exact quantity match", async () => {
      const items = [{ upc: 123, qty: 5 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [{ upc: 123, qty: 5 }], // exactly 5 available
      });

      const result = await checkProductStock(items, store_id, mockLogger);

      expect(result.problems).toBe(false);
      expect(result.data[0].status).toBe("ok");
    });

    it("should log info messages during execution", async () => {
      const items = [{ upc: 123, qty: 1 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [{ upc: 123, qty: 10 }],
      });

      await checkProductStock(items, store_id, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { items: { requested_items: 1 } },
        "Looking up for Requested Items"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        { items: { found_items: 1 } },
        "Found Items"
      );
    });

    it("should log out of stock items when problems exist", async () => {
      const items = [{ upc: 123, qty: 100 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [{ upc: 123, qty: 5 }],
      });

      await checkProductStock(items, store_id, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledWith(
        {
          OutOfStockItems: [
            {
              upc: 123,
              status: "insufficient_stock",
              available: 5,
              requested: 100,
            },
          ],
        },
        "Out of Stock items"
      );
    });
  });

  describe("updateQtyinDb", () => {
    it("should return products updated count on success", async () => {
      const items = [
        { upc: 123, qty: 2 },
        { upc: 456, qty: 1 },
      ];
      const store_id = 1;

      Product.batchUpdateProductQty.mockResolvedValue({ rowCount: 2 });

      const result = await updateQtyinDb(items, store_id);

      expect(result).toBe(2);
      expect(Product.batchUpdateProductQty).toHaveBeenCalledWith(
        items,
        store_id
      );
    });

    it("should throw error when nothing was updated", async () => {
      const items = [{ upc: 123, qty: 2 }];
      const store_id = 1;

      Product.batchUpdateProductQty.mockResolvedValue({ rowCount: 0 });

      await expect(updateQtyinDb(items, store_id)).rejects.toThrow(
        "Nothing was updated in the DB"
      );
    });

    it("should handle single item update", async () => {
      const items = [{ upc: 123, qty: 1 }];
      const store_id = 1;

      Product.batchUpdateProductQty.mockResolvedValue({ rowCount: 1 });

      const result = await updateQtyinDb(items, store_id);

      expect(result).toBe(1);
    });

    it("should propagate database errors", async () => {
      const items = [{ upc: 123, qty: 1 }];
      const store_id = 1;

      Product.batchUpdateProductQty.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(updateQtyinDb(items, store_id)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should use NO_UPDATE error code when nothing updated", async () => {
      const items = [{ upc: 123, qty: 2 }];
      const store_id = 1;

      Product.batchUpdateProductQty.mockResolvedValue({ rowCount: 0 });

      try {
        await updateQtyinDb(items, store_id);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.code).toBe("NO_UPDATE");
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe("Nothing was updated in the DB");
      }
    });
  });

  describe("Error Codes", () => {
    it("should use ITEM_NOT_FOUND error code when no items found", async () => {
      const items = [{ upc: 123, qty: 2 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({ rows: [] });

      try {
        await checkProductStock(items, store_id, mockLogger);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.code).toBe("ITEM_NOT_FOUND");
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe(
          "None of the items you requested are available"
        );
      }
    });
  });
});
