const { GetupcFromItems } = require("../utils/items");

describe("items utils", () => {
  describe("GetupcFromItems", () => {
    it("should extract UPCs from array of items", () => {
      const items = [
        { upc: 123456789, qty: 2 },
        { upc: 987654321, qty: 1 },
        { upc: 111222333, qty: 5 },
      ];

      const result = GetupcFromItems(items);

      expect(result).toEqual([123456789, 987654321, 111222333]);
    });

    it("should return single UPC for single item", () => {
      const items = [{ upc: 123456789, qty: 2 }];

      const result = GetupcFromItems(items);

      expect(result).toEqual([123456789]);
    });

    it("should return empty array for empty items", () => {
      const items = [];

      const result = GetupcFromItems(items);

      expect(result).toEqual([]);
    });

    it("should handle items with string UPCs", () => {
      const items = [
        { upc: "123456789", qty: 2 },
        { upc: "987654321", qty: 1 },
      ];

      const result = GetupcFromItems(items);

      expect(result).toEqual(["123456789", "987654321"]);
    });

    it("should preserve order of UPCs", () => {
      const items = [
        { upc: 3, qty: 1 },
        { upc: 1, qty: 1 },
        { upc: 2, qty: 1 },
      ];

      const result = GetupcFromItems(items);

      expect(result).toEqual([3, 1, 2]);
    });

    it("should handle items with additional properties", () => {
      const items = [
        { upc: 123, qty: 2, name: "Product A", price: 9.99 },
        { upc: 456, qty: 1, name: "Product B", price: 19.99 },
      ];

      const result = GetupcFromItems(items);

      expect(result).toEqual([123, 456]);
    });

    it("should handle undefined UPC", () => {
      const items = [{ qty: 2 }, { upc: 123, qty: 1 }];

      const result = GetupcFromItems(items);

      expect(result).toEqual([undefined, 123]);
    });

    it("should handle null UPC", () => {
      const items = [
        { upc: null, qty: 2 },
        { upc: 123, qty: 1 },
      ];

      const result = GetupcFromItems(items);

      expect(result).toEqual([null, 123]);
    });

    it("should handle large arrays efficiently", () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        upc: i + 1,
        qty: 1,
      }));

      const result = GetupcFromItems(items);

      expect(result.length).toBe(1000);
      expect(result[0]).toBe(1);
      expect(result[999]).toBe(1000);
    });

    it("should handle duplicate UPCs", () => {
      const items = [
        { upc: 123, qty: 2 },
        { upc: 123, qty: 3 },
        { upc: 456, qty: 1 },
      ];

      const result = GetupcFromItems(items);

      expect(result).toEqual([123, 123, 456]);
    });
  });
});
