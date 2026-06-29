const { handleRunwareWebhook } = require("../../service/runwareService");
const Runware = require("../../models/runwareModel");

jest.mock("../../models/runwareModel");

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("Runware Service - handleRunwareWebhook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should persist each result in a data-shaped payload", async () => {
    Runware.addResult.mockResolvedValue({ rowCount: 1 });

    const payload = {
      data: [
        {
          taskUUID: "task-1",
          imageURL: "https://img.example/1.png",
          imageUUID: "img-1",
          seed: 11,
          cost: 0.01,
        },
        {
          taskUUID: "task-2",
          imageURL: "https://img.example/2.png",
          imageUUID: "img-2",
          seed: 22,
          cost: 0.02,
        },
      ],
    };

    await handleRunwareWebhook(payload, mockLogger);

    expect(Runware.addResult).toHaveBeenCalledTimes(2);
    expect(Runware.addResult).toHaveBeenCalledWith(
      "task-1",
      "https://img.example/1.png",
      "img-1",
      11,
      0.01,
    );
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("should log an error when a task is not found in the db (rowCount 0)", async () => {
    Runware.addResult.mockResolvedValue({ rowCount: 0 });

    const payload = {
      data: [
        {
          taskUUID: "missing-task",
          imageURL: "https://img.example/x.png",
          imageUUID: "img-x",
          seed: 1,
          cost: 0.01,
        },
      ],
    };

    await handleRunwareWebhook(payload, mockLogger);

    expect(mockLogger.error).toHaveBeenCalledWith(
      { task_id: "missing-task" },
      "Nothing updated in the db for this task",
    );
  });

  it("should log errors and not persist for an errors-shaped payload", async () => {
    const payload = {
      errors: [{ taskUUID: "task-err", code: "someError", message: "boom" }],
    };

    await handleRunwareWebhook(payload, mockLogger);

    expect(Runware.addResult).not.toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith(
      { task_id: "task-err", code: "someError", message: "boom" },
      "Runware reported an error for task",
    );
  });

  it("should warn and not crash on a payload with no data array", async () => {
    await handleRunwareWebhook({}, mockLogger);

    expect(Runware.addResult).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("should warn and not crash on an empty data array", async () => {
    await handleRunwareWebhook({ data: [] }, mockLogger);

    expect(Runware.addResult).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("should not throw on a null/undefined payload", async () => {
    await expect(
      handleRunwareWebhook(undefined, mockLogger),
    ).resolves.not.toThrow();
    expect(Runware.addResult).not.toHaveBeenCalled();
  });
});
