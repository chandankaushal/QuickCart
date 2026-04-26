const {
  OrderNotFoundError,
  OrderItemsNotFoundError,
} = require("../errors/orderErrors");
const OrderItems = require("../models/orderItemsModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const calculateOrderTotal = require("../service/calculateOrderTotal");
const {
  checkProductStock,
  updateQtyinDb,
} = require("../service/productService");
const logger = require("../utils/logger");
const withTransaction = require("../utils/withTransaction");

function checkItemUpdate(oldItems, newItems, log = logger) {
  const oldItemsMap = new Map(oldItems.map((item) => [item.upc, item]));
  log.info(
    `Old items length ${oldItems.length}. New Items length ${newItems.length}`,
  );
  let isSame = oldItems.length === newItems.length;

  const updatedItems = newItems.map((newItem) => {
    const oldItem = oldItemsMap.get(newItem.upc);

    // Brand new item
    if (!oldItem) {
      log.info(`Brand new Item`);
      isSame = false;
      return {
        upc: newItem.upc,
        qty: newItem.qty,
      };
    }

    // Same item, same qty
    if (oldItem.qty === newItem.qty) {
      log.info(`Same Item`);
      return {
        upc: oldItem.upc,
        qty: oldItem.qty,
      };
    }

    // Same UPC, qty changed
    isSame = false;
    log.info(`Same UPC qty is changed`);
    return {
      upc: newItem.upc,
      qty: newItem.qty,
    };
  });

  return {
    isSame,
    updatedItems,
  };
}

async function performUpdates(updatedItems, order_id, store_id, log = logger) {
  const withTransactionResponse = await withTransaction(async (client) => {
    let order_items = await OrderItems.getItems(order_id, client);
    if (!order_items || order_items.length <= 0) {
      throw new OrderItemsNotFoundError();
    }

    await Product.addProducts(order_items, client); // Add products back to DB
    await checkProductStock(updatedItems, store_id, log, client);
    log.info("Checked Stock. Items are available");
    await updateQtyinDb(updatedItems, store_id, client);
    log.info("Updated Stock DB for new Items");

    const order_total = await calculateOrderTotal(
      updatedItems,
      store_id,
      client,
    );
    log.info(`New Order Total is ${order_total}`);
    await Order.updateTotal(order_total, order_id, client);

    await OrderItems.deleteOrder(order_id, client);

    await OrderItems.addItems(
      {
        order_id: order_id,
        items: updatedItems,
        location_code: store_id,
      },
      client,
    );
    log.info("New Items added in Order Items DB");
  });
  return withTransactionResponse;
  // // Check new Stock

  // //Update DB

  // // calc total

  // //update order total

  // return response that the update has been performed.
}

module.exports = { checkItemUpdate, performUpdates };
