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

    // put the order in the DB
    const orderResponse = await Order.pickupOrder(
      order_id,
      storeId,
      service_option_hold_id,
      user_id,
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
async function cancel_Order(order_id) {
  let response = await Order.transitionStateById(order_id, "cancelled");
  return response;
}

module.exports = { create_pickup_order, cancel_Order };
