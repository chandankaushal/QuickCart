const isServiceOptionHoldOwner = require("../../utils/isServiceOptionHoldOwner");
const {
  ServiceOptionHoldNotFoundError,
} = require("../../errors/serviceOptionError");

describe("isServiceOptionHoldOwner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when the hold belongs to the user", async () => {
    await expect(isServiceOptionHoldOwner("user-1", "user-1")).resolves.toBe(
      true,
    );
  });

  it("throws not found when the hold belongs to a different user", async () => {
    await expect(
      isServiceOptionHoldOwner("user-2", "user-1"),
    ).rejects.toBeInstanceOf(ServiceOptionHoldNotFoundError);
  });

  it("throws not found when the hold user id is missing", async () => {
    await expect(
      isServiceOptionHoldOwner(undefined, "user-1"),
    ).rejects.toBeInstanceOf(ServiceOptionHoldNotFoundError);
  });
});
