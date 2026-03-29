const ServiceOptions = require("../../models/serviceOptionModel");
const {
  getServiceOptions,
  reserveServiceOption,
} = require("../../service/serviceOptionsService");

jest.mock("../../models/serviceOptionModel");

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
      "No service Options for this store",
    );
  });

  it("should propagate errors from the model when fetching service options", async () => {
    const fakeStoreId = 1;
    ServiceOptions.getServiceOptions.mockRejectedValue(new Error("DB failure"));

    await expect(getServiceOptions(fakeStoreId, mockLogger)).rejects.toThrow(
      "DB failure",
    );
    expect(ServiceOptions.getServiceOptions).toHaveBeenCalledWith(fakeStoreId);
  });
});

describe("Reserve Service Options", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully reserve a service option when a valid id is passed and the option is available", async () => {
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
      fakeServiceOptionAvailability,
    );
    ServiceOptions.reserveServiceOption.mockResolvedValue(fakeDbResponse);
    let result = await reserveServiceOption(
      fakeServiceOptionId,
      fakeUserId,
      mockLogger,
    );
    expect(result).toEqual(fakeDbResponse.rows);
    expect(ServiceOptions.serviceOptionAvailableById).toHaveBeenCalledWith(
      fakeServiceOptionId,
    );
    expect(ServiceOptions.reserveServiceOption).toHaveBeenCalledWith(
      fakeServiceOptionId,
      fakeUserId,
    );
  });
  it("should throw an error if there is no response for available", async () => {
    let fakeServiceOptionId = 1;
    let fakeUserId = "abc";
    let serviceOptionAvailableResponse = [];
    let fakeDBResponse = {
      service_option_hold_info: [
        {
          service_option_holf_id: 1,
          service_option_id: fakeServiceOptionId,
        },
      ],
    };
    ServiceOptions.serviceOptionAvailableById.mockResolvedValue(
      serviceOptionAvailableResponse,
    );
    ServiceOptions.reserveServiceOption.mockResolvedValue(fakeDBResponse);

    await expect(
      reserveServiceOption(fakeServiceOptionId, fakeUserId, mockLogger),
    ).rejects.toThrow("No service Options for this store");
    expect(ServiceOptions.reserveServiceOption).not.toHaveBeenCalled();
  });
  it("should throw an error if there the service option is not available", async () => {
    let fakeServiceOptionId = 1;
    let fakeUserId = "abc";
    let serviceOptionAvailableResponse = [
      {
        available: false,
      },
    ];
    let fakeDBResponse = {
      service_option_hold_info: [
        {
          service_option_holf_id: 1,
          service_option_id: fakeServiceOptionId,
        },
      ],
    };
    ServiceOptions.serviceOptionAvailableById.mockResolvedValue(
      serviceOptionAvailableResponse,
    );
    ServiceOptions.reserveServiceOption.mockResolvedValue(fakeDBResponse);

    await expect(
      reserveServiceOption(fakeServiceOptionId, fakeUserId, mockLogger),
    ).rejects.toThrow("This service Option is already taken");
    expect(ServiceOptions.reserveServiceOption).not.toHaveBeenCalled();
  });

  it("should throw an error if reserve returns no rows", async () => {
    let fakeServiceOptionId = 1;
    let fakeUserId = "abc";
    let serviceOptionAvailableResponse = [
      {
        available: true,
      },
    ];
    const emptyReserveResponse = { rows: [] };
    ServiceOptions.serviceOptionAvailableById.mockResolvedValue(
      serviceOptionAvailableResponse,
    );
    ServiceOptions.reserveServiceOption.mockResolvedValue(emptyReserveResponse);

    await expect(
      reserveServiceOption(fakeServiceOptionId, fakeUserId, mockLogger),
    ).rejects.toThrow("Internal Server Error");
    expect(ServiceOptions.reserveServiceOption).toHaveBeenCalledWith(
      fakeServiceOptionId,
      fakeUserId,
    );
  });

  it("should propagate errors when availability lookup fails", async () => {
    let fakeServiceOptionId = 1;
    let fakeUserId = "abc";
    ServiceOptions.serviceOptionAvailableById.mockRejectedValue(
      new Error("DB failure on availability"),
    );

    await expect(
      reserveServiceOption(fakeServiceOptionId, fakeUserId, mockLogger),
    ).rejects.toThrow("DB failure on availability");
    expect(ServiceOptions.reserveServiceOption).not.toHaveBeenCalled();
  });

  it("should propagate errors when reserve call fails", async () => {
    let fakeServiceOptionId = 1;
    let fakeUserId = "abc";
    let serviceOptionAvailableResponse = [
      {
        available: true,
      },
    ];
    ServiceOptions.serviceOptionAvailableById.mockResolvedValue(
      serviceOptionAvailableResponse,
    );
    ServiceOptions.reserveServiceOption.mockRejectedValue(
      new Error("DB failure on reserve"),
    );

    await expect(
      reserveServiceOption(fakeServiceOptionId, fakeUserId, mockLogger),
    ).rejects.toThrow("DB failure on reserve");
    expect(ServiceOptions.reserveServiceOption).toHaveBeenCalledWith(
      fakeServiceOptionId,
      fakeUserId,
    );
  });
});
