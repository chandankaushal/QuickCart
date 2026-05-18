const {
  ServiceOptionNotFoundError,
  ServiceOptionAlreadyTakenError,
} = require("../errors/serviceOptionError");
const ServiceOptions = require("../models/serviceOptionModel");
const { InternalServerError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

async function getServiceOptions(store_id, log = logger) {
  const { rows: service_options } =
    await ServiceOptions.getServiceOptions(store_id);
  log.info(
    { service_options, store_id },
    "Service Options fetched successfully for the store",
  );
  if (service_options.length === 0) {
    throw new ServiceOptionNotFoundError();
  }
  return service_options;
}

async function reserveServiceOption(service_option_id, user_id, log = logger) {
  const serviceOptionAvailable =
    await ServiceOptions.serviceOptionAvailableById(service_option_id);
  if (serviceOptionAvailable.length == 0) {
    throw new ServiceOptionNotFoundError();
  }
  if (!serviceOptionAvailable[0].available) {
    throw new ServiceOptionAlreadyTakenError();
  }
  const { rows: service_option_hold_info } =
    await ServiceOptions.reserveServiceOption(service_option_id, user_id);
  if (service_option_hold_info.length === 0) {
    throw new InternalServerError();
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

async function getPickupWindowByHoldId(hold_id, log = logger) {
  const rows = await ServiceOptions.getPickupWindowByHoldId(hold_id);
  if (!rows.length) {
    log.warn({ hold_id }, "No pickup window found for hold");
    return null;
  }
  const row = rows[0];
  return {
    starts_at:
      row.starts_at instanceof Date
        ? row.starts_at.toISOString()
        : row.starts_at,
    ends_at:
      row.ends_at instanceof Date ? row.ends_at.toISOString() : row.ends_at,
    service_option_id: row.service_option_id,
  };
}

module.exports = {
  getServiceOptions,
  reserveServiceOption,
  getPickupWindowByHoldId,
};
