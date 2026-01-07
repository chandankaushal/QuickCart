const pool = require("../../db");
const { Stores } = require("../../models/storeModel");

// Mock the database pool
jest.mock("../db");

describe("Store Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all stores", async () => {
      const mockStores = [
        { store_id: "1", name: "Store 1", zip_code: "12345" },
        { store_id: "2", name: "Store 2", zip_code: "67890" },
      ];
      pool.query.mockResolvedValue({ rows: mockStores });

      const result = await Stores.getAll();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT *")
      );
      expect(result).toEqual(mockStores);
      expect(result.length).toBe(2);
    });

    it("should return empty array when no stores exist", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await Stores.getAll();

      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database connection failed"));

      await expect(Stores.getAll()).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getStoresByZip", () => {
    it("should return stores by zip code only", async () => {
      const mockResponse = {
        rows: [{ store_id: "1", name: "Store 1", zip_code: "12345" }],
        rowCount: 1,
      };
      pool.query.mockResolvedValue(mockResponse);

      const result = await Stores.getStoresByZip("12345");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("zip_code = $1"),
        ["12345"]
      );
      expect(result.rows[0].zip_code).toBe("12345");
    });

    it("should return stores by zip code and street", async () => {
      const mockResponse = {
        rows: [{ store_id: "1", name: "Store 1", zip_code: "12345" }],
        rowCount: 1,
      };
      pool.query.mockResolvedValue(mockResponse);

      const result = await Stores.getStoresByZip("12345", "Main");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("ILIKE"),
        ["12345", "%Main%"]
      );
      expect(result.rowCount).toBe(1);
    });

    it("should return empty result when no stores found", async () => {
      const mockResponse = { rows: [], rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await Stores.getStoresByZip("99999");

      expect(result.rowCount).toBe(0);
    });

    it("should throw error when database query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database connection failed"));

      await expect(Stores.getStoresByZip("12345")).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("getStoreById", () => {
    it("should return store by id", async () => {
      const mockStore = [{ store_id: "1", name: "Store 1", zip_code: "12345" }];
      pool.query.mockResolvedValue({ rows: mockStore });

      const result = await Stores.getStoreById("1");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("store_id = $1"),
        ["1"]
      );
      expect(result).toEqual(mockStore);
    });

    it("should return empty array when store not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await Stores.getStoreById("999");

      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database connection failed"));

      await expect(Stores.getStoreById("1")).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
