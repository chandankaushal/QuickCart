const ServiceOptions = require("../models/serviceOptionModel");
const { ExpressError } = require("../utils/ExpressError");

async function getServiceOptions(store_id) {
  let response = ServiceOptions.getServiceOptions(store_id);
  if (response.rowCount == 0) {
    throw new ExpressError(
      "No service Options for this store",
      400,
      "NOT_FOUND"
    );
  }
  return response;
}

async function reserveServiceOption(service_option_id, user_id) {
  const reserveServiceOptionResponse =
    await ServiceOptions.reserveServiceOption(service_option_id, user_id);
  return reserveServiceOptionResponse;
}

module.exports = { getServiceOptions, reserveServiceOption };
