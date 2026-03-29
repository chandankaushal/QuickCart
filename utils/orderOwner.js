const { OrderNotFoundError } = require("../errors/orderErrors");
const Order = require("../models/orderModel");
const { ForbiddenError } = require("./ExpressError");
const logger = require("./logger");

async function isOrderOwner(order_id, user_id, log = logger) {
  let orderResponse = await Order.getById(order_id);
  if (!Array.isArray(orderResponse) || orderResponse.length === 0) {
    throw new OrderNotFoundError();
  }
  log.info({ order_id }, "Checking Owner");
  if (
    String(orderResponse[0].user_id).toLowerCase() !==
    String(user_id).toLowerCase()
  ) {
    throw new ForbiddenError();
  }

  return true;
}

module.exports = isOrderOwner;
