const { StoreNotFoundError } = require("../errors/storeErrors");
const { Stores } = require("../models/storeModel");
const logger = require("../utils/logger");
const { withCache } = require("../utils/withCache");

const CACHE_TTL = 60 * 5;

async function getStores(zip_code, street, log = logger) {
  const cacheKey = `store:info:${zip_code}:${street || ""}`;
  return await withCache(
    cacheKey,
    async (zip, st) => {
      let response = await Stores.getStoresByZip(zip, st);
      if (response.rowCount <= 0) {
        throw new StoreNotFoundError();
      }
      return response.rows;
    },
    CACHE_TTL,
    log,
    zip_code,
    street,
  );
}

module.exports = { getStores };
