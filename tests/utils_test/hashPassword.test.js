const { hashPassword } = require("../../utils/hash");

describe("hashPassword", () => {
  it("should hash a password", async () => {
    const password = "myPassword123";
    const hashed = await hashPassword(password);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    expect(typeof hashed).toBe("string");
  });
});
