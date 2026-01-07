const pool = require("../../db");
const User = require("../../models/userModel");

// Mock the database pool
jest.mock("../db");

describe("User Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByEmail", () => {
    it("should return user data when email exists", async () => {
      const mockResponse = {
        rows: [
          { id: "123", name: "John", email: "john@test.com", role: "user" },
        ],
        rowCount: 1,
      };
      pool.query.mockResolvedValue(mockResponse);

      const result = await User.getByEmail("john@test.com");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id,name,email,role"),
        ["john@test.com"]
      );
      expect(result).toEqual(mockResponse);
    });

    it("should return empty result when email does not exist", async () => {
      const mockResponse = { rows: [], rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await User.getByEmail("notfound@test.com");

      expect(result.rowCount).toBe(0);
    });
  });

  describe("getPasswordByEmail", () => {
    it("should return user data including password", async () => {
      const mockResponse = {
        rows: [
          {
            id: "123",
            name: "John",
            email: "john@test.com",
            role: "user",
            password: "hashedPwd",
          },
        ],
        rowCount: 1,
      };
      pool.query.mockResolvedValue(mockResponse);

      const result = await User.getPasswordByEmail("john@test.com");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("password"),
        ["john@test.com"]
      );
      expect(result.rows[0].password).toBe("hashedPwd");
    });

    it("should return empty result when email does not exist", async () => {
      const mockResponse = { rows: [], rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await User.getPasswordByEmail("notfound@test.com");

      expect(result.rowCount).toBe(0);
    });
  });

  describe("register", () => {
    it("should insert a new user into the database", async () => {
      const mockResponse = { rowCount: 1 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await User.register(
        "uuid-123",
        "John",
        "john@test.com",
        "hashedPassword"
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
        ["uuid-123", "John", "john@test.com", "hashedPassword"]
      );
      expect(result.rowCount).toBe(1);
    });

    it("should throw error on duplicate email", async () => {
      pool.query.mockRejectedValue(new Error("duplicate key value"));

      await expect(
        User.register("uuid-123", "John", "john@test.com", "hashedPassword")
      ).rejects.toThrow("duplicate key value");
    });
  });

  describe("deleteUser", () => {
    it("should delete user by email", async () => {
      const mockResponse = { rowCount: 1 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await User.deleteUser("john@test.com");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM"),
        ["john@test.com"]
      );
      expect(result.rowCount).toBe(1);
    });

    it("should return 0 rowCount when user does not exist", async () => {
      const mockResponse = { rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await User.deleteUser("notfound@test.com");

      expect(result.rowCount).toBe(0);
    });
  });

  describe("loginUser", () => {
    it("should return user data for login", async () => {
      const mockResponse = {
        rows: [
          {
            id: "123",
            name: "John",
            email: "john@test.com",
            role: "user",
            password: "hashedPwd",
          },
        ],
        rowCount: 1,
      };
      pool.query.mockResolvedValue(mockResponse);

      const result = await User.loginUser("john@test.com", "password123");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["john@test.com"]
      );
      expect(result).toEqual(mockResponse);
    });

    it("should return empty result when user does not exist", async () => {
      const mockResponse = { rows: [], rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await User.loginUser("notfound@test.com", "password123");

      expect(result.rowCount).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should throw when database query fails", async () => {
      pool.query.mockRejectedValue(new Error("Database connection failed"));

      await expect(User.getByEmail("john@test.com")).rejects.toThrow(
        "Database connection failed"
      );
    });
  });
});
