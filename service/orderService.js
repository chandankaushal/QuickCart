const {
  OrderAlreadyCancelledError,
  OrderNotFoundError,
} = require("../errors/orderErrors");
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
const OrderItems = require("../models/orderItemsModel");
const calculateOrderTotal = require("../service/calculateOrderTotal");
const Product = require("../models/productModel");
const sendToQueue = require("../queues/sendToQueue");
const EVENT_GROUP_TYPES = require("../queues/eventGroupTypes");
const validateStore = require("./validateStore");

async function create_pickup_order(
  order_id,
  store_id,
  service_option_hold_id,
  items,
  user_id,
  needsWebhook = false,
  log = logger,
) {
  const service_type = "pickup";
  //check if the location is exists
  await validateStore(store_id, log);
  //check if the hold is not expired

  await isServiceOptionHoldValid(
    service_option_hold_id,
    store_id,
    user_id,
    log,
  );

  //check if the items are available

  await checkProductStock(items, store_id);

  //DB Updates
  const orderResult = await withTransaction(async (client) => {
    await markServiceOptionHoldTaken(service_option_hold_id, client);

    // Subtract the items from Products table
    await updateQtyinDb(items, store_id, client, log);
    // Calculate Total
    const order_total = await calculateOrderTotal(items, store_id, client);
    // put the order in the DB
    const orderResponse = await Order.create(
      order_id,
      service_type,
      store_id,
      service_option_hold_id,
      user_id,
      order_total,
      client,
    );
    // Put items in the order_items db
    await OrderItems.addItems(
      {
        order_id: order_id,
        items: items,
        location_code: store_id,
      },
      client,
    );
    let orderObj = {
      id: order_id,
      service_type: service_type,
      user_id: user_id,
      state: "brand_new",
      service_option_hold_id: service_option_hold_id,
      created_at: new Date().toISOString(),
    };
    if (needsWebhook) {
      log.info({ order_id }, "Creating order in Order Management System");
      //Send the Webhook to Queue
      await sendToQueue(orderObj, EVENT_GROUP_TYPES.ORDER_CREATED);
    }
    //To-DO
    // Send Email to the customer with details of the items and the time of pickup
    // we create a new Obj with details and fetch the ETA from the service_option_hold_id

    return orderResponse;
  });

  return orderResult;
}
async function cancel_Order(order_id, source, log = logger) {
  //Only cancel Order if state is not cancelled
  const final_state = "cancelled";
  const { rows, rowCount } = await Order.getStateById(order_id);
  if (rowCount === 0) {
    throw new OrderNotFoundError();
  }
  const current_state = rows[0].state;
  if (current_state === final_state) {
    throw new OrderAlreadyCancelledError();
  }

  // Figure out what is in the order
  log.info({ order_id: order_id }, "Looking up Items in the Order");
  const items = await OrderItems.getItems(order_id);

  if (items.length === 0) {
    throw new Error();
  }
  //Build what needs to be added back to the table and add the products back
  let cancelOrderResult = await withTransaction(async (client) => {
    // Cancel Order
    log.info({ order_id: order_id }, "Marking the order as canceled");
    let response = await Order.transitionStateById(
      order_id,
      final_state,
      client,
    );
    if (response.rowCount === 0) {
      throw new OrderAlreadyCancelledError();
    }
    log.info({ order_id }, "Order has been cancelled");
    // Remove from OrderItems
    await OrderItems.deleteOrder(order_id, client);
    log.info({ order_id }, "Removed from Order Items DB");
    // Restock
    await Product.addProducts(items, client);
    if (source === "OMS") {
      log.info({ order_id }, "Cancelled from OMS no need for webhook");
      return response;
    }
    // Move this to Queue
    await sendToQueue(
      { id: order_id, state: final_state },
      EVENT_GROUP_TYPES.ORDER_UPDATED,
    );
    return response;
  });
  return cancelOrderResult;
}

async function get_order(order_id) {
  const response = await Order.getById(order_id);
  if (response.length === 0) {
    throw new OrderNotFoundError();
  }
  return response;
}

module.exports = { create_pickup_order, cancel_Order, get_order };
