const { Stores } = require("../../models/storeModel");

const {
  isServiceOptionHoldValid,
  markServiceOptionHoldTaken,
} = require("../../service/serviceOptionHoldService");
const Order = require("../../models/orderModel");
const {
  checkProductStock,
  updateQtyinDb,
} = require("../../service/productService");
const { create_pickup_order } = require("../../service/orderService");
const withTransaction = require("../../utils/withTransaction");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const OrderItems = require("../../models/orderItemsModel");
const calculateOrderTotal = require("../../service/calculateOrderTotal");
const sendToQueue = require("../../queues/sendToQueue");

jest.mock("../../models/orderModel");
jest.mock("../../models/storeModel");
jest.mock("../../service/serviceOptionHoldService");
jest.mock("../../service/productService");
jest.mock("../../utils/withTransaction");
jest.mock("../../models/orderItemsModel");
jest.mock("../../service/calculateOrderTotal");
jest.mock("../../queues/sendToQueue");
const mockClient = {};

describe("Create Order Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withTransaction.mockImplementation(async (callback) => {
      return await callback(mockClient);
    });
    OrderItems.addItems.mockResolvedValue({ rowCount: 1 });
    calculateOrderTotal.mockResolvedValue(100);
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
    let sendToQueueResponse = {
      messageId: "TEST",
    };

    Stores.getStoreById.mockResolvedValue(getStoreByIdDBresponse);
    isServiceOptionHoldValid.mockResolvedValue(
      isServiceOptionHoldValidResponse,
    );
    checkProductStock.mockResolvedValue(checkProductStockResponse);
    markServiceOptionHoldTaken.mockResolvedValue(
      markServiceOptionHoldTakenResponse,
    );
    updateQtyinDb.mockResolvedValue(updateQtyinDbResponse);
    Order.pickupOrder.mockResolvedValue(pickupOrderDBresponse);
    sendToQueue.mockResolvedValue(sendToQueueResponse);

    let result = await create_pickup_order(
      fakeOrderId,
      store_id,
      service_option_hold_id,
      items,
      user_id,
      mockLogger,
    );
    let orderObj = {
      id: fakeOrderId,
      service_type: "pickup",
      user_id: user_id,
      state: "brand_new",
      service_option_hold_id: service_option_hold_id,
      created_at: new Date().toISOString(),
    };
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
      user_id,
      100,
      mockClient,
    );

    expect(updateQtyinDb).toHaveBeenCalledWith(items, store_id, mockClient);
    expect(markServiceOptionHoldTaken).toHaveBeenCalledWith(
      service_option_hold_id,
      mockClient,
    );
    expect(checkProductStock).toHaveBeenCalledWith(items, store_id);
    expect(isServiceOptionHoldValid).toHaveBeenCalledWith(
      service_option_hold_id,
    );
    expect(Stores.getStoreById).toHaveBeenCalledWith(store_id);
    expect(sendToQueue).toHaveBeenCalledWith(orderObj, "CREATE_ORDER");
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
        mockLogger,
      ),
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
        mockLogger,
      ),
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
        mockLogger,
      ),
    ).rejects.toThrow("No Stores found for this location code");

    expect(Stores.getStoreById).toHaveBeenCalledWith(store_id);
    expect(checkProductStock).not.toHaveBeenCalled();
    expect(isServiceOptionHoldValid).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
  });
  // Hold Validation Errors
  it("should throw error when hold is expired", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";

    Stores.getStoreById.mockResolvedValue([{ id: store_id }]);
    isServiceOptionHoldValid.mockRejectedValue(new Error("Hold has expired"));

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger,
      ),
    ).rejects.toThrow("Hold has expired");

    expect(Stores.getStoreById).toHaveBeenCalledWith(store_id);
    expect(isServiceOptionHoldValid).toHaveBeenCalledWith(
      service_option_hold_id,
    );
    expect(checkProductStock).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
    expect(Order.pickupOrder).not.toHaveBeenCalled();
  });

  // Product Stock Errors
  it("should throw error when checkProductStock fails", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";

    Stores.getStoreById.mockResolvedValue([{ id: store_id }]);
    isServiceOptionHoldValid.mockResolvedValue(true);
    checkProductStock.mockRejectedValue(new Error("Product not found"));

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger,
      ),
    ).rejects.toThrow("Product not found");

    expect(checkProductStock).toHaveBeenCalledWith(items, store_id);
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
    expect(Order.pickupOrder).not.toHaveBeenCalled();
  });

  it("should throw error when insufficient stock", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [{ upc: 123, qty: 5 }];
    let user_id = "test User";

    Stores.getStoreById.mockResolvedValue([{ id: store_id }]);
    isServiceOptionHoldValid.mockResolvedValue(true);
    checkProductStock.mockResolvedValue({
      problems: true,
      data: [{ upc: 123, status: "insufficient", available: 2, requested: 5 }],
    });

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger,
      ),
    ).rejects.toThrow("UPC 123");

    expect(checkProductStock).toHaveBeenCalledWith(items, store_id);
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
    expect(Order.pickupOrder).not.toHaveBeenCalled();
  });

  // Database Operation Errors
  it("should throw error when markServiceOptionHoldTaken fails", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";

    Stores.getStoreById.mockResolvedValue([{ id: store_id }]);
    isServiceOptionHoldValid.mockResolvedValue(true);
    checkProductStock.mockResolvedValue({ problems: false, data: [] });
    markServiceOptionHoldTaken.mockRejectedValue(
      new Error("Failed to mark hold as taken"),
    );

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger,
      ),
    ).rejects.toThrow("Failed to mark hold as taken");

    expect(markServiceOptionHoldTaken).toHaveBeenCalledWith(
      service_option_hold_id,
      mockClient,
    );
    expect(updateQtyinDb).not.toHaveBeenCalled();
    expect(Order.pickupOrder).not.toHaveBeenCalled();
  });

  it("should throw error when updateQtyinDb fails", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";

    Stores.getStoreById.mockResolvedValue([{ id: store_id }]);
    isServiceOptionHoldValid.mockResolvedValue(true);
    checkProductStock.mockResolvedValue({ problems: false, data: [] });
    markServiceOptionHoldTaken.mockResolvedValue({ rowCount: 1 });
    updateQtyinDb.mockRejectedValue(new Error("Failed to update stock"));

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger,
      ),
    ).rejects.toThrow("Failed to update stock");

    expect(updateQtyinDb).toHaveBeenCalledWith(items, store_id, mockClient);
    expect(Order.pickupOrder).not.toHaveBeenCalled();
  });

  it("should throw error when order insert fails", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";

    Stores.getStoreById.mockResolvedValue([{ id: store_id }]);
    isServiceOptionHoldValid.mockResolvedValue(true);
    checkProductStock.mockResolvedValue({ problems: false, data: [] });
    markServiceOptionHoldTaken.mockResolvedValue({ rowCount: 1 });
    updateQtyinDb.mockResolvedValue({ rowCount: 1 });
    Order.pickupOrder.mockResolvedValue({ rowCount: 0, command: "INSERT" });

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger,
      ),
    ).rejects.toThrow("There were some issues creating your order");

    expect(Order.pickupOrder).toHaveBeenCalledWith(
      fakeOrderId,
      store_id,
      service_option_hold_id,
      user_id,
      100,
      mockClient,
    );
  });

  // Edge Cases
  it("should work with string store_id that converts to valid number", async () => {
    let fakeOrderId = "abc123";
    let store_id = "123";
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";

    Stores.getStoreById.mockResolvedValue([{ id: 123 }]);
    isServiceOptionHoldValid.mockResolvedValue(true);
    checkProductStock.mockResolvedValue({ problems: false, data: [] });
    markServiceOptionHoldTaken.mockResolvedValue({ rowCount: 1 });
    updateQtyinDb.mockResolvedValue({ rowCount: 1 });
    Order.pickupOrder.mockResolvedValue({
      rowCount: 1,
      command: "INSERT",
      rows: [{ order: fakeOrderId }],
    });

    let result = await create_pickup_order(
      fakeOrderId,
      store_id,
      service_option_hold_id,
      items,
      user_id,
      mockLogger,
    );

    expect(result.rowCount).toBe(1);
    expect(Stores.getStoreById).toHaveBeenCalledWith(123); // converted to number
  });

  it("should throw error for null store_id", async () => {
    let fakeOrderId = "abc123";
    let store_id = null;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger,
      ),
    ).rejects.toThrow("Invalid store id");

    expect(Stores.getStoreById).not.toHaveBeenCalled();
  });

  it("should throw error for undefined store_id", async () => {
    let fakeOrderId = "abc123";
    let store_id = undefined;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        mockLogger,
      ),
    ).rejects.toThrow("Invalid store id");

    expect(Stores.getStoreById).not.toHaveBeenCalled();
  });
});
