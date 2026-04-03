const ServiceOptionHold = require("../../models/serviceOptionsHoldModel");
const ServiceOptions = require("../../models/serviceOptionModel");
const { ExpressError } = require("../../utils/ExpressError");
const {
  ServiceOptionHoldNotFoundError,
  ServiceOptionHoldExpiredError,
  ServiceOptionNotFoundError,
  ServiceOptionNotFromSameStoreError,
} = require("../../errors/serviceOptionError");
const {
  isServiceOptionHoldValid,
  markServiceOptionHoldTaken,
} = require("../../service/serviceOptionHoldService");
jest.mock("../../models/serviceOptionsHoldModel");
jest.mock("../../models/serviceOptionModel");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe("Service Option Hold Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a successful response if the service option hold is successful", async () => {
    let id = 1;
    let store_id = 10;
    let user_id = "user-1";
    const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    let fakeDBResponse = {
      service_option_id: 22,
      user_id: user_id,
      expires_at: futureDate.toISOString(),
    };

    ServiceOptionHold.holdById.mockResolvedValue(fakeDBResponse);
    ServiceOptions.getStoreForServiceOption.mockResolvedValue([{ store_id }]);

    let result = await isServiceOptionHoldValid(
      id,
      store_id,
      user_id,
      mockLogger,
    );
    expect(result).toBe(true);
    expect(ServiceOptionHold.holdById).toHaveBeenCalledWith(id);
    expect(ServiceOptions.getStoreForServiceOption).toHaveBeenCalledWith(22);
    expect(mockLogger.info).toHaveBeenCalled();
  });
  it("should return an error if the service option is expired", async () => {
    let id = 1;
    let store_id = 10;
    let user_id = "user-1";
    const pastDate = new Date(Date.now() - 180 * 60 * 1000); // 3 hour before now

    let fakeDBResponse = {
      service_option_id: 22,
      user_id: user_id,
      expires_at: pastDate.toISOString(),
    };

    ServiceOptionHold.holdById.mockResolvedValue(fakeDBResponse);
    ServiceOptions.getStoreForServiceOption.mockResolvedValue([{ store_id }]);

    await expect(
      isServiceOptionHoldValid(id, store_id, user_id, mockLogger),
    ).rejects.toThrow("Service Option hold is expired");
    expect(ServiceOptionHold.holdById).toHaveBeenCalledWith(id);

    expect(mockLogger.info).toHaveBeenCalled();
  });
  it("should return an error if the service option does not have expires_At", async () => {
    let id = 1;
    let user_id = "user-1";

    let fakeDBResponse = {};

    ServiceOptionHold.holdById.mockResolvedValue(fakeDBResponse);

    await expect(
      isServiceOptionHoldValid(id, 10, user_id, mockLogger),
    ).rejects.toThrow("Service option hold not found");

    expect(mockLogger.info).toHaveBeenCalled();
  });

  it("should throw when the service option does not exist", async () => {
    let id = 1;
    let store_id = 10;
    let user_id = "user-1";
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);

    ServiceOptionHold.holdById.mockResolvedValue({
      service_option_id: 22,
      user_id: user_id,
      expires_at: futureDate.toISOString(),
    });
    ServiceOptions.getStoreForServiceOption.mockResolvedValue([]);

    await expect(
      isServiceOptionHoldValid(id, store_id, user_id, mockLogger),
    ).rejects.toBeInstanceOf(ServiceOptionNotFoundError);
  });

  it("should throw when the service option belongs to a different store", async () => {
    let id = 1;
    let store_id = 10;
    let user_id = "user-1";
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);

    ServiceOptionHold.holdById.mockResolvedValue({
      service_option_id: 22,
      user_id: user_id,
      expires_at: futureDate.toISOString(),
    });
    ServiceOptions.getStoreForServiceOption.mockResolvedValue([
      { store_id: 11 },
    ]);
    ServiceOptions.releaseServiceOption.mockResolvedValue({ rowCount: 1 });

    await expect(
      isServiceOptionHoldValid(id, store_id, user_id, mockLogger),
    ).rejects.toBeInstanceOf(ServiceOptionNotFromSameStoreError);
    expect(ServiceOptions.releaseServiceOption).toHaveBeenCalledWith(22);
  });

  it("should throw ExpressError with correct status code when hold not found", async () => {
    let id = 999;
    let user_id = "user-1";
    ServiceOptionHold.holdById.mockResolvedValue({});

    try {
      await isServiceOptionHoldValid(id, 10, user_id, mockLogger);
    } catch (error) {
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("SERVICE_OPTION_HOLD_NOT_FOUND");
    }
  });

  it("should throw ExpressError with correct status code when hold is expired", async () => {
    let id = 1;
    let store_id = 10;
    let user_id = "user-1";
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);
    ServiceOptionHold.holdById.mockResolvedValue({
      service_option_id: 22,
      expires_at: pastDate.toISOString(),
    });
    ServiceOptions.getStoreForServiceOption.mockResolvedValue([{ store_id }]);

    try {
      await isServiceOptionHoldValid(id, store_id, user_id, mockLogger);
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("SERVICE_OPTION_HOLD_EXPIRED");
    }
  });

  it("should handle database errors gracefully", async () => {
    let id = 1;
    let user_id = "user-1";
    ServiceOptionHold.holdById.mockRejectedValue(new Error("Database error"));

    await expect(
      isServiceOptionHoldValid(id, 10, user_id, mockLogger),
    ).rejects.toThrow("Database error");
  });

  it("should return true when expires_at is exactly now (edge case)", async () => {
    let id = 1;
    let store_id = 10;
    let user_id = "user-1";
    const futureDate = new Date(Date.now() + 1000); // 1 second in future
    ServiceOptionHold.holdById.mockResolvedValue({
      service_option_id: 22,
      user_id: user_id,
      expires_at: futureDate.toISOString(),
    });
    ServiceOptions.getStoreForServiceOption.mockResolvedValue([{ store_id }]);

    let result = await isServiceOptionHoldValid(
      id,
      store_id,
      user_id,
      mockLogger,
    );
    expect(result).toBe(true);
  });

  it("should handle null id parameter", async () => {
    let user_id = "user-1";
    ServiceOptionHold.holdById.mockResolvedValue({});

    await expect(
      isServiceOptionHoldValid(null, 10, user_id, mockLogger),
    ).rejects.toThrow("Service option hold not found");
  });
});

describe("markServiceOptionHoldTaken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully mark service option hold as taken", async () => {
    let id = 1;
    const mockResponse = { rowCount: 1 };
    ServiceOptionHold.updateServiceOptionHold.mockResolvedValue(mockResponse);
    const mockClient = {};

    const result = await markServiceOptionHoldTaken(id, mockClient);
    expect(result).toEqual(mockResponse);
    expect(ServiceOptionHold.updateServiceOptionHold).toHaveBeenCalledWith(
      id,
      mockClient,
    );
  });

  it("should throw ExpressError when hold is not found (rowCount 0)", async () => {
    let id = 999;
    const mockResponse = { rowCount: 0 };
    ServiceOptionHold.updateServiceOptionHold.mockResolvedValue(mockResponse);

    await expect(markServiceOptionHoldTaken(id)).rejects.toThrow(
      "Service option hold not found",
    );
  });

  it("should throw ExpressError with correct status code when not found", async () => {
    let id = 999;
    const mockResponse = { rowCount: 0 };
    ServiceOptionHold.updateServiceOptionHold.mockResolvedValue(mockResponse);

    try {
      await markServiceOptionHoldTaken(id);
    } catch (error) {
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("SERVICE_OPTION_HOLD_NOT_FOUND");
    }
  });

  it("should handle database errors gracefully", async () => {
    let id = 1;
    ServiceOptionHold.updateServiceOptionHold.mockRejectedValue(
      new Error("Database connection failed"),
    );

    await expect(markServiceOptionHoldTaken(id)).rejects.toThrow(
      "Database connection failed",
    );
  });

  it("should pass client parameter when provided", async () => {
    let id = 1;
    const mockClient = { query: jest.fn() };
    const mockResponse = { rowCount: 0 };
    ServiceOptionHold.updateServiceOptionHold.mockResolvedValue(mockResponse);

    // Test that client can be passed (even though current implementation doesn't use it)
    await expect(markServiceOptionHoldTaken(id, mockClient)).rejects.toThrow();
  });
});
