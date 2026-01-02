const { Stores } = require("../models/storeModel");

const {
  isServiceOptionHoldValid,
  markServiceOptionHoldTaken,
} = require("../service/serviceOptionHoldService");
const Order = require("../models/orderModel");
const {
  checkProductStock,
  updateQtyinDb,
} = require("../service/productService");
const { create_pickup_order } = require("../service/orderService");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

jest.mock("../models/orderModel");
jest.mock("../models/storeModel");
jest.mock("../service/serviceOptionHoldService");
jest.mock("../service/productService");

describe("Create Order Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should return a successful response if an order is created", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";
    let isServiceOptionHoldValidResponse = true;
    let checkProductStockResponse = {
      data: {
        upc: 123,
        status: "ok",
        available: 1,
        requested: 1,
      },
      problems: false,
    };

    let getStoreByIdDBresponse = {
      rowCount: 1,
      rows: [
        {
          id: store_id,
        },
      ],
    };
    let pickupOrderDBresponse = {
      rowCount: 1,
      command: "INSERT",
      rows: [
        {
          order: fakeOrderId,
        },
      ],
    };
    let markServiceOptionHoldTakenResponse = {
      rowCount: 1,
      rows: [
        {
          service_option_id: 1,
        },
      ],
    };
    let updateQtyinDbResponse = {
      rowCount: 1,
      rows: [
        {
          upc: 1,
        },
      ],
    };

    Stores.getStoreById.mockResolvedValue(getStoreByIdDBresponse);
    isServiceOptionHoldValid.mockResolvedValue(
      isServiceOptionHoldValidResponse
    );
    checkProductStock.mockResolvedValue(checkProductStockResponse);
    markServiceOptionHoldTaken.mockResolvedValue(
      markServiceOptionHoldTakenResponse
    );
    updateQtyinDb.mockResolvedValue(updateQtyinDbResponse);
    Order.pickupOrder.mockResolvedValue(pickupOrderDBresponse);

    let result = await create_pickup_order(
      fakeOrderId,
      store_id,
      service_option_hold_id,
      items,
      user_id,
      mockLogger
    );
    // console.log(result);
    expect(result).toEqual({
      rowCount: 1,
      command: "INSERT",
      rows: [{ order: "abc123" }],
    });
    expect(Order.pickupOrder).toHaveBeenCalledWith(
      fakeOrderId,
      store_id,
      service_option_hold_id,
      user_id
    );

    expect(updateQtyinDb).toHaveBeenCalledWith(items, store_id);
    expect(markServiceOptionHoldTaken).toHaveBeenCalledWith(
      service_option_hold_id
    );
    expect(checkProductStock).toHaveBeenCalledWith(items, store_id);
    expect(isServiceOptionHoldValid).toHaveBeenCalledWith(
      service_option_hold_id
    );
    expect(Stores.getStoreById).toHaveBeenCalledWith(store_id);
  });
  it("should return an error when invalid store_id is passed", async () => {
    let fakeOrderId = "abc123";
    let store_id = "test";
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";
    let isServiceOptionHoldValidResponse = true;

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger
      )
    ).rejects.toThrow("Invalid store id");

    expect(checkProductStock).not.toHaveBeenCalled();
    expect(isServiceOptionHoldValid).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
  });
  it("should return an error when invalid store_id float is passed", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1.5;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";
    let isServiceOptionHoldValidResponse = true;

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger
      )
    ).rejects.toThrow("Invalid store id");

    expect(checkProductStock).not.toHaveBeenCalled();
    expect(isServiceOptionHoldValid).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
  });
  it("should return an error when store is not found", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";
    let storeDBResponse = [];

    Stores.getStoreById.mockResolvedValue(storeDBResponse); // ✅ returns empty array

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger
      )
    ).rejects.toThrow("No Stores found for this location code");

    expect(Stores.getStoreById).toHaveBeenCalledWith(store_id);
    expect(checkProductStock).not.toHaveBeenCalled();
    expect(isServiceOptionHoldValid).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
  });
});

// Other test cases to add
// //Hold Validation Errors
// Expired service option hold — isServiceOptionHoldValid throws error
// Product Stock Errors
// No items available — checkProductStock throws error
// Insufficient stock — checkProductStock returns { problems: true, data: [...] }
// Database Operation Errors
// markServiceOptionHoldTaken fails — throws error
// updateQtyinDb fails — throws error
// Order insert fails — pickupOrder returns rowCount: 0
// Edge Cases
// Empty items array — depends on expected behavior
// String store_id that converts to valid number — e.g., "123" should work
