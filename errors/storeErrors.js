const { ExpressError } = require("../utils/ExpressError");
class StoreNotFoundError extends ExpressError {
  constructor() {
    super("No stores found", 400, "NO_STORES_FOUND");
  }
}

module.exports = { StoreNotFoundError };
