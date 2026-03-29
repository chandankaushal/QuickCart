const { StoreNotFoundError } = require("../errors/storeErrors");
const { Stores } = require("../models/storeModel");
const logger = require("../utils/logger");

async function getStores(zip_code, street, log = logger) {
  log.info(`Looking up Stores for ${zip_code}`);
  let response = await Stores.getStoresByZip(zip_code, street);
  if (response.rowCount <= 0) {
    throw new StoreNotFoundError();
  }
  log.info(`Found ${response.rowCount} Stores for zip ${zip_code}`);
  return response;
}

module.exports = { getStores };
