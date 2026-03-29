const { ExpressError } = require("../utils/ExpressError");
class ServiceOptionHoldNotFoundError extends ExpressError {
  constructor() {
    super(
      "Service option hold not found",
      404,
      "SERVICE_OPTION_HOLD_NOT_FOUND",
    );
  }
}
class ServiceOptionHoldExpiredError extends ExpressError {
  constructor() {
    super(
      "Service Options hold is expired",
      404,
      "SERVICE_OPTIONS_HOLD_EXPIRED",
    );
  }
}

class ServiceOptionNotFoundError extends ExpressError {
  constructor() {
    super("No service Options for this store", 400, "NOT_FOUND");
  }
}

class ServiceOptionAlreadyTakenError extends ExpressError {
  constructor() {
    super(
      "This service Option is already taken",
      400,
      "SERVICE_OPTION_ALREADY_TAKEN",
    );
  }
}

module.exports = {
  ServiceOptionHoldNotFoundError,
  ServiceOptionHoldExpiredError,
  ServiceOptionNotFoundError,
  ServiceOptionAlreadyTakenError,
};
