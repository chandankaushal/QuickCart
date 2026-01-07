const pool = require("../../db");
const withTransaction = require("../../utils/withTransaction");

jest.mock("../db");

describe("withTransaction", () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };

    pool.connect.mockResolvedValue(mockClient);
  });

  it("should execute work function within a transaction", async () => {
    const workFn = jest.fn().mockResolvedValue("result");

    const result = await withTransaction(workFn);

    expect(result).toBe("result");
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    expect(workFn).toHaveBeenCalledWith(mockClient);
  });

  it("should rollback on error", async () => {
    const error = new Error("Work failed");
    const workFn = jest.fn().mockRejectedValue(error);

    await expect(withTransaction(workFn)).rejects.toThrow("Work failed");

    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.query).not.toHaveBeenCalledWith("COMMIT");
  });

  it("should release client after successful transaction", async () => {
    const workFn = jest.fn().mockResolvedValue("result");

    await withTransaction(workFn);

    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should release client after failed transaction", async () => {
    const workFn = jest.fn().mockRejectedValue(new Error("Failed"));

    await expect(withTransaction(workFn)).rejects.toThrow();

    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should call BEGIN before work function", async () => {
    const callOrder = [];
    mockClient.query.mockImplementation((query) => {
      callOrder.push(query);
      return Promise.resolve({});
    });
    const workFn = jest.fn().mockImplementation(() => {
      callOrder.push("work");
      return Promise.resolve("result");
    });

    await withTransaction(workFn);

    expect(callOrder).toEqual(["BEGIN", "work", "COMMIT"]);
  });

  it("should pass client to work function for queries", async () => {
    const workFn = jest.fn().mockImplementation(async (client) => {
      await client.query("SELECT * FROM users");
      await client.query("INSERT INTO logs VALUES ($1)", ["log"]);
      return "done";
    });

    await withTransaction(workFn);

    expect(mockClient.query).toHaveBeenCalledWith("SELECT * FROM users");
    expect(mockClient.query).toHaveBeenCalledWith(
      "INSERT INTO logs VALUES ($1)",
      ["log"]
    );
  });

  it("should handle connection errors", async () => {
    pool.connect.mockRejectedValue(new Error("Connection failed"));

    await expect(withTransaction(jest.fn())).rejects.toThrow(
      "Connection failed"
    );
  });

  it("should handle BEGIN query errors", async () => {
    mockClient.query.mockImplementation((query) => {
      if (query === "BEGIN") {
        return Promise.reject(new Error("BEGIN failed"));
      }
      return Promise.resolve({});
    });

    await expect(withTransaction(jest.fn())).rejects.toThrow("BEGIN failed");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should handle COMMIT query errors", async () => {
    mockClient.query.mockImplementation((query) => {
      if (query === "COMMIT") {
        return Promise.reject(new Error("COMMIT failed"));
      }
      return Promise.resolve({});
    });
    const workFn = jest.fn().mockResolvedValue("result");

    await expect(withTransaction(workFn)).rejects.toThrow("COMMIT failed");
    expect(mockClient.release).toHaveBeenCalled();
  });

  it("should return complex data from work function", async () => {
    const complexResult = {
      users: [{ id: 1 }, { id: 2 }],
      count: 2,
      nested: { data: "value" },
    };
    const workFn = jest.fn().mockResolvedValue(complexResult);

    const result = await withTransaction(workFn);

    expect(result).toEqual(complexResult);
  });

  it("should handle undefined return from work function", async () => {
    const workFn = jest.fn().mockResolvedValue(undefined);

    const result = await withTransaction(workFn);

    expect(result).toBeUndefined();
  });
});
