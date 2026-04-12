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

class CannotModifyOrderError extends ExpressError {
  constructor() {
    super(
      "Order cannot be modified after it's picked",
      400,
      "ORDER_UPDATE_ERROR",
    );
  }
}

module.exports = {
  OrderNotFoundError,
  OrderAlreadyCancelledError,
  OrderAlreadyDeliveredError,
  CannotModifyOrderError,
};
