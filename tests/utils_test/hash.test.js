const { hashPassword, comparePassword } = require("../../utils/hash");
const bcrypt = require("bcrypt");

describe("Hash Utils", () => {
  describe("hashPassword", () => {
    it("should hash a plain text password", async () => {
      const plainPassword = "mySecretPassword123";

      const hashedPassword = await hashPassword(plainPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it("should create different hashes for same password", async () => {
      const plainPassword = "mySecretPassword123";

      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2); // Different salts = different hashes
    });

    it("should use default salt rounds of 10", async () => {
      const plainPassword = "test";
      const hashedPassword = await hashPassword(plainPassword);

      // bcrypt hash format includes salt rounds info
      expect(hashedPassword).toMatch(/^\$2[aby]\$10\$/);
    });

    it("should respect custom salt rounds", async () => {
      const plainPassword = "test";
      const hashedPassword = await hashPassword(plainPassword, 12);

      expect(hashedPassword).toMatch(/^\$2[aby]\$12\$/);
    });

    it("should handle empty string password", async () => {
      const hashedPassword = await hashPassword("");

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it("should handle special characters in password", async () => {
      const specialPassword = "P@$$w0rd!#%^&*()_+-=[]{}|;':\",./<>?`~";

      const hashedPassword = await hashPassword(specialPassword);

      expect(hashedPassword).toBeDefined();
    });

    it("should handle unicode characters", async () => {
      const unicodePassword = "密码🔐パスワード";

      const hashedPassword = await hashPassword(unicodePassword);

      expect(hashedPassword).toBeDefined();
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching password", async () => {
      const plainPassword = "mySecretPassword123";
      const hashedPassword = await hashPassword(plainPassword);

      const result = await comparePassword(plainPassword, hashedPassword);

      expect(result).toBe(true);
    });

    it("should return false for non-matching password", async () => {
      const plainPassword = "mySecretPassword123";
      const wrongPassword = "wrongPassword";
      const hashedPassword = await hashPassword(plainPassword);

      const result = await comparePassword(wrongPassword, hashedPassword);

      expect(result).toBe(false);
    });

    it("should return false for similar but different passwords", async () => {
      const plainPassword = "Password123";
      const similarPassword = "password123"; // lowercase 'p'
      const hashedPassword = await hashPassword(plainPassword);

      const result = await comparePassword(similarPassword, hashedPassword);

      expect(result).toBe(false);
    });

    it("should handle empty password comparison", async () => {
      const emptyPassword = "";
      const hashedPassword = await hashPassword(emptyPassword);

      const result = await comparePassword(emptyPassword, hashedPassword);

      expect(result).toBe(true);
    });

    it("should handle special characters in comparison", async () => {
      const specialPassword = "P@$$w0rd!#%^&*()";
      const hashedPassword = await hashPassword(specialPassword);

      const result = await comparePassword(specialPassword, hashedPassword);

      expect(result).toBe(true);
    });

    it("should return false for invalid hash format", async () => {
      const plainPassword = "test";
      const invalidHash = "not-a-valid-hash";

      const result = await comparePassword(plainPassword, invalidHash);

      expect(result).toBe(false);
    });
  });
});
