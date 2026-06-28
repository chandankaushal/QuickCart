const {
  checkProductStock,
  updateQtyinDb,
  getAvailableProductsByStore,
  generateProductImage,
} = require("../../service/productService");
const Product = require("../../models/productModel");
const validateStore = require("../../service/validateStore");
const { generateImage } = require("../../utils/runwareApi");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

jest.mock("../../models/productModel");
jest.mock("../../service/validateStore");
jest.mock("../../utils/runwareApi");

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
        store_id,
      );
    });

    it("should throw error when no items are found in database", async () => {
      const items = [{ upc: 123, qty: 2 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({ rows: [] });

      await expect(
        checkProductStock(items, store_id, mockLogger),
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

      await expect(
        checkProductStock(items, store_id, mockLogger),
      ).rejects.toThrow("UPC 456");
    });

    it("should return problems when insufficient stock", async () => {
      const items = [{ upc: 123, qty: 10 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [{ upc: 123, qty: 5 }], // only 5 available, 10 requested
      });

      await expect(
        checkProductStock(items, store_id, mockLogger),
      ).rejects.toThrow("UPC 123");
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

      await expect(
        checkProductStock(items, store_id, mockLogger),
      ).rejects.toThrow("UPC 222,333");
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
        { items, store_id },
        "checking product availabilty",
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        { items: { found_items: 1 } },
        "Found Items",
      );
    });

    it("should log out of stock items when problems exist", async () => {
      const items = [{ upc: 123, qty: 100 }];
      const store_id = 1;

      Product.getProductByUpc.mockResolvedValue({
        rows: [{ upc: 123, qty: 5 }],
      });

      await expect(
        checkProductStock(items, store_id, mockLogger),
      ).rejects.toThrow("UPC 123");
    });
  });

  describe("updateQtyinDb", () => {
    it("should return products updated count on success", async () => {
      const items = [
        { upc: 123, qty: 2 },
        { upc: 456, qty: 1 },
      ];
      const store_id = 1;
      const mockClient = {};

      Product.batchUpdateProductQty.mockResolvedValue({ rowCount: 2 });

      const result = await updateQtyinDb(items, store_id, mockClient);

      expect(result).toBe(2);

      expect(Product.batchUpdateProductQty).toHaveBeenCalledWith(
        items,
        store_id,
        mockClient,
      );
    });

    it("should throw error when nothing was updated", async () => {
      const items = [{ upc: 123, qty: 2 }];
      const store_id = 1;

      Product.batchUpdateProductQty.mockResolvedValue({ rowCount: 0 });

      await expect(updateQtyinDb(items, store_id)).rejects.toThrow(
        "Internal Server Error",
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
        new Error("Database connection failed"),
      );

      await expect(updateQtyinDb(items, store_id)).rejects.toThrow(
        "Database connection failed",
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
        expect(error.code).toBe("INTERNAL_SERVER_ERROR");
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe("Internal Server Error");
      }
    });
  });

  describe("getAvailableProductsByStore", () => {
    it("should return available products when store exists", async () => {
      const store_id = 10;
      const products = [
        { product_id: 1, upc: 123, qty: 5, price_cents: 199, name: "Milk" },
      ];
      validateStore.mockResolvedValue([{ store_id }]);
      Product.getAvailableByStoreId.mockResolvedValue({ rows: products });

      const result = await getAvailableProductsByStore(store_id, mockLogger);

      expect(validateStore).toHaveBeenCalledWith(store_id, mockLogger);
      expect(Product.getAvailableByStoreId).toHaveBeenCalledWith(store_id);
      expect(result).toEqual(products);
    });

    it("should return empty array when store has no stock", async () => {
      validateStore.mockResolvedValue([{ store_id: 10 }]);
      Product.getAvailableByStoreId.mockResolvedValue({ rows: [] });

      const result = await getAvailableProductsByStore(10, mockLogger);

      expect(result).toEqual([]);
    });

    it("should throw when store does not exist", async () => {
      const { StoreNotFoundError } = require("../../errors/storeErrors");
      validateStore.mockRejectedValue(new StoreNotFoundError());

      await expect(getAvailableProductsByStore(999, mockLogger)).rejects.toThrow(
        "No stores found",
      );
      expect(Product.getAvailableByStoreId).not.toHaveBeenCalled();
    });
  });

  describe("generateProductImage", () => {
    it("should queue an image and persist the task id for an existing product", async () => {
      Product.getById.mockResolvedValue({ rows: [{ name: "Organic Milk" }] });
      generateImage.mockResolvedValue([{ taskUUID: "task-abc" }]);
      Product.updateProductImage.mockResolvedValue({ rowCount: 1 });

      const result = await generateProductImage(7, mockLogger);

      expect(Product.getById).toHaveBeenCalledWith(7);
      expect(generateImage).toHaveBeenCalledWith(
        "Generate a catalog image of Organic Milk",
        mockLogger,
      );
      expect(Product.updateProductImage).toHaveBeenCalledWith(7, "task-abc");
      expect(result).toEqual([{ taskUUID: "task-abc" }]);
    });

    it("should throw NotFoundError when the product does not exist", async () => {
      Product.getById.mockResolvedValue({ rows: [] });

      await expect(generateProductImage(999, mockLogger)).rejects.toThrow(
        "The requested resource does not exist",
      );

      expect(generateImage).not.toHaveBeenCalled();
      expect(Product.updateProductImage).not.toHaveBeenCalled();
    });

    it("should use NOT_FOUND error code when the product does not exist", async () => {
      Product.getById.mockResolvedValue({ rows: [] });

      try {
        await generateProductImage(999, mockLogger);
        fail("Expected error to be thrown");
      } catch (error) {
        expect(error.code).toBe("NOT_FOUND");
        expect(error.statusCode).toBe(404);
      }
    });

    it("should throw InternalServerError when no image task is returned", async () => {
      Product.getById.mockResolvedValue({ rows: [{ name: "Bread" }] });
      generateImage.mockResolvedValue([]);

      await expect(generateProductImage(3, mockLogger)).rejects.toThrow(
        "Internal Server Error",
      );

      expect(Product.updateProductImage).not.toHaveBeenCalled();
    });

    it("should propagate errors from the Runware API", async () => {
      Product.getById.mockResolvedValue({ rows: [{ name: "Bread" }] });
      generateImage.mockRejectedValue(new Error("Runware down"));

      await expect(generateProductImage(3, mockLogger)).rejects.toThrow(
        "Runware down",
      );
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
        expect(error.code).toBe("ALL_ITEMS_NOT_FOUND_ERROR");
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe(
          "None of the items you requested are available",
        );
      }
    });
  });
});
