const {
  ServiceOptionHoldNotFoundError,
  ServiceOptionHoldExpiredError,
  ServiceOptionNotFromSameStoreError,
  ServiceOptionNotFoundError,
} = require("../errors/serviceOptionError");
const ServiceOptions = require("../models/serviceOptionModel");
const ServiceOptionHold = require("../models/serviceOptionsHoldModel");
const logger = require("../utils/logger");

async function isServiceOptionHoldValid(id, store_id, log = logger) {
  log.info("checking if the hold is not expired");

  let result = await ServiceOptionHold.holdById(id);

  if (!result || !result.expires_at) {
    throw new ServiceOptionHoldNotFoundError();
  }
  // console.log(result.is_option_taken);
  if (result.is_option_taken) {
    throw new ServiceOptionHoldExpiredError();
  }

  log.info({ service_option_hold_id: id }, "Service Option Hold is in the DB");

  const expiresAt = new Date(result.expires_at);
  const now = new Date();
  const service_option_id = result.service_option_id;

  if (now > expiresAt) {
    throw new ServiceOptionHoldExpiredError();
  }
  const store =
    await ServiceOptions.getStoreForServiceOption(service_option_id);
  if (!store.length) {
    throw new ServiceOptionNotFoundError();
  }
  if (store[0].store_id != store_id) {
    // Release the option
    log.info({ service_option_id }, "Releasing the Service Option");
    await ServiceOptions.releaseServiceOption(service_option_id);
    // throw Error
    throw new ServiceOptionNotFromSameStoreError();
  }

  return true;
}

async function markServiceOptionHoldTaken(id, client = null, log = logger) {
  log.info({ service_option_hold_id: id }, "Marking hold as expired");
  let response = await ServiceOptionHold.updateServiceOptionHold(id, client);

  if (response.rowCount === 0) {
    throw new ServiceOptionHoldNotFoundError();
  }
  log.info({ service_option_hold_id: id }, "Marked Service Option Hold Taken");
  return response;
}

module.exports = { isServiceOptionHoldValid, markServiceOptionHoldTaken };
