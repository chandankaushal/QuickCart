const { Stores } = require("../models/storeModel");
const { ExpressError } = require("../utils/ExpressError");

async function getStoresService(zip_code, street) {
  if (!zip_code) {
    throw new ExpressError("No Zip Code", 400, "ZIP_NOT_PASSED");
  }
  let response = await Stores.getStoresByZip(zip_code, street);
  if (response.rowCount <= 0) {
    throw new ExpressError("No stores for this zip", 400, "NO_STORES_FOUND");
  }
  return response;
}

module.exports = { getStoresService };
