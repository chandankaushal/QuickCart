class ExpressError extends Error {
  constructor(message, statusCode = 500, code = "ERROR_NOT_HANDLED") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class UnauthorizedError extends ExpressError {
  constructor() {
    super("Invalid Token", 401, "Unauthorized");
  }
}
class ForbiddenError extends ExpressError {
  constructor() {
    super(
      "You do not have permission to access this resource",
      403,
      "FORBIDDEN",
    );
  }
}
class NotFoundError extends ExpressError {
  constructor() {
    super("The requested resource does not exist", 404, "NOT_FOUND");
  }
}
class OrderAlreadyCancelledError extends ExpressError {
  constructor() {
    super("Order Already Cancelled", 400, "ORDER_ALREADY_CANCELLED");
  }
}

module.exports = {
  ExpressError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  OrderAlreadyCancelledError,
};
