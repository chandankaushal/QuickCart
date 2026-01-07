const { validateEmail } = require("../../utils/validEmail");

describe("validateEmail", () => {
  it("should return true for valid email", () => {
    const email = "chandan@test.com";
    const result = validateEmail(email);

    expect(result).toBe(true);
  });
  it("should return false for invalid emails", () => {
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("missing@")).toBe(false);
  });
});
