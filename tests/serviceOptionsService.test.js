const ServiceOptions = require("../models/serviceOptionModel");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");
const {
  getServiceOptions,
  reserveServiceOption,
} = require("../service/serviceOptionsService");

jest.mock("../models/serviceOptionModel");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe("Service Option Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return service options when service options exists", async () => {
    const fakeStoreId = 1;
    const fakeDBResponse = {
      rowCount: 1,
      rows: [
        {
          service_option_id: 1,
          starts_at: "10",
          ends_at: "11",
        },
      ],
    };
    ServiceOptions.getServiceOptions.mockResolvedValue(fakeDBResponse);
    let result = await getServiceOptions(fakeStoreId, mockLogger);

    expect(result).toEqual(fakeDBResponse.rows);
    expect(ServiceOptions.getServiceOptions).toHaveBeenCalledWith(fakeStoreId);
  });
  it("should throw an error if no service options exist", async () => {
    const fakeStoreId = 1;
    const fakeDBResponse = {
      rowCount: 0,
      rows: [],
    };
    ServiceOptions.getServiceOptions.mockResolvedValue(fakeDBResponse);
    await expect(getServiceOptions(fakeStoreId, mockLogger)).rejects.toThrow(
      "No service Options for this store"
    );
  });
});
