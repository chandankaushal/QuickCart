const { ExpressError } = require("../utils/ExpressError");
class ServiceOptionHoldNotFoundError extends ExpressError {
  constructor() {
    super(
      "Service option hold not found.",
      404,
      "SERVICE_OPTION_HOLD_NOT_FOUND",
    );
  }
}
class ServiceOptionHoldExpiredError extends ExpressError {
  constructor() {
    super("Service Option hold is expired", 400, "SERVICE_OPTION_HOLD_EXPIRED");
  }
}

class ServiceOptionNotFoundError extends ExpressError {
  constructor() {
    super("No service Options for this store", 400, "NO_SERVICE_OPTIONS");
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

class ServiceOptionNotFromSameStoreError extends ExpressError {
  constructor() {
    super(
      "This service Option does not belong to this store. Please reselect the Service Option",
      400,
      "SERVICE_OPTION_NOT_FROM_SAME_STORE",
    );
  }
}

module.exports = {
  ServiceOptionHoldNotFoundError,
  ServiceOptionHoldExpiredError,
  ServiceOptionNotFoundError,
  ServiceOptionAlreadyTakenError,
  ServiceOptionNotFromSameStoreError,
};
