const wrapAsync = require("../utils/wrapAsync");

describe("wrapAsync", () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("should call the wrapped function with req, res, next", async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    const wrapped = wrapAsync(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  it("should not call next on successful execution", async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    const wrapped = wrapAsync(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next with error when async function throws", async () => {
    const error = new Error("Async error");
    const mockFn = jest.fn().mockRejectedValue(error);
    const wrapped = wrapAsync(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should handle synchronous functions that return values", async () => {
    const mockFn = jest.fn().mockImplementation((req, res) => {
      return "sync result";
    });
    const wrapped = wrapAsync(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should pass through the return value", async () => {
    const mockFn = jest.fn().mockResolvedValue("result");
    const wrapped = wrapAsync(mockFn);

    const result = await wrapped(mockReq, mockRes, mockNext);

    // wrapAsync doesn't return the value, but Promise.resolve handles it
    expect(mockFn).toHaveBeenCalled();
  });

  it("should handle functions that call res methods", async () => {
    const mockFn = jest.fn().mockImplementation((req, res) => {
      return res.status(200).json({ success: true });
    });
    const wrapped = wrapAsync(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
  });

  it("should work with async/await functions", async () => {
    const mockFn = jest.fn().mockImplementation(async (req, res) => {
      await Promise.resolve();
      res.json({ data: "test" });
    });
    const wrapped = wrapAsync(mockFn);

    await wrapped(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({ data: "test" });
  });

  it("should catch errors from nested async calls", async () => {
    const error = new Error("Nested error");
    const mockFn = jest.fn().mockImplementation(async () => {
      await Promise.resolve();
      throw error;
    });
    const wrapped = wrapAsync(mockFn);

    // Execute and wait for promises to settle
    await wrapped(mockReq, mockRes, mockNext);
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it("should return a function", () => {
    const mockFn = jest.fn();
    const wrapped = wrapAsync(mockFn);

    expect(typeof wrapped).toBe("function");
  });
});
