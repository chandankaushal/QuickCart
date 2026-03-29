const { ExpressError } = require("../utils/ExpressError");

class AllItemsNotFoundError extends ExpressError {
  constructor() {
    super(
      "None of the items you requested are available",
      400,
      "ALL_ITEMS_NOT_FOUND_ERROR",
    );
  }
}
class ItemNotFoundError extends ExpressError {
  constructor(message = "Item Not Found", code = "ITEM_NOT_FOUND") {
    super(message, 404, code);
  }
}

module.exports = { AllItemsNotFoundError, ItemNotFoundError };
