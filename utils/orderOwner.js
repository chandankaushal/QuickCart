const Order = require("../models/orderModel");
const { ExpressError } = require("./ExpressError");
const logger = require("./logger");

async function isOrderOwner(order_id, user_id, log = logger) {
  let orderResponse = await Order.getById(order_id);
  log.info({ order_id }, "Checking Owner");
  if (orderResponse[0].user_id != user_id) {
    throw new ExpressError(
      "You do not have permission to cancel this order",
      400,
      "UNAUTHORIZED",
    );
  }
  return true;
}

module.exports = isOrderOwner;
