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

describe("Get Service Options", () => {
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

describe("Reserve Service Options", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfuly reserve a service option when a valid id is passed and the option is available", async () => {
    let fakeServiceOptionId = 1;
    let fakeUserId = "abc";
    const fakeServiceOptionAvailability = [
      {
        available: true,
      },
    ];
    const fakeDbResponse = {
      rows: [
        {
          service_option_hold_id: 1,
        },
      ],
    };
    ServiceOptions.serviceOptionAvailableById.mockResolvedValue(
      fakeServiceOptionAvailability
    );
    ServiceOptions.reserveServiceOption.mockResolvedValue(fakeDbResponse);
    let result = await reserveServiceOption(fakeServiceOptionId, fakeUserId);
    expect(result).toEqual(fakeDbResponse.rows);
  });
  it("should throw an error if there is no response from the DB", async () => {
    let fakeServiceOptionId = 1;
    let fakeUserId = "abc";

    const fakeDbResponse = {
      rows: [],
    };

    await ServiceOptions.reserveServiceOption.mockResolvedValue(fakeDbResponse);

    await expect(
      reserveServiceOption(fakeServiceOptionId, fakeUserId)
    ).rejects.toThrow(
      "There was an error in reserving this service option. Please try another one"
    );
  });
});
