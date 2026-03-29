const { ExpressError } = require("../utils/ExpressError");
class OrderAlreadyCancelledError extends ExpressError {
  constructor() {
    super("Order Already Cancelled", 400, "ORDER_ALREADY_CANCELLED");
  }
}
class OrderNotFoundError extends ExpressError {
  constructor() {
    super("Order Not Found", 404, "ORDER_NOT_FOUND");
  }
}

class OrderAlreadyDeliveredError extends ExpressError {
  constructor() {
    super("Order is already delivered", 400, "ORDER_ALREADY_DELIVERED");
  }
}

module.exports = {
  OrderNotFoundError,
  OrderAlreadyCancelledError,
  OrderAlreadyDeliveredError,
};
