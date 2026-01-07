const pool = require("../db");
const jwt_token = require("../models/jwtTokenModel");

// Mock the database pool
jest.mock("../db");

describe("JWT Token Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addToDB", () => {
    it("should insert JWT token into database", async () => {
      const mockResponse = { rowCount: 1 };
      pool.query.mockResolvedValue(mockResponse);

      const issueTime = new Date();
      const expiresAt = new Date(issueTime.getTime() + 3600000);

      const result = await jwt_token.addToDB(
        "token-123",
        "user-456",
        issueTime,
        expiresAt
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
        ["token-123", "user-456", issueTime, expiresAt]
      );
      expect(result.rowCount).toBe(1);
    });

    it("should throw error on duplicate token id", async () => {
      pool.query.mockRejectedValue(new Error("duplicate key value"));

      await expect(
        jwt_token.addToDB("token-123", "user-456", new Date(), new Date())
      ).rejects.toThrow("duplicate key value");
    });
  });

  describe("addRefeshToDB", () => {
    it("should insert refresh token into database", async () => {
      const mockResponse = { rowCount: 1 };
      pool.query.mockResolvedValue(mockResponse);

      const issueTime = new Date();
      const expiresAt = new Date(issueTime.getTime() + 86400000);

      const result = await jwt_token.addRefeshToDB(
        "refresh-123",
        "user-456",
        issueTime,
        expiresAt
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("REFRESH_TOKENS"),
        ["refresh-123", "user-456", issueTime, expiresAt]
      );
      expect(result.rowCount).toBe(1);
    });

    it("should throw error on database failure", async () => {
      pool.query.mockRejectedValue(new Error("Database insert failed"));

      await expect(
        jwt_token.addRefeshToDB(
          "refresh-123",
          "user-456",
          new Date(),
          new Date()
        )
      ).rejects.toThrow("Database insert failed");
    });
  });

  describe("deleteRefreshTokenFromDb", () => {
    it("should delete refresh token by id", async () => {
      const mockResponse = { rowCount: 1 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await jwt_token.deleteRefreshTokenFromDb("refresh-123");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM"),
        ["refresh-123"]
      );
      expect(result.rowCount).toBe(1);
    });

    it("should return 0 rowCount when token not found", async () => {
      const mockResponse = { rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await jwt_token.deleteRefreshTokenFromDb("refresh-999");

      expect(result.rowCount).toBe(0);
    });

    it("should throw error on database failure", async () => {
      pool.query.mockRejectedValue(new Error("Database delete failed"));

      await expect(
        jwt_token.deleteRefreshTokenFromDb("refresh-123")
      ).rejects.toThrow("Database delete failed");
    });
  });

  describe("getRefreshTokenFromDB", () => {
    it("should return refresh token by id", async () => {
      const mockToken = {
        id: "refresh-123",
        user_id: "user-456",
        issue_time: new Date(),
        expires_in: new Date(),
      };
      const mockResponse = { rows: [mockToken], rowCount: 1 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await jwt_token.getRefreshTokenFromDB("refresh-123");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM"),
        ["refresh-123"]
      );
      expect(result.rows[0]).toEqual(mockToken);
    });

    it("should return empty result when token not found", async () => {
      const mockResponse = { rows: [], rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await jwt_token.getRefreshTokenFromDB("refresh-999");

      expect(result.rowCount).toBe(0);
    });

    it("should throw error on database failure", async () => {
      pool.query.mockRejectedValue(new Error("Database query failed"));

      await expect(
        jwt_token.getRefreshTokenFromDB("refresh-123")
      ).rejects.toThrow("Database query failed");
    });
  });

  describe("deleteRefreshTokenForUser", () => {
    it("should delete all refresh tokens for a user", async () => {
      const mockResponse = { rowCount: 3 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await jwt_token.deleteRefreshTokenForUser("user-456");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE user_id"),
        ["user-456"]
      );
      expect(result.rowCount).toBe(3);
    });

    it("should return 0 rowCount when user has no tokens", async () => {
      const mockResponse = { rowCount: 0 };
      pool.query.mockResolvedValue(mockResponse);

      const result = await jwt_token.deleteRefreshTokenForUser("user-999");

      expect(result.rowCount).toBe(0);
    });

    it("should throw error on database failure", async () => {
      pool.query.mockRejectedValue(new Error("Database delete failed"));

      await expect(
        jwt_token.deleteRefreshTokenForUser("user-456")
      ).rejects.toThrow("Database delete failed");
    });
  });
});
