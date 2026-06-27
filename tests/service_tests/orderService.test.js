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
const {
  create_pickup_order,
  cancel_Order,
  update_order,
} = require("../../service/orderService");
const withTransaction = require("../../utils/withTransaction");
const { InternalServerError } = require("../../utils/ExpressError");
const {
  checkItemUpdate,
  performUpdates,
} = require("../../utils/checkItemUpdate");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const OrderItems = require("../../models/orderItemsModel");
const Product = require("../../models/productModel");
const calculateOrderTotal = require("../../service/calculateOrderTotal");
const sendToQueue = require("../../queues/sendToQueue");

jest.mock("../../models/orderModel");
jest.mock("../../models/storeModel");
jest.mock("../../service/serviceOptionHoldService");
jest.mock("../../service/productService");
jest.mock("../../utils/withTransaction");
jest.mock("../../models/orderItemsModel");
jest.mock("../../models/productModel");
jest.mock("../../service/calculateOrderTotal");
jest.mock("../../queues/sendToQueue");
jest.mock("../../utils/checkItemUpdate");
// Factory mock (not automock): avoids loading the real module, which would
// construct the Stripe client at import time and require STRIPE_API_KEY.
// create_pickup_order only calls this when collect_payment=true.
jest.mock("../../service/paymentService", () => jest.fn());
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
    let service_type = "pickup";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";
    let checkProductStockResponse = {
      data: {
        upc: 123,
        status: "ok",
        available: 1,
        requested: 1,
      },
      problems: false,
    };

    let getStoreByIdDBresponse = [{ id: store_id }];
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
    isServiceOptionHoldValid.mockResolvedValue(true);
    checkProductStock.mockResolvedValue(checkProductStockResponse);
    markServiceOptionHoldTaken.mockResolvedValue(
      markServiceOptionHoldTakenResponse,
    );
    updateQtyinDb.mockResolvedValue(updateQtyinDbResponse);
    Order.create.mockResolvedValue(pickupOrderDBresponse);
    sendToQueue.mockResolvedValue(sendToQueueResponse);

    let result = await create_pickup_order(
      fakeOrderId,
      store_id,
      service_option_hold_id,
      items,
      user_id,
      true,
      false,
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

    expect(result).toEqual({
      orderResponse: {
        rowCount: 1,
        command: "INSERT",
        rows: [{ order: "abc123" }],
      },
      order_total: 100,
    });
    expect(Order.create).toHaveBeenCalledWith(
      fakeOrderId,
      service_type,
      store_id,
      service_option_hold_id,
      user_id,
      100,
      "brand_new",
      mockClient,
    );

    expect(updateQtyinDb).toHaveBeenCalledWith(
      items,
      store_id,
      mockClient,
      mockLogger,
    );
    expect(markServiceOptionHoldTaken).toHaveBeenCalledWith(
      service_option_hold_id,
      mockClient,
    );
    expect(checkProductStock).toHaveBeenCalledWith(
      items,
      store_id,
      mockLogger,
      mockClient,
    );
    expect(isServiceOptionHoldValid).toHaveBeenCalledWith(
      service_option_hold_id,
      store_id,
      user_id,
      mockLogger,
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

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("No stores found");

    expect(checkProductStock).not.toHaveBeenCalled();
    expect(isServiceOptionHoldValid).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
  });

  it("should return an error when invalid store_id float is passed", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1.5;
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
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("No stores found");

    expect(checkProductStock).not.toHaveBeenCalled();
    expect(isServiceOptionHoldValid).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
  });

  it("should return an error when store is not found", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [123];
    let user_id = "test User";

    Stores.getStoreById.mockResolvedValue([]);

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("No stores found");

    expect(Stores.getStoreById).toHaveBeenCalledWith(store_id);
    expect(checkProductStock).not.toHaveBeenCalled();
    expect(isServiceOptionHoldValid).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
  });

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
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("Hold has expired");

    expect(Stores.getStoreById).toHaveBeenCalledWith(store_id);
    expect(isServiceOptionHoldValid).toHaveBeenCalledWith(
      service_option_hold_id,
      store_id,
      user_id,
      mockLogger,
    );
    expect(checkProductStock).not.toHaveBeenCalled();
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
    expect(Order.create).not.toHaveBeenCalled();
  });

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
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("Product not found");

    expect(checkProductStock).toHaveBeenCalledWith(
      items,
      store_id,
      mockLogger,
      mockClient,
    );
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
    expect(Order.create).not.toHaveBeenCalled();
  });

  it("should throw error when insufficient stock", async () => {
    let fakeOrderId = "abc123";
    let store_id = 1;
    let service_option_hold_id = 123;
    let items = [{ upc: 123, qty: 5 }];
    let user_id = "test User";

    Stores.getStoreById.mockResolvedValue([{ id: store_id }]);
    isServiceOptionHoldValid.mockResolvedValue(true);
    checkProductStock.mockRejectedValue(new Error("UPC 123"));

    await expect(
      create_pickup_order(
        fakeOrderId,
        store_id,
        service_option_hold_id,
        items,
        user_id,
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("UPC 123");

    expect(checkProductStock).toHaveBeenCalledWith(
      items,
      store_id,
      mockLogger,
      mockClient,
    );
    expect(markServiceOptionHoldTaken).not.toHaveBeenCalled();
    expect(updateQtyinDb).not.toHaveBeenCalled();
    expect(Order.create).not.toHaveBeenCalled();
  });

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
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("Failed to mark hold as taken");

    expect(markServiceOptionHoldTaken).toHaveBeenCalledWith(
      service_option_hold_id,
      mockClient,
    );
    expect(updateQtyinDb).not.toHaveBeenCalled();
    expect(Order.create).not.toHaveBeenCalled();
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
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("Failed to update stock");

    expect(updateQtyinDb).toHaveBeenCalledWith(
      items,
      store_id,
      mockClient,
      mockLogger,
    );
    expect(Order.create).not.toHaveBeenCalled();
  });

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
    Order.create.mockResolvedValue({
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
      false,
      false,
      mockLogger,
    );

    expect(result.orderResponse.rowCount).toBe(1);
    expect(Stores.getStoreById).toHaveBeenCalledWith(123);
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
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("No stores found");

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
        false,
        false,
        mockLogger,
      ),
    ).rejects.toThrow("No stores found");

    expect(Stores.getStoreById).not.toHaveBeenCalled();
  });
});

describe("Cancel Order Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withTransaction.mockImplementation(async (callback) => {
      return await callback(mockClient);
    });
  });

  it("should cancel order and skip webhook when needsWebhook is false", async () => {
    const order_id = "abc123";
    const items = [{ upc: 123, qty: 1 }];
    const transitionResponse = { rowCount: 1 };

    Order.getStateById.mockResolvedValue({
      rowCount: 1,
      rows: [{ state: "brand_new" }],
    });
    OrderItems.getItems.mockResolvedValue(items);
    Order.transitionStateById.mockResolvedValue(transitionResponse);
    OrderItems.deleteOrder.mockResolvedValue({ rowCount: 1 });
    Product.addProducts.mockResolvedValue({ rowCount: 1 });

    const result = await cancel_Order(order_id, false, mockLogger);

    expect(result).toEqual(transitionResponse);
    expect(sendToQueue).not.toHaveBeenCalled();
    expect(Order.transitionStateById).toHaveBeenCalledWith(
      order_id,
      "cancelled",
      mockClient,
    );
  });

  it("should cancel order and send webhook when needsWebhook is true", async () => {
    const order_id = "abc123";
    const items = [{ upc: 123, qty: 1 }];
    const transitionResponse = { rowCount: 1 };

    Order.getStateById.mockResolvedValue({
      rowCount: 1,
      rows: [{ state: "brand_new" }],
    });
    OrderItems.getItems.mockResolvedValue(items);
    Order.transitionStateById.mockResolvedValue(transitionResponse);
    OrderItems.deleteOrder.mockResolvedValue({ rowCount: 1 });
    Product.addProducts.mockResolvedValue({ rowCount: 1 });
    sendToQueue.mockResolvedValue({ messageId: "queue-1" });

    const result = await cancel_Order(order_id, true, mockLogger);

    expect(result).toEqual(transitionResponse);
    expect(sendToQueue).toHaveBeenCalledWith(
      { id: order_id, state: "cancelled" },
      "UPDATE_ORDER",
    );
  });

  it("should throw OrderNotFoundError when order does not exist", async () => {
    const order_id = "abc123";
    Order.getStateById.mockResolvedValue({ rowCount: 0, rows: [] });

    await expect(cancel_Order(order_id, false, mockLogger)).rejects.toThrow(
      "Order Not Found",
    );

    expect(OrderItems.getItems).not.toHaveBeenCalled();
    expect(sendToQueue).not.toHaveBeenCalled();
  });

  it("should throw OrderAlreadyCancelledError when order is already cancelled", async () => {
    const order_id = "abc123";
    Order.getStateById.mockResolvedValue({
      rowCount: 1,
      rows: [{ state: "cancelled" }],
    });

    await expect(cancel_Order(order_id, false, mockLogger)).rejects.toThrow(
      "Order Already Cancelled",
    );

    expect(OrderItems.getItems).not.toHaveBeenCalled();
    expect(sendToQueue).not.toHaveBeenCalled();
  });

  it("should throw InternalServerError when order has no items", async () => {
    const order_id = "abc123";
    Order.getStateById.mockResolvedValue({
      rowCount: 1,
      rows: [{ state: "brand_new" }],
    });
    OrderItems.getItems.mockResolvedValue([]);

    await expect(
      cancel_Order(order_id, false, mockLogger),
    ).rejects.toBeInstanceOf(InternalServerError);

    expect(mockLogger.error).toHaveBeenCalled();
    expect(sendToQueue).not.toHaveBeenCalled();
  });
});

describe("Update Order Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update order items and recalculate total", async () => {
    const order_id = "abc123";
    const store_id = 1;
    const currentItems = [
      { upc: 123, qty: 2 },
      { upc: 456, qty: 1 },
    ];
    const newItems = [
      { upc: 123, qty: 3 },
      { upc: 456, qty: 1 },
    ];
    const updatedItems = [{ upc: 123, qty: 3 }];
    const updateResult = { rowCount: 1 };

    Order.getById.mockResolvedValue([
      { id: order_id, state: "brand_new", store_id },
    ]);
    OrderItems.getAllAboutItems.mockResolvedValue([
      { upc: 123, quantity: 2 },
      { upc: 456, quantity: 1 },
    ]);
    checkItemUpdate.mockReturnValue({
      isSame: false,
      updatedItems,
    });
    performUpdates.mockResolvedValue(updateResult);

    const result = await update_order(
      {
        order_id,
        items: newItems,
        service_option_hold_id: 999,
      },
      mockLogger,
    );

    expect(result).toEqual(updateResult);
    expect(Order.getById).toHaveBeenCalledWith(order_id);
    expect(OrderItems.getAllAboutItems).toHaveBeenCalledWith(order_id);
    expect(checkItemUpdate).toHaveBeenCalledWith(
      currentItems,
      newItems,
      mockLogger,
    );
    expect(performUpdates).toHaveBeenCalledWith(
      updatedItems,
      order_id,
      store_id,
      mockLogger,
    );
  });

  it("should return undefined when items are unchanged", async () => {
    const order_id = "abc123";
    const store_id = 1;
    const items = [{ upc: 123, qty: 2 }];

    Order.getById.mockResolvedValue([
      { id: order_id, state: "brand_new", store_id },
    ]);
    OrderItems.getAllAboutItems.mockResolvedValue([{ upc: 123, quantity: 2 }]);
    checkItemUpdate.mockReturnValue({
      isSame: true,
      updatedItems: items,
    });

    const result = await update_order(
      {
        order_id,
        items,
      },
      mockLogger,
    );

    expect(result).toBeUndefined();
    expect(performUpdates).not.toHaveBeenCalled();
  });

  it("should throw CannotModifyOrderError when order state cannot be modified", async () => {
    const order_id = "abc123";

    Order.getById.mockResolvedValue([
      { id: order_id, state: "cancelled", store_id: 1 },
    ]);

    await expect(
      update_order(
        {
          order_id,
          items: [{ upc: 123, qty: 2 }],
        },
        mockLogger,
      ),
    ).rejects.toThrow("Order cannot be modified after it's picked");

    expect(OrderItems.getAllAboutItems).not.toHaveBeenCalled();
    expect(checkItemUpdate).not.toHaveBeenCalled();
    expect(performUpdates).not.toHaveBeenCalled();
  });

  it("should throw OrderNotFoundError when order does not exist", async () => {
    const order_id = "abc123";

    Order.getById.mockResolvedValue([]);

    await expect(
      update_order(
        {
          order_id,
          items: [{ upc: 123, qty: 2 }],
        },
        mockLogger,
      ),
    ).rejects.toThrow("Order Not Found");

    expect(OrderItems.getAllAboutItems).not.toHaveBeenCalled();
    expect(checkItemUpdate).not.toHaveBeenCalled();
    expect(performUpdates).not.toHaveBeenCalled();
  });

  it("should throw CannotModifyOrderError when items array is empty", async () => {
    const order_id = "abc123";

    Order.getById.mockResolvedValue([
      { id: order_id, state: "brand_new", store_id: 1 },
    ]);

    await expect(
      update_order(
        {
          order_id,
          items: [],
        },
        mockLogger,
      ),
    ).rejects.toThrow("Order cannot be modified after it's picked");

    expect(OrderItems.getAllAboutItems).toHaveBeenCalledWith(order_id);
    expect(checkItemUpdate).not.toHaveBeenCalled();
    expect(performUpdates).not.toHaveBeenCalled();
  });
});
