const { StoreNotFoundError } = require("../errors/storeErrors");
const { Stores } = require("../models/storeModel");
const logger = require("../utils/logger");

async function validateStore(store_id, log = logger) {
  const storeId = Number(store_id);
  if (!Number.isInteger(storeId) || !store_id) {
    throw new StoreNotFoundError();
  }
  log.info({ storeId }, "Checking if Store Exists");
  let storeResponse = await Stores.getStoreById(storeId);
  if (storeResponse.length === 0) {
    throw new StoreNotFoundError();
  }
  return storeResponse;
}

module.exports = validateStore;
