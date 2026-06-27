const {
  OrderAlreadyCancelledError,
  OrderNotFoundError,
  CannotModifyOrderError,
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
const { getPickupWindowByHoldId } = require("./serviceOptionsService");
const { InternalServerError } = require("../utils/ExpressError");
const { checkItemUpdate, performUpdates } = require("../utils/checkItemUpdate");
const { withCache } = require("../utils/withCache");
const createCheckoutSessionService = require("./paymentService");

const TTL = 60 * 5;

async function create_pickup_order(
  order_id,
  store_id,
  service_option_hold_id,
  items,
  user_id,
  needsWebhook = false,
  collect_payment,
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

  //DB Updates
  const orderResult = await withTransaction(async (client) => {
    //check if the items are available
    await checkProductStock(items, store_id, log, client);
    await markServiceOptionHoldTaken(service_option_hold_id, client);

    // Subtract the items from Products table
    await updateQtyinDb(items, store_id, client, log);
    // Calculate Total
    const order_total = await calculateOrderTotal(items, store_id, client);
    // put the order in the DB
    let state = collect_payment === true ? "awaiting_payment" : "brand_new";
    const orderResponse = await Order.create(
      order_id,
      service_type,
      store_id,
      service_option_hold_id,
      user_id,
      order_total,
      state,
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

    return { orderResponse, order_total };
  });

  if (collect_payment === true) {
    let session = await createCheckoutSessionService(
      order_id,
      orderResult.order_total,
      log,
    );
    return {
      order_id: order_id,
      url: session.url,
      message: "Please complete your payment",
    };
  }

  return orderResult;
}
async function cancel_Order(order_id, needsWebhook, log = logger) {
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
    log.error({ order_id }, "No items found in the order_items DB");
    throw new InternalServerError();
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

    return response;
  });
  if (!needsWebhook) {
    log.info(
      { order_id },
      `needsWebhook is ${needsWebhook}. Skipping sending webhook`,
    );
    return cancelOrderResult;
  }
  // Move this to Queue
  await sendToQueue(
    { id: order_id, state: final_state },
    EVENT_GROUP_TYPES.ORDER_UPDATED,
  );
  return cancelOrderResult;
}

async function get_order(order_id, log = logger) {
  const cacheKey = `order:info:${order_id}`;
  return await withCache(
    cacheKey,
    async (orderId) => {
      const response = await Order.getById(orderId);
      if (response.length === 0) {
        throw new OrderNotFoundError();
      }
      const order = response[0];
      const itemRows = await OrderItems.getAllAboutItems(order.id);
      const items = itemRows.map((row) => ({
        upc: row.upc,
        qty: row.quantity,
        unit_price_cents: row.unit_price,
      }));
      let pickup_slot = null;
      if (order.service_option_hold_id) {
        pickup_slot = await getPickupWindowByHoldId(
          order.service_option_hold_id,
        );
      }
      const result = { ...order, items, pickup_slot };
      return result;
    },
    TTL,
    log,
    order_id,
  );
}

async function update_order(updatePayload, log = logger) {
  let response = await Order.getById(updatePayload.order_id);
  if (!response || response.length === 0) {
    throw new OrderNotFoundError();
  }
  let order = response[0];
  log.info(
    { order_id: order.id },
    `Order Found in the DB. Order state is ${order.state}`,
  );

  if (
    order.state !== "brand_new" &&
    order.state !== "acknowledged" &&
    order.state !== "picking"
  ) {
    log.error(`Order state ${order.state} does not allow modification`);
    throw new CannotModifyOrderError();
  }
  //Needs to make sure if the user is passing existing service option then okay, but if its a new one then i have to validate again.

  if (
    updatePayload.service_option_hold_id &&
    updatePayload.service_option_hold_id !== order.service_option_hold_id
  ) {
    await isServiceOptionHoldValid(
      updatePayload.service_option_hold_id,
      order.store_id,
      order.user_id,
      log,
    );
    await Order.updateServiceOptionHoldId(
      updatePayload.service_option_hold_id,
      order.id,
    );
    await markServiceOptionHoldTaken(updatePayload.service_option_hold_id, log);
    log.info({ order_id: order.id }, "Updated service option hold on order");
  }

  //Check if any items are updated.
  log.info(
    { order_id: order.id },
    `Looking up for items in the Order Items in the DB`,
  );
  const current_items = await OrderItems.getAllAboutItems(order.id);
  //This returns directly the rows array.
  let currentItems = current_items.map((item) => {
    return {
      upc: item.upc,
      qty: item.quantity,
    };
  });

  const new_items = updatePayload.items;
  if (!updatePayload.items || updatePayload.items.length <= 0) {
    throw new CannotModifyOrderError();
  }
  const { isSame, updatedItems } = checkItemUpdate(
    currentItems,
    new_items,
    log,
  );
  if (isSame) {
    log.info({ order_id: order.id }, `Same Items in the update order call.`);
    return;
  }

  let result = await performUpdates(
    updatedItems,
    order.id,
    order.store_id,
    log,
  ); //Perform the updates.

  return result;
}

module.exports = { create_pickup_order, cancel_Order, get_order, update_order };
