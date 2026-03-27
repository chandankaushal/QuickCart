const { Stores } = require("../models/storeModel");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

async function validateStore(store_id, log = logger) {
  const storeId = Number(store_id);
  if (!Number.isInteger(storeId) || !store_id) {
    throw new ExpressError("Invalid store id", 400, "INVALID_STORE_ID");
  }
  log.info({ storeId }, "Checking if Store Exists");
  let storeResponse = await Stores.getStoreById(storeId);
  if (storeResponse.length === 0) {
    throw new ExpressError(
      "No Stores found for this location code",
      400,
      "NO_STORES_FOUND",
    );
  }
  return storeResponse;
}

module.exports = validateStore;
