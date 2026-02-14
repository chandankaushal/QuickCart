const ServiceOptions = require("../models/serviceOptionModel");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

async function getServiceOptions(store_id, log = logger) {
  const { rows: service_options } =
    await ServiceOptions.getServiceOptions(store_id);
  log.info(
    { service_options, store_id },
    "Service Options fetched successfully for the store",
  );
  if (service_options.length === 0) {
    throw new ExpressError(
      "No service Options for this store",
      400,
      "NOT_FOUND",
    );
  }
  return service_options;
}

async function reserveServiceOption(service_option_id, user_id, log = logger) {
  const serviceOptionAvailable =
    await ServiceOptions.serviceOptionAvailableById(service_option_id);
  if (serviceOptionAvailable.length == 0) {
    throw new ExpressError(
      "Please check the serviceOption ID",
      400,
      "INVALID_SERVICE_OPTION",
    );
  }
  if (!serviceOptionAvailable[0].available) {
    throw new ExpressError(
      "This service Option is already taken",
      400,
      "SERVICE_OPTION_ALREADY_TAKEN",
    );
  }
  const { rows: service_option_hold_info } =
    await ServiceOptions.reserveServiceOption(service_option_id, user_id);
  if (service_option_hold_info.length === 0) {
    throw new ExpressError(
      "There was an error in reserving this service option. Please try another one",
      500,
      "SERVICE_OPTION_RESERVED_ERROR",
    );
  }
  const { service_option_hold_id } = service_option_hold_info[0];
  log.info(
    {
      service_option: {
        hold_id: service_option_hold_id,
        service_option_id: service_option_id,
      },
    },
    `Service Option reserved`,
  );
  return service_option_hold_info;
}

module.exports = { getServiceOptions, reserveServiceOption };
