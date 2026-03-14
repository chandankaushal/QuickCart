const { Stores } = require("../models/storeModel");
const { ExpressError } = require("../utils/ExpressError");
const {
  isServiceOptionHoldValid,
  markServiceOptionHoldTaken,
} = require("./serviceOptionHoldService");
const Order = require("../models/orderModel");
const {
  checkProductStock,
  updateQtyinDb,
} = require("../service/productService");
const logger = require("../utils/logger");
const withTransaction = require("../utils/withTransaction");
const createOmsOrder = require("./relayService");
const OrderItems = require("../models/orderItemsModel");
const calculateOrderTotal = require("../service/calculateOrderTotal");
const Product = require("../models/productModel");
const sendWebhook = require("../utils/sendWebhook");
const ORDER_EVENT_TYPES = require("../utils/eventTypes");

async function create_pickup_order(
  order_id,
  store_id,
  service_option_hold_id,
  items,
  user_id,
  log = logger,
) {
  //check if the location is exists
  const storeId = Number(store_id);
  if (!Number.isInteger(storeId) || !store_id) {
    throw new ExpressError("Invalid store id", 400, "INVALID_STORE_ID");
  }
  log.info({ order_id, storeId }, "Checking if Store Exists");
  let storeResponse = await Stores.getStoreById(storeId);
  if (storeResponse.length === 0) {
    throw new ExpressError(
      "No Stores found for this location code",
      400,
      "NO_STORES_FOUND",
    );
  }
  //check if the hold is not expired
  log.info(
    { order_id, storeId, service_option_hold_id },
    "checking if the hold is not expired",
  );
  await isServiceOptionHoldValid(service_option_hold_id);

  //check if the items are available
  log.info({ items, storeId, order_id }, "checking product availabilty");
  const isProductAvailable = await checkProductStock(items, storeId);
  if (isProductAvailable.problems) {
    throw new ExpressError(
      `UPC ${isProductAvailable.data.map((el) => el.upc).join(",")}`,
      400,
      "ITEM_NOT_FOUND",
    );
  }
  //DB Updates
  let orderResult = await withTransaction(async (client) => {
    log.info(
      { service_option_hold_id, order_id, storeId },
      "Marking hold as expired",
    );
    await markServiceOptionHoldTaken(service_option_hold_id, client);

    // Subtract the items from Products table
    log.info({ order_id, items }, "Adjusting Stock");
    await updateQtyinDb(items, storeId, client);
    // Calculate Total
    const order_total = await calculateOrderTotal(items, storeId, client);
    // put the order in the DB
    const orderResponse = await Order.pickupOrder(
      order_id,
      storeId,
      service_option_hold_id,
      user_id,
      order_total,
      client,
    );
    // Put items in the order_items db
    log.info("Putting items in the Order items DB");
    await OrderItems.addItems(
      {
        order_id: order_id,
        items: items,
        location_code: storeId,
      },
      client,
    );
    let orderObj = {
      id: order_id,
      service_type: "pickup",
      user_id: user_id,
      state: "brand_new",
      service_option_hold_id: service_option_hold_id,
      created_at: new Date().toISOString(),
    };
    log.info({ order_id }, "Creating order in Order Management System");
    await createOmsOrder(orderObj);
    // Send Email to the customer with details of the items and the time of pickup
    // we create a new Obj with details and fetch the ETA from the service_option_hold_id

    return orderResponse;
  });

  if (orderResult.rowCount == 1 && orderResult.command === "INSERT") {
    log.info({ order_id }, "Order created");

    return orderResult;
  } else {
    throw new ExpressError(
      "There were some issues creating your order",
      500,
      "INTERNAL_SERVER_ERROR",
    );
  }
}
async function cancel_Order(order_id, source, log = logger) {
  //Check Owner
  //Only cancel Order if state is not cancelled
  const { rows, rowCount } = await Order.getStateById(order_id);
  if (rowCount === 0) {
    throw new ExpressError("Order does not exist", 400, "NO_ORDER");
  }
  const current_state = rows[0].state;
  if (current_state === "cancelled") {
    throw new ExpressError(
      "Order is already cancelled",
      400,
      "ORDER_ALREADY_CANCELLED",
    );
  }

  // Figure out what is in the order
  log.info({ order_id: order_id }, "Looking up Items in the Order");
  const items = await OrderItems.getItems(order_id);

  if (items.length === 0) {
    throw new Error("No items found in the order");
  }
  //Build what needs to be added back to the table and add the products back
  let cancelOrderResult = await withTransaction(async (client) => {
    await Product.addProducts(items, client);
    //cancel the order
    log.info({ order_id: order_id }, "Marking the order as canceled");
    let response = await Order.transitionStateById(
      order_id,
      "cancelled",
      client,
    );
    log.info({ order_id }, "Order has been cancelled");
    await OrderItems.deleteOrder(order_id, client);
    log.info({ order_id }, "Removed from Order Items DB");
    if (source === "OMS") {
      log.info({ order_id }, "Cancelled from OMS no need for webhook");
      return response;
    }
    await sendWebhook(
      { order_id, state: current_state },
      ORDER_EVENT_TYPES.ORDER_UPDATED,
      log,
    );
    return response;
  });
  return cancelOrderResult;
}

module.exports = { create_pickup_order, cancel_Order };
