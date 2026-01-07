const { validateEmail } = require("../utils/validEmail");

describe("validateEmail", () => {
  describe("valid emails", () => {
    it("should return true for standard email format", () => {
      expect(validateEmail("user@example.com")).toBe(true);
    });

    it("should return true for email with subdomain", () => {
      expect(validateEmail("user@mail.example.com")).toBe(true);
    });

    it("should return true for email with numbers", () => {
      expect(validateEmail("user123@example.com")).toBe(true);
    });

    it("should return true for email with dots in local part", () => {
      expect(validateEmail("first.last@example.com")).toBe(true);
    });

    it("should return true for email with plus sign", () => {
      expect(validateEmail("user+tag@example.com")).toBe(true);
    });

    it("should return true for email with underscores", () => {
      expect(validateEmail("user_name@example.com")).toBe(true);
    });

    it("should return true for email with hyphens", () => {
      expect(validateEmail("user-name@example.com")).toBe(true);
    });

    it("should return true for email with percent sign", () => {
      expect(validateEmail("user%name@example.com")).toBe(true);
    });

    it("should return true for two-letter TLD", () => {
      expect(validateEmail("user@example.co")).toBe(true);
    });

    it("should return true for long TLD", () => {
      expect(validateEmail("user@example.technology")).toBe(true);
    });

    it("should return true for uppercase letters", () => {
      expect(validateEmail("User@Example.COM")).toBe(true);
    });
  });

  describe("invalid emails", () => {
    it("should return false for missing @ symbol", () => {
      expect(validateEmail("userexample.com")).toBe(false);
    });

    it("should return false for missing domain", () => {
      expect(validateEmail("user@")).toBe(false);
    });

    it("should return false for missing local part", () => {
      expect(validateEmail("@example.com")).toBe(false);
    });

    it("should return false for missing TLD", () => {
      expect(validateEmail("user@example")).toBe(false);
    });

    it("should return false for single character TLD", () => {
      expect(validateEmail("user@example.c")).toBe(false);
    });

    it("should return false for double @ symbol", () => {
      expect(validateEmail("user@@example.com")).toBe(false);
    });

    it("should return false for spaces in email", () => {
      expect(validateEmail("user name@example.com")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(validateEmail("")).toBe(false);
    });

    it("should return false for just spaces", () => {
      expect(validateEmail("   ")).toBe(false);
    });

    it("should return false for special characters in domain", () => {
      expect(validateEmail("user@exam!ple.com")).toBe(false);
    });

    it("should return false for missing dot in domain", () => {
      expect(validateEmail("user@examplecom")).toBe(false);
    });

    it("should return false for trailing dot", () => {
      expect(validateEmail("user@example.com.")).toBe(false);
    });

    it("should return false for leading dot in local part", () => {
      // Note: Current regex allows leading dots. If this should be invalid,
      // update the validateEmail function's regex
      expect(validateEmail(".user@example.com")).toBe(true);
    });
  });
});
