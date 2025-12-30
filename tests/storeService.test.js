const { Stores } = require("../models/storeModel");
const { getStores } = require("../service/storeService");

jest.mock("../models/storeModel");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
describe("store Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return a successful response if all the params are correct", async () => {
    const fakeZip = 94103;
    const fakeStreet = "Test";

    const fakeDbResponse = {
      rowCount: 1,
      rows: [
        {
          store_id: 1,
          zip_code: 94103,
          street: "Test",
        },
      ],
    };
    Stores.getStoresByZip.mockResolvedValue(fakeDbResponse);
    let result = await getStores(fakeZip, fakeStreet, mockLogger);
    expect(result).toEqual(fakeDbResponse);
    expect(Stores.getStoresByZip).toHaveBeenCalledWith(fakeZip, fakeStreet);
  });
  it("should throw an error if no stores found for zip_code", async () => {
    let fakeZip = 94103;
    let fakeStreet = "Test";

    let fakeDbResponse = {
      rowCount: 0,
      rows: [],
    };
    Stores.getStoresByZip.mockResolvedValue(fakeDbResponse);
    await expect(getStores(fakeZip, fakeStreet, mockLogger)).rejects.toThrow(
      "No stores for this zip"
    );
  });
});
