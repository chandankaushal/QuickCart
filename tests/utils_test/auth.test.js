const jwt = require("jsonwebtoken");
const jwt_token = require("../../models/jwtTokenModel");
const {
  getToken,
  refreshToken,
  storeTokenInDB,
  storeRefreshTokenInDB,
} = require("../../utils/auth");

jest.mock("../../models/jwtTokenModel");

// Set up environment variables for tests
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe("Auth Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getToken", () => {
    it("should generate a valid JWT token", () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };

      const token = getToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should include user id, email, and role in token payload", () => {
      const user = { id: "user-123", email: "test@example.com", role: "admin" };

      const token = getToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.id).toBe("user-123");
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.role).toBe("admin");
    });

    it("should include jti (JWT ID) in token", () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };

      const token = getToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.jti).toBeDefined();
    });

    it("should generate unique jti for each token", () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };

      const token1 = getToken(user);
      const token2 = getToken(user);
      const decoded1 = jwt.decode(token1);
      const decoded2 = jwt.decode(token2);

      expect(decoded1.jti).not.toBe(decoded2.jti);
    });

    it("should include expiration time", () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };

      const token = getToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it("should be verifiable with the secret", () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };

      const token = getToken(user);

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).not.toThrow();
    });
  });

  describe("refreshToken", () => {
    it("should generate a valid refresh token", () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };

      const token = refreshToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);
    });

    it("should include user id, email, and role in token payload", () => {
      const user = { id: "user-123", email: "test@example.com", role: "admin" };

      const token = refreshToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.id).toBe("user-123");
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.role).toBe("admin");
    });

    it("should be verifiable with refresh secret", () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };

      const token = refreshToken(user);

      expect(() => {
        jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      }).not.toThrow();
    });

    it("should not be verifiable with regular JWT secret", () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };

      const token = refreshToken(user);

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe("storeTokenInDB", () => {
    it("should store token in database", async () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };
      const token = getToken(user);
      jwt_token.addToDB.mockResolvedValue({ rowCount: 1 });

      const result = await storeTokenInDB(token);

      expect(result).toBe(true);
      expect(jwt_token.addToDB).toHaveBeenCalled();
    });

    it("should extract correct data from token", async () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };
      const token = getToken(user);
      const decoded = jwt.decode(token);
      jwt_token.addToDB.mockResolvedValue({ rowCount: 1 });

      await storeTokenInDB(token);

      expect(jwt_token.addToDB).toHaveBeenCalledWith(
        decoded.jti,
        decoded.id,
        expect.any(Date),
        expect.any(Date),
      );
    });

    it("should throw error for invalid token", async () => {
      const invalidToken = "invalid.token.here";

      await expect(storeTokenInDB(invalidToken)).rejects.toThrow(
        "Internal Server Error",
      );
    });

    it("should throw error for token without id", async () => {
      const tokenWithoutId = jwt.sign({ email: "test@example.com" }, "secret", {
        jwtid: "123",
      });

      await expect(storeTokenInDB(tokenWithoutId)).rejects.toThrow(
        "Internal Server Error",
      );
    });

    it("should throw error for token without jti", async () => {
      const tokenWithoutJti = jwt.sign(
        { id: "user-123", email: "test@example.com" },
        "secret",
      );

      await expect(storeTokenInDB(tokenWithoutJti)).rejects.toThrow(
        "Internal Server Error",
      );
    });

    it("should handle database errors", async () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };
      const token = getToken(user);
      jwt_token.addToDB.mockRejectedValue(new Error("Database error"));

      await expect(storeTokenInDB(token)).rejects.toThrow("Database error");
    });
  });

  describe("storeRefreshTokenInDB", () => {
    it("should store refresh token in database", async () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };
      const token = refreshToken(user);
      jwt_token.addRefeshToDB.mockResolvedValue({ rowCount: 1 });

      const result = await storeRefreshTokenInDB(token, mockLogger);

      expect(result).toBe(true);
      expect(jwt_token.addRefeshToDB).toHaveBeenCalled();
    });

    it("should throw error for invalid token", async () => {
      const invalidToken = "invalid.token.here";

      await expect(
        storeRefreshTokenInDB(invalidToken, mockLogger),
      ).rejects.toThrow("Invalid token: missing required fields");
    });

    it("should throw ExpressError on database failure", async () => {
      const user = { id: "user-123", email: "test@example.com", role: "user" };
      const token = refreshToken(user);
      jwt_token.addRefeshToDB.mockRejectedValue(new Error("DB error"));

      await expect(storeRefreshTokenInDB(token, mockLogger)).rejects.toThrow(
        "Internal Server Error",
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
