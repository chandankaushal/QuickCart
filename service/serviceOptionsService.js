const ServiceOptions = require("../models/serviceOptionModel");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

async function getServiceOptions(store_id, log = logger) {
  const { rows: service_options } = await ServiceOptions.getServiceOptions(
    store_id
  );
  log.info(
    { service_options, store_id },
    "Service Options fetched successfully for the store"
  );
  if (service_options.length === 0) {
    console.log("here");
    throw new ExpressError(
      "No service Options for this store",
      400,
      "NOT_FOUND"
    );
  }
  return service_options;
}

async function reserveServiceOption(service_option_id, user_id) {
  const reserveServiceOptionResponse =
    await ServiceOptions.reserveServiceOption(service_option_id, user_id);
  return reserveServiceOptionResponse;
}

module.exports = { getServiceOptions, reserveServiceOption };
