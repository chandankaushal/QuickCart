const { Stores } = require("../models/storeModel");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

async function getStoresService(zip_code, street, log = logger) {
  log.info(`Looking up Stores for ${zip_code}`);
  let response = await Stores.getStoresByZip(zip_code, street);
  if (response.rowCount <= 0) {
    throw new ExpressError("No stores for this zip", 400, "NO_STORES_FOUND");
  }
  log.info(`Found ${response.rowCount} Stores for zip ${zip_code}`);
  return response;
}

module.exports = { getStoresService };
